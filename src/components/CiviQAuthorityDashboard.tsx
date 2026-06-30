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
    <div className="page active" id="page-authority" style={{ display: "block" }}>
      <div className="section" style={{ padding: "0" }}>
        <div className="section-inner">
      {/* Forest Background Banner */}
      <div className="relative overflow-hidden rounded-[36px] mb-10 bg-cover bg-center py-14 px-10 text-center text-white border border-emerald-800/20 shadow-xl" 
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=1500')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-850/85"></div>
        
        {/* Banner Content */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/25 text-emerald-250 px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Secure Command & Dispatch Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">OFFICIAL COMMAND & DISPATCH</h1>
          <ul className="text-emerald-50 text-xs sm:text-sm max-w-2xl mx-auto space-y-2 font-medium list-disc list-inside text-center sm:text-left inline-block">
            <li>Manage assigned service tickets, monitor real-time ward operations.</li>
            <li>View dynamic compliance stats linked directly to municipal service-level agreements (SLA).</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* LEFT COLUMN: SIDEBAR PROFILE CARD */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] flex flex-col items-center">
            <div className="relative mb-5">
              <div className="w-28 h-28 bg-emerald-800 border-4 border-emerald-250 rounded-full flex items-center justify-center text-emerald-50 text-4xl font-extrabold shadow-lg">
                {getInitials(userProfile?.displayName)}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full animate-pulse" title="Active On Duty"></span>
            </div>
            
            <h2 className="text-2xl font-black text-emerald-950 text-center leading-tight mb-2">
              {userProfile?.displayName || "Officer S.K. Sharma"}
            </h2>
            <p className="text-xs text-emerald-850 bg-emerald-50 border border-emerald-250 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider mb-6">
              {userProfile?.designation || "Chief Inspector"}
            </p>

            {/* Structured Credentials Table */}
            <div className="w-full text-sm font-semibold border border-emerald-900/10 rounded-2xl overflow-hidden bg-[#F9FBF7]/50 shadow-inner">
              <div className="flex justify-between items-center px-5 py-4 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 text-xs font-bold">Duty Status</span>
                <button 
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isOnDuty 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }`}
                  title="Click to toggle status"
                >
                  {isOnDuty ? "ON DUTY" : "OFF DUTY"}
                </button>
              </div>
              <div className="flex justify-between items-center px-5 py-4 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 text-xs font-bold">Department</span>
                <span className="font-extrabold text-emerald-950 text-xs">{userProfile?.department || "Sanitation"}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-4 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 text-xs font-bold">Jurisdiction</span>
                <span className="font-extrabold text-emerald-950 text-xs">{currentWard}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-4 border-b border-emerald-900/5">
                <span className="text-emerald-800/60 text-xs font-bold">Status</span>
                <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full uppercase">
                  ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-emerald-800/60 text-xs font-bold">Clearance Level</span>
                <span className="font-extrabold text-emerald-950 text-xs">Class I Officer</span>
              </div>
            </div>
          </div>

          {/* AI AUTO-DISPATCH INFO CARD */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] space-y-4 text-left">
            <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
              <span className="text-base">🤖</span>
              AI Auto-Dispatch
            </h3>
            <ul className="text-emerald-800/80 text-xs space-y-3 list-disc pl-5 leading-relaxed font-medium">
              <li>Every new report is automatically routed to officers based of ward operations.</li>
              <li>View dynamic compliance stats linked directly to municipal service-level agreements (SLA).</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TOP STATS CARDS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] transition hover:shadow-md hover:border-emerald-600/20">
              <div className="text-[10px] font-extrabold text-emerald-850/60 uppercase tracking-wider mb-2">Total Assigned</div>
              <div className="text-4xl font-black text-emerald-950 font-mono leading-none">{totalAssignedCount}</div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] transition hover:shadow-md hover:border-emerald-600/20">
              <div className="text-[10px] font-extrabold text-emerald-850/60 uppercase tracking-wider mb-2">Resolved</div>
              <div className="text-4xl font-black text-emerald-850 font-mono leading-none">{totalResolvedCount}</div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] transition hover:shadow-md hover:border-emerald-600/20">
              <div className="text-[10px] font-extrabold text-emerald-850/60 uppercase tracking-wider mb-2">SLA Compliance</div>
              <div className={`text-4xl font-black font-mono leading-none ${slaCompliance < 80 ? "text-rose-600" : "text-emerald-800"}`}>
                {slaCompliance}%
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-[0_10px_30px_-5px_rgba(4,47,31,0.03)] transition hover:shadow-md hover:border-emerald-600/20 relative group cursor-pointer">
              <div className="text-[10px] font-extrabold text-emerald-850/60 uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="text-4xl font-black text-emerald-950 font-mono leading-none">{notifications.length}</div>
              
              {/* Real-time Notification Dropdown */}
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-emerald-900/10 rounded-3xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50 overflow-hidden">
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
          <div className="flex border-b border-emerald-900/10 gap-8 md:gap-10 pt-4">
            <button 
              className={`pb-4 px-3 font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "inbox" 
                  ? "text-emerald-950 font-black" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("inbox")}
            >
              <span>🤖 Issue Inbox</span>
              {activeTab === "inbox" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-850 rounded-full" />}
            </button>
            
            <button 
              className={`pb-4 px-3 font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "map" 
                  ? "text-emerald-950 font-black" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("map")}
            >
              <span>🗺️ Map View</span>
              {activeTab === "map" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-850 rounded-full" />}
            </button>
            
            <button 
              className={`pb-4 px-3 font-bold text-sm transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "performance" 
                  ? "text-emerald-950 font-black" 
                  : "text-emerald-800/60 hover:text-emerald-950"
              }`} 
              onClick={() => setActiveTab("performance")}
            >
              <span>🏆 Performance Leaderboard</span>
              {activeTab === "performance" && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-850 rounded-full" />}
            </button>
          </div>

          {/* TAB 1: ISSUE INBOX & COMPLAINT MONITORING */}
          {activeTab === "inbox" && (
            <div className="space-y-6">
              
              {/* SUB TAB SELECTORS FOR MONITORING EVERYTHING */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2">
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => setInboxSubTab("my-assigned")}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
                      inboxSubTab === "my-assigned" 
                        ? "bg-emerald-850 text-white border border-emerald-950" 
                        : "bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    My Assignments ({myAssignedIssues.length})
                  </button>
                  <button 
                    onClick={() => setInboxSubTab("ward-overview")}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
                      inboxSubTab === "ward-overview" 
                        ? "bg-emerald-850 text-white border border-emerald-950" 
                        : "bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    Ward {userProfile?.ward || "7"} Overview ({wardIssues.length})
                  </button>
                  <button 
                    onClick={() => setInboxSubTab("unassigned")}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      inboxSubTab === "unassigned" 
                        ? "bg-rose-600 text-white border border-rose-700" 
                        : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unassigned ({unassignedWardIssues.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-850/60 font-black uppercase tracking-wider">Sort:</span>
                  <select 
                    className="text-xs border border-emerald-200 rounded-xl px-4 py-2 bg-white font-black text-emerald-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100" 
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
                <div className="p-5 bg-rose-50 border border-rose-200/60 rounded-2xl text-rose-800 text-xs flex gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm block">🚨 Action Required: Unassigned Incidents in Ward</span>
                    <p className="mt-1 text-rose-700 font-medium">These complaints have not found a matching departmental official. As an active ward officer, you can self-assign these tasks to coordinate them.</p>
                  </div>
                </div>
              )}

              {/* TABLE LAYOUT FOR ISSUES */}
              <div className="space-y-4">
                <div className="hidden md:grid bg-[#F4F7F2] text-emerald-900/60 font-black text-[11px] uppercase tracking-wider py-4 px-8 rounded-2xl grid-cols-12 gap-4 items-center border border-emerald-900/5 shadow-sm">
                  <div className="col-span-2">Issue ID</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2">Reporter</div>
                  <div className="col-span-1 text-center font-mono">Ward</div>
                  <div className="col-span-1 text-right">Date Filed</div>
                </div>

                {sortedInboxIssues.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-emerald-900/10 p-6 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="text-emerald-900/80 font-bold text-sm">
                      No assigned issues found for this category / jurisdiction.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
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
            <div className="bg-white border border-emerald-900/10 rounded-[24px] shadow-sm overflow-hidden">
              <div className="p-5 bg-emerald-50/40 border-b border-emerald-900/5 flex justify-between items-center">
                <span className="text-xs font-black text-emerald-900/60 uppercase tracking-wider">Leaderboard Rankings</span>
                <span className="text-[10px] font-extrabold text-emerald-800/50 uppercase tracking-widest">Active Ward Officers</span>
              </div>
              <div className="divide-y divide-emerald-900/5">
                {remainingRanks.map((officer, index) => {
                  const rank = index + 4;
                  const isCurrentOfficer = officer.uid === userProfile?.uid || officer.displayName?.toLowerCase() === userProfile?.displayName?.toLowerCase();
                  return (
                    <div 
                      key={officer.uid} 
                      className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-emerald-50/10 transition gap-4 ${
                        isCurrentOfficer ? "bg-emerald-50/20 border-l-4 border-emerald-600" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm text-emerald-900/40 w-5 text-center font-mono">{rank}</span>
                        <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                          {getInitials(officer.displayName)}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                            {officer.displayName}
                            {isCurrentOfficer && (
                              <span className="text-[9px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </h5>
                          <p className="text-xs text-emerald-800/60 font-medium mt-0.5">{officer.designation} • {officer.department} ({officer.ward})</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-wider block mb-0.5">Resolved</span>
                          <span className="font-black text-emerald-950 text-sm font-mono">{officer.resolvedCount} issues</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-wider block mb-0.5">SLA Rate</span>
                          <span className="font-black text-emerald-700 text-sm font-mono">{officer.slaCompliance}%</span>
                        </div>
                        <div className="text-right w-24">
                          <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-wider block mb-0.5">Score</span>
                          <span className="font-black text-emerald-600 text-sm font-mono">{officer.score} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PERFORMANCE TIPS */}
            <div className="p-5 sm:p-6 bg-emerald-50/60 border border-emerald-200/50 rounded-[24px] flex gap-4 items-center shadow-sm">
              <Star className="w-7 h-7 text-emerald-600 shrink-0 animate-pulse" />
              <div className="text-xs text-emerald-950/80 leading-relaxed">
                <span className="font-black text-emerald-950 text-sm block mb-1">How to increase your rank:</span>
                <p className="text-emerald-850 font-medium">
                  Earn <span className="font-extrabold text-emerald-950">25 points</span> for every resolved complaint, plus speed bonuses for resolving issues in less than 48 hours. Keep your SLA compliance over 95% to maintain a streak multiplier!
                </p>
              </div>
            </div>

          </div>
        )}

        </div>
      </div>
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
    <div className={`bg-white rounded-[24px] border transition-all duration-300 overflow-hidden ${
      expanded 
        ? "border-emerald-600 ring-2 ring-emerald-50 shadow-[0_15px_30px_rgba(4,47,31,0.06)]" 
        : isUnassigned 
          ? "border-rose-200 bg-rose-50/5 hover:bg-rose-50/15 hover:shadow-sm" 
          : "border-emerald-900/10 hover:border-emerald-600/30 hover:shadow-[0_8px_20px_-5px_rgba(4,47,31,0.04)]"
    }`}>
      
      {/* Clickable Grid Row */}
      <div 
        className="p-6 md:py-5 md:px-8 flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 items-start md:items-center cursor-pointer text-sm font-medium text-emerald-950 hover:bg-emerald-50/30 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Issue ID & Risk Icon & Status Badge */}
        <div className="col-span-2 flex md:flex-col items-center md:items-start justify-between md:justify-center w-full md:w-auto gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-black text-emerald-850/60">
              #{issue.id?.slice(0, 6) || "N/A"}
            </span>
            {isHighRisk && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title="High Priority Risk Detected!" />
            )}
          </div>
          <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-wider ${
            issue.status === "Resolved" || issue.status === "Closed"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : issue.status === "In progress" || issue.status === "Work In Progress"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-emerald-50/70 text-emerald-850 border-emerald-250"
          }`}>
            {issue.status}
          </span>
        </div>

        {/* Category Pill */}
        <div className="col-span-2 w-full md:w-auto">
          <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-800 uppercase tracking-wide">
            {issue.category}
          </span>
        </div>

        {/* Description / Title */}
        <div className="col-span-4 pr-4 w-full md:w-auto space-y-0.5">
          <div className="font-extrabold text-emerald-950 text-sm leading-snug line-clamp-1">{issue.title || issue.category}</div>
          <div className="text-xs text-emerald-850/60 line-clamp-1 font-normal">{issue.description || "No description supplied."}</div>
        </div>

        {/* Reporter Name */}
        <div className="col-span-2 text-emerald-850 font-semibold text-xs truncate w-full md:w-auto">
          <span className="md:hidden text-emerald-850/40 text-[10px] font-black mr-1 uppercase tracking-wider">Reporter:</span>
          {issue.reporterName || "Anonymous Citizen"}
        </div>

        {/* Ward Number */}
        <div className="col-span-1 text-xs text-emerald-850 font-mono font-bold md:text-center w-full md:w-auto">
          <span className="md:hidden text-emerald-850/40 text-[10px] font-black mr-1 uppercase tracking-wider font-sans">Ward:</span>
          {issue.ward || "7"}
        </div>

        {/* Date Filed */}
        <div className="col-span-1 md:text-right text-xs text-emerald-850/60 font-bold w-full md:w-auto flex md:block justify-between items-center">
          <span className="md:hidden text-emerald-850/40 text-[10px] font-black uppercase tracking-wider font-sans">Date Filed:</span>
          <span>{issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "N/A"}</span>
        </div>
      </div>

      {/* ACCORDION EXPANDED BODY */}
      {expanded && (
        <div className="p-8 border-t border-emerald-900/10 bg-emerald-50/15 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          
          {/* REGULATORY ACTION CONTROLS PANEL */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-900/5 pb-4 mb-5">
                <h5 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-emerald-800" />
                  Complaint Dispatch & Status Control
                </h5>
                {isUnassigned && (
                  <button
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelfAssign(issue.id);
                    }}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Claim Task
                  </button>
                )}
              </div>
              
              <div className="space-y-5">
                
                {/* STATUS INPUTS */}
                <div>
                  <label className="text-xs font-black text-emerald-850/60 uppercase tracking-wider block mb-2">Update Operational Stage</label>
                  <select 
                    className="w-full p-3 border border-emerald-200 rounded-xl text-xs bg-white font-bold text-emerald-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100" 
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
                  <label className="text-xs font-black text-emerald-850/60 uppercase tracking-wider block mb-2">Official Progress Report for Citizen Tray</label>
                  <div className="relative">
                    <textarea 
                      className="w-full p-4 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-950 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 min-h-[120px]" 
                      placeholder="Write operational details, contractor names, or reasons for status updates..."
                      rows={5}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                    <button 
                      className="absolute bottom-3.5 right-3.5 text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-1 font-bold transition shadow-sm cursor-pointer"
                      onClick={handleDraftMessage}
                      disabled={draftLoading}
                    >
                      {draftLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "✨"} 
                      AI Professional Draft
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    className="bg-emerald-800 hover:bg-emerald-950 text-white font-black py-3 px-5 rounded-xl text-xs transition shadow-md flex-1 cursor-pointer uppercase tracking-wider"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
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
              <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl flex gap-4 text-amber-800 text-xs shadow-sm">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm block">AI Flagged: High Priority Risk Detected</span>
                  <p className="mt-1.5 text-amber-700 font-medium leading-relaxed">This issue has crossed our urgency baseline due to high upvotes and monsoon proximity. Immediate mitigation plan generation recommended.</p>
                </div>
              </div>
            )}
          </div>

          {/* AI CONTRACTOR BRIEFING ACTION PLAN */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5 border-b border-emerald-900/5 pb-4">
              <h5 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-emerald-800" />
                AI Smart Contractor Dispatcher
              </h5>
              <button 
                onClick={handleGeneratePlan}
                disabled={aiLoading}
                className="text-[10px] bg-emerald-800 text-white font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition hover:bg-emerald-950 shadow-sm cursor-pointer uppercase tracking-wider"
              >
                {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "⚡"} 
                Generate Dispatch Brief
              </button>
            </div>
            
            <div className="flex-1 bg-[#F9FBF7] border border-emerald-900/5 rounded-2xl p-5 text-xs overflow-y-auto max-h-[320px] font-sans text-emerald-950/80 leading-relaxed space-y-3 select-text">
              {aiPlan ? (
                <div className="prose prose-sm text-emerald-950 max-w-none whitespace-pre-line font-mono text-[11.5px] leading-relaxed">
                  {aiPlan}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-emerald-800/40">
                  <Star className="w-9 h-9 text-emerald-300 animate-pulse mb-3" />
                  <span className="font-extrabold text-emerald-800/70 text-sm">No Contractor Brief Prepared</span>
                  <p className="text-[11px] mt-1.5 text-emerald-800/40 max-w-xs leading-relaxed">Click the generate button above to auto-create contractor instructions, India-standard budgets, and safety checklists.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
