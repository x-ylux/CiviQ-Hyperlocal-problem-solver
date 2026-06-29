import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

interface Props {
  triggerToast: (icon: string, message: string) => void;
  userProfile: any;
}

export function CiviQAuthorityDashboard({ triggerToast, userProfile }: Props) {
  const [issues, setIssues] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "map" | "performance">("inbox");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"priority" | "time">("priority");

  useEffect(() => {
    if (!userProfile?.uid) return;
    // Listen for assigned issues
    const qIssues = query(collection(db, "issues"), where("assignedTo.uid", "==", userProfile.uid));
    const unsubIssues = onSnapshot(qIssues, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIssues(arr);
    });

    // Listen for real-time notifications
    const qNotifs = query(collection(db, `notifications/${userProfile.uid}/items`));
    const unsubNotifs = onSnapshot(qNotifs, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(arr);
    });

    return () => {
      unsubIssues();
      unsubNotifs();
    };
  }, [userProfile?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getUrgencyScore = (issue: any) => {
    let score = 0;
    const reasons = [];
    
    if (issue.upvotes > 0) {
      score += issue.upvotes * 2;
      reasons.push(`${issue.upvotes} upvotes`);
    }
    
    const daysOpen = Math.max(0, (Date.now() - new Date(issue.createdAt || Date.now()).getTime()) / (1000 * 3600 * 24));
    if (daysOpen >= 1) {
      score += Math.floor(daysOpen) * 5;
      reasons.push(`${Math.floor(daysOpen)} days open`);
    }
    
    if (issue.severity === "Critical") { score += 40; reasons.push("Critical severity"); }
    else if (issue.severity === "High") { score += 25; reasons.push("High severity"); }
    else if (issue.severity === "Medium") { score += 10; reasons.push("Medium severity"); }
    else { score += 5; reasons.push("Low severity"); }
    
    // Simulate weather risk
    if (issue.category === "Roads" && issue.weatherForecast?.toLowerCase().includes("rain")) {
      score += 20;
      reasons.push("Monsoon risk detected");
    }
    
    return { score: Math.min(score, 100), reasonText: `High priority because: ${reasons.join(", ")}.` };
  };

  const sortedIssues = [...issues].sort((a, b) => {
    if (sortOrder === "priority") {
      return getUrgencyScore(b).score - getUrgencyScore(a).score;
    } else {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
  });

  const handleUpdateStatus = async (issueId: string, newStatus: string, note: string) => {
    if (!newStatus) return;
    try {
      const issueRef = doc(db, "issues", issueId);
      const updates: any = { status: newStatus };
      if (newStatus === "Resolved") {
        updates.resolvedAt = serverTimestamp();
        updates.pendingVerification = true;
      }
      await updateDoc(issueRef, updates);

      // Add to status history
      const historyRef = doc(collection(issueRef, "statusHistory"));
      await setDoc(historyRef, {
        status: newStatus,
        note,
        changedBy: `${userProfile.displayName} (${userProfile.designation})`,
        timestamp: serverTimestamp()
      });

      triggerToast("✅", "Status updated successfully.");
    } catch (e) {
      console.error(e);
      triggerToast("❌", "Failed to update status.");
    }
  };

  const totalAssigned = issues.length;
  const totalResolved = issues.filter(i => i.status === "Resolved" || i.status === "Closed").length;

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6">
      {/* SIDEBAR PROFILE */}
      <div className="w-full md:w-1/4 bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
          {userProfile?.displayName?.charAt(0) || "A"}
        </div>
        <h2 className="text-lg font-bold text-gray-800 text-center">{userProfile?.displayName}</h2>
        <p className="text-sm text-gray-500 font-medium mb-1">{userProfile?.designation}</p>
        <div className="bg-gray-50 rounded-lg p-3 w-full text-sm space-y-2 mt-4 border">
          <div className="flex justify-between">
            <span className="text-gray-500">Dept</span>
            <span className="font-semibold text-gray-700">{userProfile?.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ward</span>
            <span className="font-semibold text-gray-700">{userProfile?.ward}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="text-green-600 font-bold uppercase text-xs px-2 py-1 bg-green-50 rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full md:w-3/4 flex flex-col gap-4">
        {/* TOP BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-sm text-gray-500">Total Assigned</div>
            <div className="text-2xl font-bold text-gray-800">{totalAssigned}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-sm text-gray-500">Resolved</div>
            <div className="text-2xl font-bold text-green-600">{totalResolved}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-sm text-gray-500">SLA Compliance</div>
            <div className="text-2xl font-bold text-blue-600">--%</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm relative group">
            <div className="text-sm text-gray-500 flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </div>
            <div className="text-2xl font-bold text-gray-800">{notifications.length}</div>
            
            {/* Notification Dropdown (Hover) */}
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3 border-b bg-gray-50 font-bold text-sm rounded-t-xl">Recent Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>
                ) : (
                  [...notifications].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                      onClick={async () => {
                        await updateDoc(doc(db, `notifications/${userProfile.uid}/items`, n.id), { read: true });
                        setActiveTab("inbox");
                      }}
                    >
                      <div className="text-xs font-bold text-gray-800 mb-1">{n.type === "new_assignment" ? "New Assignment" : "Notification"}</div>
                      <div className="text-xs text-gray-600">{n.issueTitle} ({n.issueCategory})</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b gap-4 mt-2">
          <button className={`pb-2 px-1 font-medium text-sm transition-colors ${activeTab === "inbox" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("inbox")}>Issue Inbox</button>
          <button className={`pb-2 px-1 font-medium text-sm transition-colors ${activeTab === "map" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("map")}>Map View</button>
          <button className={`pb-2 px-1 font-medium text-sm transition-colors ${activeTab === "performance" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("performance")}>Performance</button>
        </div>

        {/* TAB CONTENT: INBOX */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Assigned Issues</h3>
              <select className="text-sm border rounded-lg p-2" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
                <option value="priority">AI Priority Order</option>
                <option value="time">Newest First</option>
              </select>
            </div>
            
            {sortedIssues.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                <i className="fas fa-check-circle text-4xl mb-3 text-gray-300"></i>
                <p>No assigned issues found for your jurisdiction.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onUpdate={handleUpdateStatus} urgency={getUrgencyScore(issue)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: MAP */}
        {activeTab === "map" && (
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center text-gray-500">
            Map View Coming Soon
          </div>
        )}

        {/* TAB CONTENT: PERFORMANCE */}
        {activeTab === "performance" && (
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center text-gray-500">
            Performance Scorecards Coming Soon
          </div>
        )}
      </div>
    </div>
  );
}

interface IssueRowProps {
  key?: any;
  issue: any;
  onUpdate: (id: string, s: string, n: string) => any;
  urgency: { score: number; reasonText: string };
}

function IssueRow({ issue, onUpdate, urgency }: IssueRowProps) {
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
          message: `You are a civic engineering assistant. Generate an action plan for this issue: ${JSON.stringify(issue)}
          Include: 1) Step-by-step action plan 2) Contractor brief 3) Materials needed 4) Estimated cost range in India 5) Risk factors. Use Markdown.` 
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
          message: `Draft a professional, empathetic public message for citizens. Issue: ${issue.title}. New status: ${newStatus}. Rough note: ${note}. Maximum 3 sentences. No formatting.` 
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
  
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span 
              className={`px-2 py-0.5 rounded text-xs font-bold cursor-help ${urgency.score > 50 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}
              title={urgency.reasonText}
            >
              Urgency Score: {Math.round(urgency.score)}
            </span>
            <span className="text-xs text-gray-500 font-medium">#{issue.id.slice(0,6)}</span>
          </div>
          <h4 className="font-bold text-gray-800">{issue.title || issue.category}</h4>
          <p className="text-sm text-gray-500 truncate mt-1">{issue.description || "No description provided."}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">{issue.status}</span>
          <span className="text-xs text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 border-t bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="space-y-4">
            <div className="mb-4 text-sm text-gray-700">
              <strong>Location:</strong> {issue.ward || "Unknown"} <br />
              <strong>Address:</strong> {issue.address}
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h5 className="text-sm font-bold text-gray-700 mb-3">Update Status</h5>
              <div className="space-y-3">
                <select className="w-full p-2 border rounded-lg text-sm" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select Action...</option>
                  <option value="Acknowledged">Acknowledge Issue</option>
                  <option value="Contractor Assigned">Assign Contractor</option>
                  <option value="Work In Progress">Work In Progress</option>
                  <option value="Resolved">Mark as Resolved</option>
                  <option value="Cannot Fix">Cannot Fix / Reject</option>
                </select>
                
                <div className="relative">
                  <textarea 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="Official note or update for citizens..."
                    rows={4}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                  <button 
                    className="absolute bottom-3 right-3 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded flex items-center gap-1 font-medium transition"
                    onClick={handleDraftMessage}
                    disabled={draftLoading}
                  >
                    {draftLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>} 
                    AI Draft
                  </button>
                </div>

                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition w-full"
                  onClick={() => onUpdate(issue.id, newStatus, note)}
                  disabled={!newStatus}
                >
                  Submit Update
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
             <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-gray-700">AI Assistant</h5>
                <button 
                  onClick={handleGeneratePlan}
                  disabled={aiLoading}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-1 font-medium transition hover:bg-indigo-700"
                >
                  {aiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>} 
                  Generate Action Plan
                </button>
             </div>
             
             <div className="flex-1 bg-gray-50 border rounded-lg p-3 text-sm overflow-y-auto min-h-[200px] whitespace-pre-wrap text-gray-700 font-serif">
                {aiPlan || <span className="text-gray-400 italic">Click generate to create a contractor action plan.</span>}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
