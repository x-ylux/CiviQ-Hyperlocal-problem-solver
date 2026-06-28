import React, { useState } from "react";
import { Brain, Sparkles, Award, Users, BookOpen, ThumbsUp, Calendar, MapPin, ChevronRight, Check } from "lucide-react";

interface InsightsCreditsProps {
  credits: number;
  onAddCredits: (amount: number) => void;
  onAddAuditLog: (action: string, details: string, severity: "info" | "warning" | "critical") => void;
  showToastMessage: (icon: string, msg: string) => void;
}

export function InsightsCredits({
  credits,
  onAddCredits,
  onAddAuditLog,
  showToastMessage,
}: InsightsCreditsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"insights" | "campaigns" | "leaderboard">("insights");

  // Campaigns list
  const [campaigns, setCampaigns] = useState([
    {
      id: "camp_1",
      emoji: "🧹",
      title: "Swachh Ward Drive — Ward 7",
      date: "July 5, 2026",
      location: "Rajouri Garden",
      volunteers: 238,
      target: 500,
      joined: false,
      tag: "clean",
    },
    {
      id: "camp_2",
      emoji: "🌳",
      title: "Plant 1000 Trees — Pitampura",
      date: "July 12, 2026",
      location: "Pitampura Block A",
      volunteers: 412,
      target: 1000,
      joined: false,
      tag: "tree",
    },
    {
      id: "camp_3",
      emoji: "♻️",
      title: "Segregation Champion Month",
      date: "July 2026",
      location: "Dwarka Sector 12",
      volunteers: 1240,
      target: 3000,
      joined: false,
      tag: "recycle",
    },
  ]);

  // Leaderboard lists
  const leaderboard = [
    { rank: "🥇", name: "Rajan Kumar", role: "Green Champion", ward: "Ward 7", xp: 4210, avatar: "RK" },
    { rank: "🥈", name: "Priya Malhotra", role: "Active Reporter", ward: "Ward 5", xp: credits, avatar: "PM" },
    { rank: "🥉", name: "Arnav Shah", role: "Top Verifier", ward: "Ward 12", xp: 2190, avatar: "AS" },
    { rank: "4", name: "Meera Rao", role: "RTI Draftsman", ward: "Ward 3", xp: 1840, avatar: "MR" },
    { rank: "5", name: "Vijay Tiwari", role: "Newcomer", ward: "Ward 11", xp: 920, avatar: "VT" },
  ];

  // Learning modules list
  const learningModules = [
    { id: "learn_1", icon: "🏛️", title: "How municipal budgets work", xp: 75, duration: "10 mins" },
    { id: "learn_2", icon: "⚖️", title: "Your RTI rights explained", xp: 100, duration: "15 mins" },
    { id: "learn_3", icon: "🌱", title: "Backyard home compost setups", xp: 50, duration: "5 mins" },
  ];

  const handleJoinCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id && !c.joined) {
          onAddCredits(100);
          onAddAuditLog("Campaign Enlisted", `Registered volunteer drive for "${c.title}"`, "info");
          showToastMessage("🎉", `Enlisted successfully! Awarded +100 Credits.`);
          return { ...c, joined: true, volunteers: c.volunteers + 1 };
        }
        return c;
      })
    );
  };

  const handleCompleteModule = (title: string, amount: number) => {
    onAddCredits(amount);
    onAddAuditLog("Course Completed", `Completed learning curriculum: "${title}"`, "info");
    showToastMessage("🎓", `Completed successfully! Awarded +${amount} credits.`);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 bg-[#F9FBF7]">
      {/* Sub tabs selector */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-200/50 p-1 rounded-full">
          <button
            onClick={() => setActiveSubTab("insights")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "insights" ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            AI Predictive Insights
          </button>
          <button
            onClick={() => setActiveSubTab("campaigns")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "campaigns" ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            Active Volunteer Drives
          </button>
          <button
            onClick={() => setActiveSubTab("leaderboard")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "leaderboard" ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            Credits Leaderboard
          </button>
        </div>
      </div>

      {activeSubTab === "insights" && (
        <div className="space-y-8">
          {/* Section Heading */}
          <div className="space-y-4 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
              <Brain className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>AI PREDICTIVE SYSTEMS</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">AI Core Analytics Engines</h1>
            <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
              Our background neural networks map historical data, local rainfall trends, and service records to proactively solve public problems before they spike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex gap-4 items-start">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-800 flex-shrink-0 font-bold">⛈️</div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-emerald-950">Pothole Spikes Model (Monsoon Surge)</h3>
                <p className="text-xs text-emerald-800/70 leading-relaxed font-light">
                  Predicts a <strong>340% spike</strong> in road surface fissures across Ward 7 due to incoming seasonal rainfall. Pre-emptive patching scheduled.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex gap-4 items-start">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-800 flex-shrink-0 font-bold">🚛</div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-emerald-950">Waste Vehicle Route Optimizer</h3>
                <p className="text-xs text-emerald-800/70 leading-relaxed font-light">
                  Rerouting units WV-3 and WV-7 avoids regional bottlenecks, saving 2.4 hours/day and reducing missed collection slots by 67%.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex gap-4 items-start">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-800 flex-shrink-0 font-bold">📊</div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-emerald-950">Contractor Failure Risk Flag</h3>
                <p className="text-xs text-emerald-800/70 leading-relaxed font-light">
                  Metro Roads Ltd registered consecutive delays on 19 separate municipal works. AI flags a suspension recommendation for the Outer Ring Road bid.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm flex gap-4 items-start">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-800 flex-shrink-0 font-bold font-mono">3R</div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-emerald-950">Compost Kit Adoption Rising</h3>
                <p className="text-xs text-emerald-800/70 leading-relaxed font-light">
                  Dwarka residential green-bin separation spiked 34% this month. Recommending target vouchers for vermi-compost packages to lock in green trends.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "campaigns" && (
        <div className="space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>COMMUNITY VOLUNTEER DRIVES</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">Active Clean & Green Drives</h1>
            <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
              Join local environmental projects, collaborate with active neighbors, and earn 100 Credits for every drive joined.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-800" />
                <div className="text-4xl">{camp.emoji}</div>
                <h3 className="text-sm font-extrabold text-emerald-950">{camp.title}</h3>

                <div className="flex flex-col gap-1.5 text-[10px] text-emerald-800/60 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{camp.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{camp.location}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-emerald-950">
                    <span>Volunteers</span>
                    <span>{camp.volunteers} / {camp.target}</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-55 border border-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-800 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (camp.volunteers / camp.target) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  disabled={camp.joined}
                  onClick={() => handleJoinCampaign(camp.id)}
                  className={`w-full py-2.5 rounded-full text-xs font-bold transition-all ${
                    camp.joined
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                      : "bg-emerald-800 hover:bg-emerald-950 text-white cursor-pointer"
                  }`}
                >
                  {camp.joined ? "Joined ✓" : "Join (+100 XP)"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "leaderboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Leaderboard panel */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <span>Regional Ward Leaderboard</span>
              </h2>
              <p className="text-xs text-emerald-800/50 mt-1">
                Top citizens leading environmental action and verification audits in Ward 5 & 7.
              </p>
            </div>

            <div className="space-y-3">
              {leaderboard.map((user, idx) => (
                <div key={idx} className="flex items-center gap-4 py-3 border-b border-emerald-900/5 last:border-0">
                  <span className="text-sm font-bold text-emerald-800 w-6 text-center">{user.rank}</span>
                  <div className="w-9 h-9 rounded-full bg-emerald-800 text-emerald-50 font-bold text-xs flex items-center justify-center">
                    {user.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">{user.name}</h4>
                    <p className="text-[10px] text-emerald-800/50">{user.role} • {user.ward}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-emerald-800 font-mono">
                    {user.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Portal panel */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <span>Civic Learning Modules</span>
              </h2>
              <p className="text-xs text-emerald-800/50 mt-1">
                Complete modules to build civic awareness and acquire extra credits.
              </p>
            </div>

            <div className="space-y-3">
              {learningModules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => handleCompleteModule(mod.title, mod.xp)}
                  className="p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-700/20 bg-[#FBFDF9] cursor-pointer flex justify-between items-center transition-all group"
                >
                  <div className="flex gap-3 items-center">
                    <span className="text-2xl">{mod.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                        {mod.title}
                      </h4>
                      <p className="text-[10px] text-emerald-800/50">{mod.duration}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-full border border-emerald-100">
                    +{mod.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
