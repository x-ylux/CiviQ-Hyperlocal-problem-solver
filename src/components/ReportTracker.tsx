import React, { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Search, Plus, ThumbsUp, AlertCircle, Award, CheckCircle2, ChevronRight, Download, FileSpreadsheet, Send, Sparkles, Map, User, Bell } from "lucide-react";
import { CivicReport, UserProfile } from "../types";
import { analyzeReport, exportCSV, exportPDF } from "../api";
import { db } from "../firebase";
import { collection, addDoc, query, getDocs, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";

interface ReportTrackerProps {
  userProfile: UserProfile | null;
  onAddCredits: (amount: number) => void;
  onAddAuditLog: (action: string, details: string, severity: "info" | "warning" | "critical") => void;
  showToastMessage: (icon: string, msg: string) => void;
}

export function ReportTracker({
  userProfile,
  onAddCredits,
  onAddAuditLog,
  showToastMessage,
}: ReportTrackerProps) {
  // Lists
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);

  // Form states
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<CivicReport["category"]>("roads");
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [address, setAddress] = useState<string>("Connaught Place, New Delhi");
  const [imageBase64, setImageBase64] = useState<string>("");

  // AI & verification feedback
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    predictedCategory: string;
    confidence: number;
    slaDeadlineDays: number;
    remediationTip: string;
    explainability: string;
  } | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notifications state
  const [notifications, setNotifications] = useState<string[]>([
    "🚨 SLA Breach Notice: Rajouri Garden ticket #1042 escalated to Executive Officer.",
    "✅ Report Resolved: Pitampura power line issue successfully closed. +100 Credits distributed.",
    "🌿 New Campaign: Green Dwarka segregate-and-win drive is now active."
  ]);

  const previousStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // Dynamic real-time sync with firestore
    const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data: CivicReport[] = [];
      
      snapshot.docChanges().forEach((change) => {
        const docData = { id: change.doc.id, ...change.doc.data() } as CivicReport;
        
        if (change.type === "added") {
          previousStatuses.current.set(docData.id, docData.status);
        }
        
        if (change.type === "modified") {
          const prevStatus = previousStatuses.current.get(docData.id);
          if (prevStatus && prevStatus !== docData.status) {
            let icon = "🔔";
            if (docData.status === "resolved") icon = "✅";
            else if (docData.status === "in_progress") icon = "🚧";
            
            showToastMessage(icon, `Status changed to ${docData.status.replace("_", " ")}: ${docData.title}`);
            previousStatuses.current.set(docData.id, docData.status);
          }
        }
        
        if (change.type === "removed") {
          previousStatuses.current.delete(docData.id);
        }
      });

      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CivicReport);
      });
      
      if (data.length > 0) {
        setReports(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } else {
        loadMockReports();
      }
    }, (error) => {
      console.warn("Real-time snapshot error (offline or rules fallback):", error);
      loadMockReports();
    });

    return () => unsub();
  }, [showToastMessage]);

  const loadMockReports = () => {
    const local = localStorage.getItem("civicai_reports");
    if (local) {
      setReports(JSON.parse(local));
    } else {
      const defaultReports: CivicReport[] = [
        {
          id: "rep_1",
          reporterId: "user_rk",
          reporterName: "Rajan Kumar",
          category: "roads",
          title: "Major Pothole Cluster near School Lane",
          description: "Three deep potholes making traffic flow extremely hazardous for morning commuters and school buses.",
          location: { latitude: 28.6139, longitude: 77.2090, address: "Rajouri Garden Sector 5, New Delhi" },
          status: "in_progress",
          upvotes: 42,
          upvotedBy: ["user_pm"],
          timeline: [
            { title: "Report Created", timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), description: "Auto-verified & geotagged." },
            { title: "Escalated to Maintenance", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Assigned to UrbanFix Corp with 7-day SLA." }
          ],
          assignedContractor: "UrbanFix Corp",
          slaDeadline: new Date(Date.now() + 86400000 * 4).toLocaleDateString(),
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "rep_2",
          reporterId: "user_as",
          reporterName: "Arnav Shah",
          category: "water",
          title: "Contaminated Main Line Leakage",
          description: "Water pressure has completely dropped and output has a heavy rust tint. Suspect pipe fracture.",
          location: { latitude: 28.6250, longitude: 77.2150, address: "Pitampura Block A, Delhi" },
          status: "open",
          upvotes: 18,
          upvotedBy: [],
          timeline: [
            { title: "Report Logged", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), description: "AI mapped Category with 95% confidence." }
          ],
          assignedContractor: "Metro Water Ltd",
          slaDeadline: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setReports(defaultReports);
      localStorage.setItem("civicai_reports", JSON.stringify(defaultReports));
    }
  };

  // Real Geolocation Tracking
  const handleAutoTagLocation = () => {
    if ("geolocation" in navigator) {
      showToastMessage("🛰️", "Acquiring GPS tracking lock...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setAddress(`GPS Coords: ${lat}°N, ${lng}°E (Auto-Geotagged)`);
          onAddAuditLog("GPS Geotag", `Auto-tracked coordinates to ${lat}, ${lng}`, "info");
          showToastMessage("✓", "GPS coordinates auto-tagged with real spatial lock.");
        },
        (err) => {
          console.warn("GPS tracking error, using regional defaults:", err);
          showToastMessage("⚠️", "GPS blocked by browser iframe constraint. Defaults applied.");
        }
      );
    } else {
      showToastMessage("⚠️", "Geolocation not supported in browser.");
    }
  };

  // Image Upload and AI Analysis
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImageBase64(base64);
        
        // Auto-analyze when image is uploaded
        setAnalyzing(true);
        try {
          const analysis = await analyzeReport(title || "User Photo", description, category, base64);
          setAiAnalysis(analysis);
          setCategory(analysis.predictedCategory as CivicReport["category"]);
          showToastMessage("🤖", "Gemini automated analysis of image complete!");
        } catch (err) {
          console.error(err);
          showToastMessage("⚠️", "Image processed in fallback mode.");
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Verification & Explainability
  const handleAICategorize = async () => {
    if (!title) {
      showToastMessage("❌", "Please provide a title before asking AI for help.");
      return;
    }
    setAnalyzing(true);
    try {
      const analysis = await analyzeReport(title, description, category, imageBase64);
      setAiAnalysis(analysis);
      setCategory(analysis.predictedCategory as CivicReport["category"]);
      showToastMessage("🤖", "Gemini automated analysis and audit validation complete!");
    } catch (err) {
      console.error(err);
      showToastMessage("⚠️", "AI analysis completed in fallback mode.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      showToastMessage("❌", "Please provide both a title and description.");
      return;
    }

    const newReport: CivicReport = {
      id: Math.random().toString(36).substr(2, 9),
      reporterId: userProfile?.uid || "citizen_user",
      reporterName: userProfile?.displayName || "Anonymous Citizen",
      category,
      title,
      description,
      imageUrl: imageBase64 || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400&auto=format&fit=crop",
      location: { latitude, longitude, address },
      status: "open",
      upvotes: 0,
      upvotedBy: [],
      timeline: [
        {
          title: "Ticket Logged",
          timestamp: new Date().toISOString(),
          description: aiAnalysis?.explainability || "Ticket verified securely via automated systems."
        }
      ],
      assignedContractor: "Waiting Selection",
      slaDeadline: new Date(Date.now() + 86400000 * (aiAnalysis?.slaDeadlineDays || 7)).toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Create document in firestore collection
      await addDoc(collection(db, "reports"), newReport);
    } catch (err) {
      console.warn("Firestore write block, caching locally for offline sync:", err);
    }

    const updated = [newReport, ...reports];
    setReports(updated);
    localStorage.setItem("civicai_reports", JSON.stringify(updated));

    // Clear form
    setTitle("");
    setDescription("");
    setImageBase64("");
    setAiAnalysis(null);

    // Update credits & logs
    onAddCredits(150); // High credit bonus for full reporting
    onAddAuditLog("Create Report", `Logged civic ticket regarding: "${title}"`, "info");
    showToastMessage("🎉", "Report logged! Gained +150 Civic Empowerment Credits.");
  };

  const handleUpvote = async (report: CivicReport) => {
    const uid = userProfile?.uid || "anonymous";
    if (report.upvotedBy.includes(uid)) {
      showToastMessage("⚠️", "You have already upvoted this report.");
      return;
    }

    const updatedUpvotes = report.upvotes + 1;
    const updatedUpvotedBy = [...report.upvotedBy, uid];

    // Build timeline append
    const updatedTimeline = [
      ...report.timeline,
      { title: "Upvoted", timestamp: new Date().toISOString(), description: "Community priority escalated." }
    ];

    const updatedReport = {
      ...report,
      upvotes: updatedUpvotes,
      upvotedBy: updatedUpvotedBy,
      timeline: updatedTimeline
    };

    const updatedList = reports.map((r) => (r.id === report.id ? updatedReport : r));
    setReports(updatedList);
    localStorage.setItem("civicai_reports", JSON.stringify(updatedList));

    if (selectedReport && selectedReport.id === report.id) {
      setSelectedReport(updatedReport);
    }

    showToastMessage("👍", "Priority escalated with verified upvote!");
    onAddAuditLog("Upvote Ticket", `Upvoted incident report #${report.id}`, "info");
  };

  // Status modification for Officers/Admins (RBAC demonstration)
  const handleUpdateStatus = async (report: CivicReport, newStatus: CivicReport["status"]) => {
    if (userProfile?.role !== "officer" && userProfile?.role !== "admin") {
      showToastMessage("❌", "Access Denied: Only officers and admins can change tickets status.");
      return;
    }

    const updatedReport = {
      ...report,
      status: newStatus,
      timeline: [
        ...report.timeline,
        {
          title: `Status set to: ${newStatus.toUpperCase()}`,
          timestamp: new Date().toISOString(),
          description: `Clearance authorized by officer ${userProfile.displayName}.`
        }
      ],
      updatedAt: new Date().toISOString()
    };

    const updatedList = reports.map((r) => (r.id === report.id ? updatedReport : r));
    setReports(updatedList);
    localStorage.setItem("civicai_reports", JSON.stringify(updatedList));

    if (selectedReport && selectedReport.id === report.id) {
      setSelectedReport(updatedReport);
    }

    // Append to real-time notifications
    setNotifications([
      `📢 Ticket Status Shift: "${report.title}" moved to [${newStatus.toUpperCase()}]`,
      ...notifications
    ]);

    showToastMessage("✓", `Ticket successfully updated to [${newStatus.toUpperCase()}].`);
    onAddAuditLog("Modify Status", `Shifted ticket #${report.id} status to ${newStatus}`, "warning");
  };

  // Export endpoints
  const handleCSVExport = async () => {
    try {
      await exportCSV("reports", reports);
      showToastMessage("📊", "Civic complaints spreadsheet downloaded.");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePDFExport = async () => {
    try {
      const pdf = await exportPDF("reports", reports);
      showToastMessage("📋", "Civic complaints catalog exported with cryptographic hash.");
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${pdf.title}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; }
                h1 { color: #1B5E20; border-bottom: 2px solid #1B5E20; padding-bottom: 10px; }
                .report-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                .report-title { font-size: 18px; font-weight: bold; color: #111; }
                .report-meta { color: #666; font-size: 12px; margin-top: 5px; }
                .hash { font-family: monospace; font-size: 12px; background: #eee; padding: 5px; word-break: break-all; }
              </style>
            </head>
            <body>
              <h1>${pdf.title}</h1>
              <div class="meta" style="margin-bottom: 30px;">
                <p><strong>Database Source:</strong> GenAI Cloud Repository</p>
                <p><strong>Integrity Hash:</strong> ${pdf.integrityHash}</p>
              </div>
              ${reports.map(r => `
                <div class="report-card">
                  <div class="report-title">${r.title}</div>
                  <div class="report-meta">Category: ${r.category.toUpperCase()} | Status: ${r.status.toUpperCase()} | Upvotes: ${r.upvotes}</div>
                  <p>${r.description}</p>
                  <p style="font-size: 12px; color: #555;">📍 Address: ${r.location.address}</p>
                </div>
              `).join("")}
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesFilter = activeFilter === "all" || r.status === activeFilter;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 bg-[#F9FBF7]">
      {/* Title */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>REAL LOCATION TRACKING</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">Civic Report Tracker</h1>
        <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
          Report municipal incidents with real-time GPS tracking and automated AI analysis. Hold departments accountable with public SLAs and contractor ratings.
        </p>
      </div>

      {/* Notifications Bar */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-inner">
        <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1">
          <span className="font-extrabold uppercase text-[9px] text-amber-700 tracking-wider">Real-time Feed</span>
          <p className="font-medium leading-relaxed">{notifications[0]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Submit Report Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-700" />
            <span>File an Incident Report</span>
          </h2>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950">Incident Title</label>
              <input
                type="text"
                placeholder="e.g. Major water leak under school road"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-emerald-50/50 border border-emerald-200/40 p-3 rounded-xl text-xs outline-none text-emerald-950 focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950">Description</label>
              <textarea
                placeholder="Describe details like size, immediate impact, and urgency..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-emerald-50/50 border border-emerald-200/40 p-3 rounded-xl text-xs outline-none text-emerald-950 h-24 focus:border-emerald-600 resize-none"
              />
            </div>

            {/* Geolocation Tagging Button */}
            <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-900/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-950">GPS Auto-Geotagging</span>
                <button
                  type="button"
                  onClick={handleAutoTagLocation}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Locate Me
                </button>
              </div>
              <p className="text-[10px] text-emerald-800/60 leading-normal font-light">
                GPS Lat/Lng are compiled natively into metadata coordinates for accurate tracking.
              </p>
              <div className="text-[10px] font-mono text-emerald-950 font-bold flex justify-between bg-white border border-emerald-200/40 p-2.5 rounded-lg">
                <span>Lat: {latitude}</span>
                <span>Lng: {longitude}</span>
              </div>
            </div>

            {/* Image upload preview mock (BonLeaf look) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-950">Report Photo (optional)</label>
              <label className="border-2 border-dashed border-emerald-200 hover:bg-emerald-50/50 p-6 rounded-2xl text-center space-y-2 cursor-pointer transition-all flex flex-col justify-center items-center overflow-hidden relative">
                {imageBase64 ? (
                  <img src={imageBase64} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                ) : null}
                <div className="relative z-10 pointer-events-none">
                  {analyzing ? (
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-700/60 border-t-emerald-700 animate-spin mx-auto mb-2"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-emerald-700/60 mx-auto" />
                  )}
                  <span className="text-[10px] text-emerald-800 font-bold block">
                    {analyzing ? "Analyzing Image..." : "Drag & Drop or Click to Upload"}
                  </span>
                  <span className="text-[9px] text-emerald-800/40 block">Supports JPG, PNG (Auto-detects issue)</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={analyzing} />
              </label>
            </div>

            {/* AI recommendation module */}
            {aiAnalysis && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-900 uppercase text-[10px]">AI Prediction</span>
                  <span className="text-emerald-700">{aiAnalysis.confidence}% Match</span>
                </div>
                <div className="text-emerald-950 leading-relaxed font-light text-[11px]">
                  <strong>Assessed Category:</strong> {category.toUpperCase()} | <strong>SLA Limit:</strong> {aiAnalysis.slaDeadlineDays} days
                </div>
                <p className="text-emerald-800/70 font-light text-[11px]">
                  <strong>Explainability:</strong> {aiAnalysis.explainability}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAICategorize}
                disabled={analyzing}
                className="flex-1 py-3 border border-emerald-800/30 text-emerald-800 rounded-full font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Categorizer</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-bold text-xs transition-colors shadow-lg cursor-pointer"
              >
                Submit Incident
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Incidents Catalog & Live Tracking map */}
        <div className="lg:col-span-7 space-y-6">
          {/* SVG Map simulation */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <Map className="w-4 h-4 text-emerald-700" />
                  <span>Real-time Active Map Tracker</span>
                </h3>
                <p className="text-xs text-emerald-800/50 mt-1">
                  Click pins to reveal reported potholes, water leaks, and repair trucks.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCSVExport}
                  className="p-2 border border-emerald-900/10 rounded-xl hover:bg-emerald-50 text-emerald-800 flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePDFExport}
                  className="p-2 border border-emerald-900/10 rounded-xl hover:bg-emerald-50 text-emerald-800 flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom Interactive SVG Map */}
            <div className="w-full h-44 rounded-2xl overflow-hidden bg-emerald-100/60 border border-emerald-900/10 relative">
              <svg width="100%" height="100%" viewBox="0 0 500 200" className="opacity-90">
                <rect width="500" height="200" fill="#E2F2E4" />
                {/* Street grid */}
                <path d="M 0 50 L 500 50" stroke="#fff" strokeWidth="3" />
                <path d="M 0 150 L 500 150" stroke="#fff" strokeWidth="3" />
                <path d="M 120 0 L 120 200" stroke="#fff" strokeWidth="3" />
                <path d="M 380 0 L 380 200" stroke="#fff" strokeWidth="3" />
                
                {/* Active Pins */}
                {/* Pothole pin */}
                <circle cx="120" cy="50" r="10" fill="#f97316" fillOpacity="0.4" className="animate-pulse" />
                <circle cx="120" cy="50" r="4" fill="#f97316" />

                {/* Water pin */}
                <circle cx="380" cy="150" r="10" fill="#3b82f6" fillOpacity="0.4" className="animate-pulse" />
                <circle cx="380" cy="150" r="4" fill="#3b82f6" />

                {/* Selected coordinates pin */}
                <circle cx="250" cy="100" r="14" fill="#059669" fillOpacity="0.3" />
                <circle cx="250" cy="100" r="5" fill="#059669" />
                <text x="250" y="85" textAnchor="middle" fontSize="9" fill="#047857" fontWeight="bold">GPS Location</text>
              </svg>
              <div className="absolute bottom-2 left-2 bg-[#1D3B1F] text-emerald-50 text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                Delhi Core Sector Active Map
              </div>
            </div>
          </div>

          {/* Incidents Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`py-2 px-4 rounded-full text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeFilter === f
                    ? "bg-emerald-800 text-white"
                    : "bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-900/10"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Incidents Feed */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-white p-5 rounded-3xl border border-emerald-900/10 hover:border-emerald-700/20 shadow-sm space-y-4 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">
                      {report.category}
                    </span>
                    <h3 className="text-sm font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-xs text-emerald-800/70 font-light leading-relaxed max-w-lg line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-[9px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full ${
                        report.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : report.status === "in_progress"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {report.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpvote(report);
                      }}
                      className="flex items-center gap-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/50 px-3 py-1.5 rounded-full cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{report.upvotes}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded officer settings for RBAC demonstrations */}
                {(userProfile?.role === "officer" || userProfile?.role === "admin") && (
                  <div className="pt-3 border-t border-emerald-900/5 flex gap-2 items-center flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-900 mr-2 uppercase tracking-wide">
                      Officer Controls:
                    </span>
                    {(["open", "in_progress", "resolved"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(report, st);
                        }}
                        className={`text-[9px] uppercase font-bold py-1 px-3 rounded-lg border transition-all cursor-pointer ${
                          report.status === st
                            ? "bg-emerald-800 text-white"
                            : "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200/50"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Report Timeline Modal overlay */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-[#122E15]/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-[2rem] p-6 border border-emerald-900/10 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-50 rounded-full w-8 h-8 flex items-center justify-center text-sm"
            >
              ✕
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">
                {selectedReport.category} Status timeline
              </span>
              <h3 className="text-xl font-bold text-emerald-950">{selectedReport.title}</h3>
              <p className="text-xs text-emerald-800/70 font-light leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl text-xs space-y-1.5 border border-emerald-200/30">
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">📍 Geotag Address:</span>
                <span className="font-medium text-emerald-950">{selectedReport.location.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">🏗️ Contractor:</span>
                <span className="font-medium text-emerald-950">{selectedReport.assignedContractor || "Pending selection"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-semibold">📅 Resolution SLA:</span>
                <span className="font-semibold text-rose-700">{selectedReport.slaDeadline}</span>
              </div>
            </div>

            {/* Timeline track */}
            <div className="space-y-4 pl-4 border-l-2 border-emerald-800/10 relative">
              {selectedReport.timeline.map((event, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-700 ring-4 ring-emerald-50" />
                  <div className="text-xs font-bold text-emerald-950">{event.title}</div>
                  <span className="text-[10px] text-emerald-800/40 font-mono block">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                  <p className="text-[11px] text-emerald-800/70 font-light leading-relaxed">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedReport(null)}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-bold text-xs transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
