import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, setDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { CiviQMap } from "./CiviQMap";
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  MapPin, 
  Award, 
  UserCheck, 
  Bell, 
  Users, 
  Flame, 
  Briefcase, 
  RefreshCw, 
  Star, 
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle
} from "lucide-react";

interface Props {
  triggerToast: (icon: string, message: string) => void;
  userProfile: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function CiviQAuthorityDashboard({ triggerToast, userProfile }: Props) {
  const [issues, setIssues] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "map" | "performance">("inbox");
  const [inboxSubTab, setInboxSubTab] = useState<"my-assigned" | "ward-overview" | "unassigned">("my-assigned");
  const [sortOrder, setSortOrder] = useState<"priority" | "time">("priority");
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Helper to handle firestore errors with context
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const formatWard = (w: string) => {
    if (!w) return "Ward 7";
    const cleaned = w.trim();
    if (cleaned.toLowerCase().startsWith("ward ")) return cleaned;
    return `Ward ${cleaned}`;
  };

  const currentWard = formatWard(userProfile?.ward || "Ward 7");

  useEffect(() => {
    if (!userProfile?.uid) return;

    // Listen to ALL issues so we can display ward monitoring and self-assignment
    const qIssues = query(collection(db, "issues"));
    const unsubIssues = onSnapshot(qIssues, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIssues(arr);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "issues");
    });

    // Listen to registered authorities in the users collection
    const qAuths = query(
      collection(db, "users"),
      where("role", "==", "authority")
    );
    const unsubAuths = onSnapshot(qAuths, (snap) => {
      const arr = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setAuthorities(arr);
    }, (error) => {
      console.warn("Could not load authority users in real-time:", error);
    });

    // Listen for real-time notifications
    const qNotifs = query(collection(db, `notifications/${userProfile.uid}/items`));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(arr);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `notifications/${userProfile.uid}/items`);
    });

    return () => {
      unsubIssues();
      unsubAuths();
      unsubNotifs();
    };
  }, [userProfile?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Urgency & AI Risk Prioritizer Helper
  const getUrgencyScore = (issue: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    if (issue.upvotes > 0) {
      score += issue.upvotes * 3;
      reasons.push(`${issue.upvotes} citizens upvoted`);
    }
    
    const daysOpen = Math.max(0, (Date.now() - new Date(issue.createdAt || Date.now()).getTime()) / (1000 * 3600 * 24));
    if (daysOpen >= 1) {
      score += Math.floor(daysOpen) * 6;
      reasons.push(`${Math.floor(daysOpen)} days unresolved`);
    }
    
    if (issue.severity === "Critical") { 
      score += 45; 
      reasons.push("Critical severity label"); 
    } else if (issue.severity === "High") { 
      score += 30; 
      reasons.push("High severity label"); 
    } else if (issue.severity === "Medium") { 
      score += 15; 
      reasons.push("Medium severity label"); 
    } else { 
      score += 5; 
      reasons.push("Low severity label"); 
    }
    
    if (issue.category === "Roads" && issue.weatherForecast?.toLowerCase().includes("rain")) {
      score += 20;
      reasons.push("Heavy rain & water-logging monsoon risk");
    }

    if (issue.populationDensity > 20000) {
      score += 15;
      reasons.push("Densely populated high impact zone");
    }
    
    return { 
      score: Math.min(score, 100), 
      reasons,
      reasonText: `Urgency Score optimized by AI model: ${reasons.join(", ")}.` 
    };
  };

  // Status Handlers
  const handleUpdateStatus = async (issueId: string, newStatus: string, note: string) => {
    if (!newStatus) return;
    const path = `issues/${issueId}`;
    try {
      const issueRef = doc(db, "issues", issueId);
      const updates: any = { status: newStatus };
      if (newStatus === "Resolved") {
        updates.resolvedAt = new Date().toISOString();
        updates.pendingVerification = true;
      }
      await updateDoc(issueRef, updates);

      // Add to status history subcollection
      const historyRef = doc(collection(issueRef, "statusHistory"));
      await setDoc(historyRef, {
        status: newStatus,
        note,
        changedBy: `${userProfile.displayName} (${userProfile.designation})`,
        timestamp: new Date().toISOString()
      });

      triggerToast("✅", `Issue status updated to ${newStatus}!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // Self Assign Handler for Unassigned complaints in the ward
  const handleSelfAssign = async (issueId: string) => {
    const path = `issues/${issueId}`;
    try {
      const issueRef = doc(db, "issues", issueId);
      const assignedTo = {
        uid: userProfile.uid,
        name: userProfile.displayName,
        designation: userProfile.designation,
        department: userProfile.department,
        ward: userProfile.ward
      };
      
      await updateDoc(issueRef, {
        assignedOfficer: userProfile.displayName,
        assignedTo: assignedTo,
        status: "Acknowledged"
      });

      // Add to status history
      const historyRef = doc(collection(issueRef, "statusHistory"));
      await setDoc(historyRef, {
        status: "Acknowledged",
        note: `Self-assigned and claimed by official ${userProfile.displayName}`,
        changedBy: `${userProfile.displayName} (${userProfile.designation})`,
        timestamp: new Date().toISOString()
      });

      // Add to authorities subcollection
      await setDoc(doc(db, `authorities/${userProfile.uid}/assignedIssues`, issueId), {
        issueId,
        title: issues.find(i => i.id === issueId)?.title || "Claimed Complaint",
        status: "Acknowledged",
        assignedAt: new Date().toISOString()
      });

      triggerToast("🎯", "Issue successfully self-assigned to your jurisdiction!");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  // Filters for multi-view regulatory monitoring
  const myAssignedIssues = issues.filter(i => i.assignedTo?.uid === userProfile?.uid);
  
  const wardIssues = issues.filter(i => {
    const issueWardNorm = formatWard(i.ward);
    const userWardNorm = formatWard(userProfile?.ward);
    return issueWardNorm === userWardNorm;
  });

  const unassignedWardIssues = issues.filter(i => {
    const issueWardNorm = formatWard(i.ward);
    const userWardNorm = formatWard(userProfile?.ward);
    return issueWardNorm === userWardNorm && (!i.assignedTo || !i.assignedTo.uid);
  });

  // Decide current active sub-list of issues in inbox
  let activeInboxIssues = [];
  if (inboxSubTab === "my-assigned") {
    activeInboxIssues = myAssignedIssues;
  } else if (inboxSubTab === "ward-overview") {
    activeInboxIssues = wardIssues;
  } else {
    activeInboxIssues = unassignedWardIssues;
  }

  // Sorting
  const sortedInboxIssues = [...activeInboxIssues].sort((a, b) => {
    if (sortOrder === "priority") {
      return getUrgencyScore(b).score - getUrgencyScore(a).score;
    } else {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  // Calculate live statistics
  const totalAssignedCount = myAssignedIssues.length;
  const totalResolvedCount = myAssignedIssues.filter(i => i.status === "Resolved" || i.status === "Closed").length;
  
  const compliantAssignedCount = myAssignedIssues.filter(i => {
    const createdTime = new Date(i.createdAt).getTime();
    const resolvedTime = i.resolvedAt ? new Date(i.resolvedAt).getTime() : Date.now();
    const daysOpen = (resolvedTime - createdTime) / (1000 * 3600 * 24);
    return daysOpen <= (i.slaDays || 7);
  }).length;

  const slaCompliance = totalAssignedCount > 0 ? Math.round((compliantAssignedCount / totalAssignedCount) * 100) : 100;

  // Real dynamic leaderboard built entirely from registered authorities and live Firestore issue records
  const leaderboardList = authorities.map((auth: any) => {
    const authIssues = issues.filter(i => i.assignedTo?.uid === auth.uid);
    const resolvedIssues = authIssues.filter(i => i.status === "Resolved" || i.status === "Closed");
    const totalCount = authIssues.length;
    const resolvedCount = resolvedIssues.length;

    // Calculate SLA Compliance
    const compliantCount = authIssues.filter(i => {
      const createdTime = new Date(i.createdAt).getTime();
      const resolvedTime = i.resolvedAt ? new Date(i.resolvedAt).getTime() : Date.now();
      const daysOpen = (resolvedTime - createdTime) / (1000 * 3600 * 24);
      return daysOpen <= (i.slaDays || 7);
    }).length;

    const slaComplianceVal = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 100;
    const scoreVal = (resolvedCount * 25) + (slaComplianceVal * 5);

    return {
      uid: auth.uid,
      displayName: auth.displayName || "Officer",
      designation: auth.designation || "Assistant Commissioner",
      department: auth.department || "Sanitation",
      ward: auth.ward || "Ward 7",
      resolvedCount,
      slaCompliance: slaComplianceVal,
      score: scoreVal
    };
  });

  // Ensure current user is always displayed on the leaderboard if not loaded yet
  const userExistsInList = leaderboardList.some(o => o.uid === userProfile?.uid);
  if (!userExistsInList && userProfile?.uid) {
    const userScore = (totalResolvedCount * 25) + (slaCompliance * 5);
    leaderboardList.push({
      uid: userProfile.uid,
      displayName: userProfile.displayName || "Officer",
      designation: userProfile.designation || "Assistant Commissioner",
      department: userProfile.department || "Sanitation",
      ward: userProfile.ward || "Ward 7",
      resolvedCount: totalResolvedCount,
      slaCompliance: slaCompliance,
      score: userScore
    });
  }

  // Sort by score descending to assign current ranks
  leaderboardList.sort((a, b) => b.score - a.score);

  // Split out podium top 3
  const topPodium = leaderboardList.slice(0, 3);
  const remainingRanks = leaderboardList.slice(3);

  // Initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "OS";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 bg-[#F9FBF7]">
      {/* Title & Brand Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>SECURE COMMAND & DISPATCH CENTER</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">Official Command & Dispatch</h1>
        <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
          Manage assigned service tickets, monitor real-time ward operations, and view dynamic compliance stats linked directly to the municipal service-level agreements (SLA).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SIDEBAR PROFILE CARD */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-emerald-800 border-4 border-emerald-200/50 rounded-full flex items-center justify-center text-emerald-50 text-4xl font-extrabold shadow-lg">
                {getInitials(userProfile?.displayName)}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" title="Active On Duty"></span>
            </div>
            
            <h2 className="text-xl font-extrabold text-emerald-950 text-center leading-tight mb-1">
              {userProfile?.displayName || "Officer S.K. Sharma"}
            </h2>
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/50 font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              {userProfile?.designation || "Chief Inspector"}
            </p>

            {/* Duty Status Switcher */}
            <div className="flex items-center justify-between w-full p-2 bg-emerald-50/50 border border-emerald-200/40 rounded-xl text-xs mb-4">
              <span className="text-emerald-800/70 font-medium ml-1">Duty Status</span>
              <button 
                onClick={() => setIsOnDuty(!isOnDuty)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  isOnDuty 
                    ? "bg-emerald-800 text-white shadow-sm" 
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200/50"
                }`}
              >
                {isOnDuty ? "ON DUTY" : "OFF DUTY"}
              </button>
            </div>

            <div className="bg-emerald-50/30 rounded-2xl p-4 w-full text-xs space-y-3 border border-emerald-900/5">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 font-medium">Department</span>
                <span className="font-bold text-emerald-950">{userProfile?.department || "Sanitation"}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 font-medium">Jurisdiction</span>
                <span className="font-bold text-emerald-950">{currentWard}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 font-medium">Status</span>
                <span className="text-emerald-800 font-extrabold uppercase text-[10px] px-2.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded-full">
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-emerald-800/60 font-medium">Clearance Level</span>
                <span className="font-semibold text-emerald-950">Class I Officer</span>
              </div>
            </div>

            {/* AI Auto-Dispatch Notice */}
            <div className="mt-5 p-3.5 bg-emerald-50 border border-emerald-200/40 rounded-2xl text-[11px] text-emerald-800 flex gap-2">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">AI Auto-Dispatch Active</span>
                <p className="text-emerald-800/60 mt-0.5">Every new report is automatically routed to officers based on Category & Ward load balancing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TOP STATS CARDS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm transition hover:shadow-md">
              <div className="text-xs font-semibold text-emerald-800/50 uppercase tracking-wider">Total Assigned</div>
              <div className="text-4xl font-black text-emerald-950 mt-2 font-mono">{totalAssignedCount}</div>
            </div>
            
            <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm transition hover:shadow-md">
              <div className="text-xs font-semibold text-emerald-800/50 uppercase tracking-wider">Resolved</div>
              <div className="text-4xl font-black text-emerald-800 mt-2 font-mono">{totalResolvedCount}</div>
            </div>
            
            <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm transition hover:shadow-md">
              <div className="text-xs font-semibold text-emerald-800/50 uppercase tracking-wider">SLA Compliance</div>
              <div className={`text-4xl font-black mt-2 font-mono ${slaCompliance < 80 ? "text-rose-600" : "text-emerald-800"}`}>
                {slaCompliance}%
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm transition hover:shadow-md relative group cursor-pointer">
              <div className="text-xs font-semibold text-emerald-800/50 uppercase tracking-wider flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="text-4xl font-black text-emerald-950 mt-2 font-mono">{notifications.length}</div>
              
              {/* Real-time Notification Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-emerald-900/10 rounded-3xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50 overflow-hidden">
                <div className="p-4 border-b bg-emerald-50/50 font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-700" />
                  <span>Duty Alerts Inbox</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-sm text-emerald-800/40 text-center font-medium">No live dispatch alerts</div>
                  ) : (
                    [...notifications]
                      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(n => (
                        <div 
                          key={n.id} 
                          className={`p-3 border-b border-emerald-900/5 hover:bg-emerald-50/20 cursor-pointer transition ${!n.read ? 'bg-emerald-50/30' : ''}`}
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, `notifications/${userProfile.uid}/items`, n.id), { read: true });
                            } catch (e) {
                              console.error(e);
                            }
                            setActiveTab("inbox");
                          }}
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>New AI Auto-Assignment</span>
                          </div>
                          <div className="text-xs text-emerald-800/80 line-clamp-2">{n.issueTitle} ({n.issueCategory})</div>
                          <span className="text-[9px] text-emerald-800/40 block mt-1">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN NAVIGATION TABS */}
          <div className="flex border-b border-emerald-900/10 gap-6">
            <button 
              className={`pb-3 px-2 font-bold text-sm transition-all relative ${
                activeTab === "inbox" 
                  ? "text-emerald-950 font-extrabold" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("inbox")}
            >
              Issue Inbox
              {activeTab === "inbox" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-800 rounded-full" />}
            </button>
            
            <button 
              className={`pb-3 px-2 font-bold text-sm transition-all relative ${
                activeTab === "map" 
                  ? "text-emerald-950 font-extrabold" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("map")}
            >
              Map View
              {activeTab === "map" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-800 rounded-full" />}
            </button>
            
            <button 
              className={`pb-3 px-2 font-bold text-sm transition-all relative ${
                activeTab === "performance" 
                  ? "text-emerald-950 font-extrabold" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("performance")}
            >
              Performance Leaderboard
              {activeTab === "performance" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-800 rounded-full" />}
            </button>
          </div>

          {/* TAB 1: ISSUE INBOX & COMPLAINT MONITORING */}
          {activeTab === "inbox" && (
            <div className="space-y-4">
              
              {/* SUB TAB SELECTORS FOR MONITORING EVERYTHING */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-200/40 shadow-inner">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setInboxSubTab("my-assigned")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      inboxSubTab === "my-assigned" 
                        ? "bg-emerald-800 text-white shadow-sm" 
                        : "bg-white text-emerald-800 border border-emerald-200/50 hover:bg-emerald-50"
                    }`}
                  >
                    My Assignments ({myAssignedIssues.length})
                  </button>
                  <button 
                    onClick={() => setInboxSubTab("ward-overview")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      inboxSubTab === "ward-overview" 
                        ? "bg-emerald-800 text-white shadow-sm" 
                        : "bg-white text-emerald-800 border border-emerald-200/50 hover:bg-emerald-50"
                    }`}
                  >
                    Ward {userProfile?.ward} Overview ({wardIssues.length})
                  </button>
                  <button 
                    onClick={() => setInboxSubTab("unassigned")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      inboxSubTab === "unassigned" 
                        ? "bg-rose-700 text-white shadow-sm" 
                        : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unassigned in Ward ({unassignedWardIssues.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-800/60 font-medium">Sort:</span>
                  <select 
                    className="text-xs border border-emerald-200 rounded-lg p-1.5 bg-white font-bold text-emerald-800" 
                    value={sortOrder} 
                    onChange={e => setSortOrder(e.target.value as any)}
                  >
                    <option value="priority">AI Priority Order</option>
                    <option value="time">Newest First</option>
                  </select>
                </div>
              </div>

              {/* UNASSIGNED SYSTEM BANNER */}
              {inboxSubTab === "unassigned" && unassignedWardIssues.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex gap-2 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-extrabold">🚨 Action Required: Unassigned Incidents in Ward</span>
                    <p className="mt-1 text-rose-700 font-medium">These complaints have not found a matching departmental official. As an active ward officer, you can self-assign these tasks to coordinate them.</p>
                  </div>
                </div>
              )}

              {/* ISSUES RENDER */}
              {sortedInboxIssues.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-emerald-200 p-16 text-center shadow-sm">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-emerald-800/50 font-medium">No assigned issues found for this category / jurisdiction.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedInboxIssues.map((issue) => (
                    <IssueRow 
                      key={issue.id} 
                      issue={issue} 
                      userProfile={userProfile}
                      onUpdate={handleUpdateStatus} 
                      onSelfAssign={handleSelfAssign}
                      urgency={getUrgencyScore(issue)} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE OFFICERS COMPLAINT MAP */}
          {activeTab === "map" && (
            <div className="bg-white p-2 rounded-3xl border border-emerald-900/10 shadow-sm h-[550px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-emerald-900/5 bg-emerald-50/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-950 flex items-center gap-2">
                    <MapPin className="text-emerald-800 w-5 h-5" />
                    Ward Incident Geolocation Radar
                  </h3>
                  <p className="text-xs text-emerald-800/60">Live monitoring of environmental, road, sanitation, and water infrastructure tickets in your ward.</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#1D3B1F] text-emerald-50 rounded-full font-mono uppercase tracking-wide">
                  WARD {userProfile?.ward || "7"} ZONE
                </span>
              </div>
              <div className="flex-1 relative">
                <CiviQMap triggerToast={triggerToast} />
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE LEADERBOARD */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              
              {/* HEADER DESIGN */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 rounded-[24px] text-white shadow-md border border-emerald-900/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                  <Award className="w-64 h-64" />
                </div>
                <h3 className="text-xl font-extrabold flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-300 fill-amber-300" />
                  Municipal Leaderboard & Honor Roll
                </h3>
                <p className="text-xs text-emerald-50 mt-1 max-w-xl">
                  Recognizing the hardest working civil officials resolving citizen complaints, adhering to SLA timelines, and keeping community satisfaction high.
                </p>
              </div>

            {/* DYNAMIC LEADERBOARD PODIUM / LIST */}
            {leaderboardList.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-dashed border-gray-300 p-12 text-center shadow-[var(--shadow)]">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No officials registered on the leaderboard yet.</p>
              </div>
            ) : leaderboardList.length === 1 ? (
              // Just 1 officer
              <div className="flex justify-center py-4">
                <div className="bg-gradient-to-b from-amber-50 to-white rounded-[24px] border-2 border-amber-300 shadow-lg p-8 max-w-md w-full flex flex-col items-center relative">
                  <div className="absolute -top-6 bg-amber-400 text-white text-base font-black w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    🥇
                  </div>
                  <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-amber-700 font-black text-2xl mb-3 shadow-inner">
                    {getInitials(leaderboardList[0].displayName)}
                  </div>
                  <h4 className="font-extrabold text-gray-950 text-base text-center flex items-center gap-1.5">
                    {leaderboardList[0].displayName}
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </h4>
                  <p className="text-xs text-amber-800 font-black uppercase tracking-wide mt-0.5">{leaderboardList[0].department} • {leaderboardList[0].ward}</p>
                  
                  <div className="mt-4 bg-amber-50/50 rounded-xl p-3 w-full text-xs space-y-1.5 border border-amber-200">
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Resolved</span>
                      <span className="font-bold text-amber-950">{leaderboardList[0].resolvedCount} issues</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">SLA Compliance</span>
                      <span className="font-bold text-green-700">{leaderboardList[0].slaCompliance}%</span>
                    </div>
                  </div>
                  <span className="mt-4 text-sm font-black text-amber-700 bg-amber-100 border border-amber-200 px-4 py-1.5 rounded-full shadow-sm">
                    {leaderboardList[0].score} Performance Points
                  </span>
                </div>
              </div>
            ) : leaderboardList.length === 2 ? (
              // 2 officers side-by-side
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full pt-4">
                {/* 1st Place */}
                <div className="bg-gradient-to-b from-amber-50 to-white rounded-[24px] border-2 border-amber-300 shadow-lg p-6 flex flex-col items-center relative">
                  <div className="absolute -top-4 bg-amber-400 text-white text-xs font-black w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow">
                    🥇
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-700 font-black text-lg mb-3">
                    {getInitials(leaderboardList[0].displayName)}
                  </div>
                  <h4 className="font-bold text-gray-950 text-sm text-center">{leaderboardList[0].displayName}</h4>
                  <p className="text-[10px] text-amber-800 font-bold uppercase">{leaderboardList[0].department} • {leaderboardList[0].ward}</p>
                  
                  <div className="mt-3 bg-amber-50/50 rounded-xl p-3 w-full text-xs space-y-1.5 border border-amber-150">
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">Resolved</span>
                      <span className="font-bold text-amber-950">{leaderboardList[0].resolvedCount} issues</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800 font-medium">SLA</span>
                      <span className="font-bold text-green-700">{leaderboardList[0].slaCompliance}%</span>
                    </div>
                  </div>
                  <span className="mt-3 text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full border">
                    {leaderboardList[0].score} pts
                  </span>
                </div>

                {/* 2nd Place */}
                <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 flex flex-col items-center relative">
                  <div className="absolute -top-4 bg-gray-200 text-gray-700 text-xs font-black w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow">
                    🥈
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-600 font-extrabold text-lg mb-3">
                    {getInitials(leaderboardList[1].displayName)}
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm text-center">{leaderboardList[1].displayName}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{leaderboardList[1].department} • {leaderboardList[1].ward}</p>
                  
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 w-full text-xs space-y-1.5 border">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Resolved</span>
                      <span className="font-bold text-gray-800">{leaderboardList[1].resolvedCount} issues</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">SLA</span>
                      <span className="font-bold text-blue-600">{leaderboardList[1].slaCompliance}%</span>
                    </div>
                  </div>
                  <span className="mt-3 text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border">
                    {leaderboardList[1].score} pts
                  </span>
                </div>
              </div>
            ) : (
              // Traditional 3-podium
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* 2ND PLACE */}
                {topPodium[1] && (
                  <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 flex flex-col items-center relative order-2 md:order-1 mt-4 md:mt-8">
                    <div className="absolute -top-4 bg-gray-200 text-gray-700 text-xs font-black w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow">
                      🥈
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-600 font-extrabold text-lg mb-3">
                      {getInitials(topPodium[1].displayName)}
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm text-center line-clamp-1">{topPodium[1].displayName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{topPodium[1].department} • {topPodium[1].ward}</p>
                    
                    <div className="mt-4 bg-gray-50 rounded-xl p-3 w-full text-xs space-y-1.5 border">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Resolved</span>
                        <span className="font-bold text-gray-800">{topPodium[1].resolvedCount} issues</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">SLA</span>
                        <span className="font-bold text-blue-600">{topPodium[1].slaCompliance}%</span>
                      </div>
                    </div>
                    <span className="mt-4 text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full border">
                      {topPodium[1].score} Performance Points
                    </span>
                  </div>
                )}

                {/* 1ST PLACE CHAMPION */}
                {topPodium[0] && (
                  <div className="bg-gradient-to-b from-amber-50 to-white rounded-[24px] border-2 border-amber-300 shadow-lg p-8 flex flex-col items-center relative order-1 md:order-2 transform md:-translate-y-2">
                    <div className="absolute -top-6 bg-amber-400 text-white text-base font-black w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                      🥇
                    </div>
                    <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-amber-700 font-black text-2xl mb-3 shadow-inner">
                      {getInitials(topPodium[0].displayName)}
                    </div>
                    <h4 className="font-black text-gray-950 text-base text-center flex items-center gap-1.5">
                      {topPodium[0].displayName}
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-xs text-amber-800 font-black uppercase tracking-wide mt-0.5">{topPodium[0].department} • {topPodium[0].ward}</p>
                    
                    <div className="mt-4 bg-amber-50/50 rounded-xl p-3 w-full text-xs space-y-1.5 border border-amber-200">
                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">Resolved</span>
                        <span className="font-bold text-amber-950">{topPodium[0].resolvedCount} issues</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">SLA Compliance</span>
                        <span className="font-bold text-green-700">{topPodium[0].slaCompliance}%</span>
                      </div>
                    </div>
                    <span className="mt-4 text-sm font-black text-amber-700 bg-amber-100 border border-amber-200 px-4 py-1.5 rounded-full shadow-sm">
                      {topPodium[0].score} Performance Points
                    </span>
                  </div>
                )}

                {/* 3RD PLACE */}
                {topPodium[2] && (
                  <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 flex flex-col items-center relative order-3 md:order-3 mt-4 md:mt-8">
                    <div className="absolute -top-4 bg-amber-100 text-amber-800 text-xs font-black w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow">
                      🥉
                    </div>
                    <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 font-extrabold text-lg mb-3">
                      {getInitials(topPodium[2].displayName)}
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm text-center line-clamp-1">{topPodium[2].displayName}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{topPodium[2].department} • {topPodium[2].ward}</p>
                    
                    <div className="mt-4 bg-gray-50 rounded-xl p-3 w-full text-xs space-y-1.5 border">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Resolved</span>
                        <span className="font-bold text-gray-800">{topPodium[2].resolvedCount} issues</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">SLA</span>
                        <span className="font-bold text-blue-600">{topPodium[2].slaCompliance}%</span>
                      </div>
                    </div>
                    <span className="mt-4 text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border">
                      {topPodium[2].score} Performance Points
                    </span>
                  </div>
                )}

              </div>
            )}

            {/* LEADERBOARD TABLE (RANKS 4+) */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <span className="text-xs font-bold text-gray-400 uppercase">Leaderboard Rankings</span>
              </div>
              <div className="divide-y">
                {remainingRanks.map((officer, index) => {
                  const rank = index + 4;
                  const isCurrentOfficer = officer.uid === userProfile?.uid || officer.displayName?.toLowerCase() === userProfile?.displayName?.toLowerCase();
                  return (
                    <div 
                      key={officer.uid} 
                      className={`p-4 flex items-center justify-between hover:bg-gray-50 transition ${
                        isCurrentOfficer ? "bg-teal-50/40 border-l-4 border-l-teal-600" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-gray-500 w-4 font-mono">{rank}</span>
                        <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                          {getInitials(officer.displayName)}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            {officer.displayName}
                            {isCurrentOfficer && (
                              <span className="text-[9px] bg-teal-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                                You
                              </span>
                            )}
                          </h5>
                          <p className="text-xs text-gray-400 font-medium">{officer.designation} • {officer.department} ({officer.ward})</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">Resolved</span>
                          <span className="font-bold text-gray-800 text-sm">{officer.resolvedCount} issues</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">SLA Rate</span>
                          <span className="font-bold text-green-600 text-sm">{officer.slaCompliance}%</span>
                        </div>
                        <div className="text-right w-24">
                          <span className="text-xs text-gray-400 block">Score</span>
                          <span className="font-extrabold text-teal-600 text-sm font-mono">{officer.score} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PERFORMANCE TIPS */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-3 items-center">
              <Star className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800">
                <span className="font-extrabold">How to increase your rank:</span>
                <p className="text-emerald-700 mt-0.5">
                  Earn <span className="font-bold">25 points</span> for every resolved complaint, plus speed bonuses for resolving issues in less than 48 hours. Keep your SLA compliance over 95% to maintain a streak multiplier!
                </p>
              </div>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
}

interface IssueRowProps {
  key?: any;
  issue: any;
  userProfile: any;
  onUpdate: (id: string, s: string, n: string) => any;
  onSelfAssign: (id: string) => any;
  urgency: { score: number; reasons: string[]; reasonText: string };
}

function IssueRow({ issue, userProfile, onUpdate, onSelfAssign, urgency }: IssueRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [aiPlan, setAiPlan] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `You are a professional civic engineering supervisor assistant. Create a highly rigorous, actionable engineering and contractor dispatch brief for this civic issue:
          - Title: ${issue.title}
          - Category: ${issue.category}
          - Severity: ${issue.severity}
          - Ward: ${issue.ward}
          - Description: ${issue.description || "No description"}
          - Weather: ${issue.weatherForecast || "Normal overcast"}
          
          Provide the output in beautiful Markdown format containing:
          1. **Immediate Safety Mitigations** (barricading, public warning advice)
          2. **Contractor Instructions** (exact material standards like M-40 grade bitumen, labor estimates)
          3. **Equipment & Machinery Required**
          4. **Project Cost Estimate Range** in Indian Rupees (INR)
          5. **Post-Fix Quality SLA Checklist**` 
        })
      });
      const data = await response.json();
      setAiPlan(data.text);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDraftMessage = async () => {
    if (!newStatus || !note) {
      alert("Please select a status and write a rough note first.");
      return;
    }
    setDraftLoading(true);
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `Draft a professional, authoritative, yet citizen-friendly update notification to be displayed to the public feed and on the citizen's notification tray.
          - Incident: ${issue.title}
          - Category: ${issue.category}
          - New official regulatory status: ${newStatus}
          - Rough note from Officer: ${note}
          
          Output only a concise 2-3 sentence public-relations ready message. Do not add titles, prefaces, or formatting.` 
        })
      });
      const data = await response.json();
      setNote(data.text);
    } catch (e) {
      console.error(e);
    } finally {
      setDraftLoading(false);
    }
  };

  const isHighRisk = urgency.score >= 70;
  const isUnassigned = !issue.assignedTo || !issue.assignedTo.uid;

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-200 ${
      isUnassigned 
        ? "border-rose-300 hover:border-rose-400 bg-rose-50/10" 
        : isHighRisk 
          ? "border-amber-300 hover:border-amber-400 ring-1 ring-amber-100" 
          : "border-emerald-900/10 hover:border-emerald-900/20"
    }`}>
      
      {/* CARD BODY CLICKABLE HEADER */}
      <div 
        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-emerald-50/10 transition-all" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* URGENCY CHIPS WITH HOVER BREAKDOWNS */}
            <div 
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide cursor-help flex items-center gap-1 shadow-sm transition ${
                isHighRisk 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : urgency.score >= 40 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
              }`}
              title={urgency.reasonText}
            >
              {isHighRisk && <Flame className="w-3 h-3 fill-white" />}
              <span>AI Priority Score: {Math.round(urgency.score)}</span>
            </div>

            {/* UNASSIGNED BADGES */}
            {isUnassigned ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase border border-rose-200">
                ⚠️ UNASSIGNED CIVIC INCIDENT
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200/50 text-emerald-850 text-[10px] rounded-full font-bold">
                Assigned to {issue.assignedOfficer}
              </span>
            )}

            <span className="text-xs text-emerald-850/40 font-mono">ID: #{issue.id?.slice(0, 6)}</span>
          </div>

          <h4 className="font-extrabold text-emerald-950 text-base leading-tight">
            {issue.title || issue.category}
          </h4>
          <p className="text-xs text-emerald-800/60 font-medium line-clamp-1">
            {issue.description || "No description supplied by reporter."}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-850/50 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {issue.address || "Rajouri Garden, Zone 5"}
            </span>
            <span>•</span>
            <span>Ward {issue.ward || "7"}</span>
            <span>•</span>
            <span>SLA: {issue.slaDays || 5} Days</span>
          </div>
        </div>

        {/* STATUS BAR RIGHT PANEL */}
        <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 gap-3">
          <div className="text-right">
            <span className={`px-3 py-1 text-xs font-black rounded-full border ${
              issue.status === "Resolved" || issue.status === "Closed"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : issue.status === "In progress" || issue.status === "Work In Progress"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200/50"
            }`}>
              {issue.status}
            </span>
            <span className="text-[10px] text-emerald-800/40 font-bold block mt-1.5 font-mono">
              Reported {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex gap-2 self-end">
            {/* QUICK SELF-ASSIGN IF UNASSIGNED */}
            {isUnassigned && (
              <button
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelfAssign(issue.id);
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Self-Assign Claim
              </button>
            )}

            {/* QUICK MARK DONE IF ASSIGNED AND NOT RESOLVED */}
            {!isUnassigned && issue.status !== "Resolved" && issue.status !== "Closed" && (
              <button
                className="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(issue.id, "Resolved", "Marked as Resolved/Done by assigned officer.");
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Done
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACCORDION EXPANDED BODY */}
      {expanded && (
        <div className="p-5 border-t border-emerald-900/10 bg-emerald-50/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* REGULATORY ACTION CONTROLS PANEL */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm">
              <h5 className="text-sm font-black text-emerald-950 flex items-center gap-1.5 border-b border-emerald-900/5 pb-3 mb-4">
                <FileText className="w-4 h-4 text-emerald-800" />
                Complaint Dispatch & Status Control
              </h5>
              
              <div className="space-y-4">
                
                {/* STATUS INPUTS */}
                <div>
                  <label className="text-xs font-bold text-emerald-850/60 block mb-1.5">Update Operational Stage</label>
                  <select 
                    className="w-full p-2.5 border border-emerald-200 rounded-xl text-xs bg-[#F9FBF7] font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-100" 
                    value={newStatus} 
                    onChange={e => setNewStatus(e.target.value)}
                  >
                    <option value="">Select Operational Status...</option>
                    <option value="Acknowledged">Acknowledge Complaint</option>
                    <option value="Contractor Assigned">Assign Contractor / Tender Out</option>
                    <option value="Work In Progress">Ground Work In Progress</option>
                    <option value="Resolved">Mark as Fully Resolved</option>
                    <option value="Cannot Fix">Cannot Fix / Reject Ticket</option>
                  </select>
                </div>

                {/* TEXTAREA WITH AI DRAFTER */}
                <div>
                  <label className="text-xs font-bold text-[#F9FBF7] text-emerald-850/60 block mb-1.5">Official Progress Report for Citizen Tray</label>
                  <div className="relative">
                    <textarea 
                      className="w-full p-3 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-950 bg-[#F9FBF7] focus:outline-none focus:ring-2 focus:ring-emerald-100" 
                      placeholder="Write operational details, contractor names, or reasons for status updates..."
                      rows={5}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                    <button 
                      className="absolute bottom-3 right-3 text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold transition shadow-sm cursor-pointer"
                      onClick={handleDraftMessage}
                      disabled={draftLoading}
                    >
                      {draftLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "✨"} 
                      AI Professional Draft
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-xs transition shadow flex-1 cursor-pointer"
                    onClick={() => {
                      onUpdate(issue.id, newStatus, note);
                      setExpanded(false);
                    }}
                    disabled={!newStatus}
                  >
                    Publish Update & Notify Citizens
                  </button>
                  
                  {issue.status !== "Resolved" && issue.status !== "Closed" && (
                    <button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => {
                        onUpdate(issue.id, "Resolved", note || "Marked as Resolved/Done by assigned officer.");
                        setExpanded(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AI RISK WARNING BADGE */}
            {isHighRisk && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold">AI Flagged: High Priority Risk Detected</span>
                  <p className="mt-1 text-amber-700 font-medium">This issue has crossed our urgency baseline due to high upvotes and monsoon proximity. Immediate mitigation plan generation recommended.</p>
                </div>
              </div>
            )}
          </div>

          {/* AI CONTRACTOR BRIEFING ACTION PLAN */}
          <div className="bg-white p-5 rounded-3xl border border-emerald-900/10 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-900/5 pb-3">
              <h5 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-800" />
                AI Smart Contractor Dispatcher
              </h5>
              <button 
                onClick={handleGeneratePlan}
                disabled={aiLoading}
                className="text-[10px] bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition hover:bg-emerald-950 shadow-sm cursor-pointer"
              >
                {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "⚡"} 
                Generate Dispatch Brief
              </button>
            </div>
            
            <div className="flex-1 bg-[#F9FBF7] border border-emerald-900/5 rounded-2xl p-4 text-xs overflow-y-auto max-h-[300px] font-sans text-emerald-950/80 leading-relaxed space-y-2 select-text">
              {aiPlan ? (
                <div className="prose prose-sm text-emerald-950 max-w-none whitespace-pre-line font-mono text-[11px]">
                  {aiPlan}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-emerald-800/40">
                  <Star className="w-8 h-8 text-emerald-300 animate-pulse mb-2" />
                  <span className="font-bold text-emerald-800/60">No Contractor Brief Prepared</span>
                  <p className="text-[11px] mt-1 text-emerald-800/40">Click the generate button above to auto-create contractor instructions, India-standard budgets, and safety checklists.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
