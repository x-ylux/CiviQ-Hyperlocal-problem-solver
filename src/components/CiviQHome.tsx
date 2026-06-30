import React, { useState, useEffect, useRef } from "react";
import { OnboardingData } from "../types";

interface CiviQHomeProps {
  onNavigate: (tab: string) => void;
  onboarding: OnboardingData;
  setOnboarding: (data: OnboardingData) => void;
  triggerToast: (icon: string, message: string) => void;
}

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  options?: string[];
  multiSelect?: boolean;
}

export function CiviQHome({ onNavigate, onboarding, setOnboarding, triggerToast }: CiviQHomeProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "ai",
      text: "👋 Namaste! Welcome to CiviQ. I'm your AI Civic Guide. To help personalize your dashboard and optimize your civic impact, let's complete a quick 30-second onboarding. First, what Ward do you live in?",
      options: ["Ward 7 (Rajouri Garden)", "Ward 3 (Pitampura)", "Ward 11 (Dwarka)", "Ward 5 (Malviya Nagar)"],
    },
  ]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleSelectOption = async (option: string) => {
    // Add user response
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: option,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      if (currentStep === 0) {
        // Step 0 -> Step 1: Ask for interests
        const wardNum = option.split(" ")[1] || "7";
        setOnboarding({
          ...onboarding,
          ward: wardNum,
        });

        const nextMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `Got it, Ward ${wardNum}! 📍 Now, which civic categories do you care about the most? (You can select multiple, then tap 'Confirm Categories')`,
          options: ["Roads & Potholes", "Water & Sanitation", "Waste Management", "Street Lighting", "Parks & Greenery"],
          multiSelect: true,
        };
        setChatMessages((prev) => [...prev, nextMsg]);
        setCurrentStep(1);
      } else if (currentStep === 2) {
        // Step 2 -> Final: Process previously reported and auto-suggest
        const reported = option.toLowerCase().startsWith("yes");
        const finalOnboarding: OnboardingData = {
          ...onboarding,
          reportedBefore: reported,
          completed: false, // still in flight
        };

        const analyzingMsg: Message = {
          id: `ai-anal-${Date.now()}`,
          sender: "ai",
          text: "⚙️ Customizing your local civic portal, calculating carbon baseline goals, and fetching personalized ward campaigns using Gemini...",
        };
        setChatMessages((prev) => [...prev, analyzingMsg]);
        setIsTyping(true);

        try {
          const res = await fetch("/api/gemini/onboarding-suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ward: onboarding.ward || "7",
              interests: selectedInterests,
              reportedBefore: reported,
            }),
          });
          const data = await res.json();
          setIsTyping(false);

          const successOnboarding: OnboardingData = {
            completed: true,
            ward: onboarding.ward || "7",
            interests: selectedInterests,
            reportedBefore: reported,
            greeting: data.personalizedGreeting,
            dashboardMessage: data.personalizedDashboardMessage,
            xpGoal: data.xpGoal || 300,
            suggestedCampaigns: data.suggestedCampaigns || [
              `Swachh Ward Drive — Ward ${onboarding.ward || "7"}`,
              "Segregation Champion Month"
            ],
            nextAction: data.nextAction,
          };
          setOnboarding(successOnboarding);
          triggerToast("🎉", "Profile personalized successfully!");
        } catch (e) {
          console.error("Onboarding setup failed", e);
          setIsTyping(false);
          const offlineOnboarding: OnboardingData = {
            completed: true,
            ward: onboarding.ward || "7",
            interests: selectedInterests,
            reportedBefore: reported,
            greeting: `Welcome back to Ward ${onboarding.ward || "7"}!`,
            dashboardMessage: `We've optimized your feedback channels for ${selectedInterests.join(" & ")}. Let's make our neighborhood model-class.`,
            xpGoal: 300,
            suggestedCampaigns: [`Swachh Ward Drive — Ward ${onboarding.ward || "7"}`],
            nextAction: "Report an issue in your ward to earn +150 XP!",
          };
          setOnboarding(offlineOnboarding);
          triggerToast("✨", "Onboarded with local settings!");
        }
      }
    }, 1000);
  };

  const handleToggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
    } else {
      setSelectedInterests((prev) => [...prev, interest]);
    }
  };

  const handleConfirmInterests = () => {
    if (selectedInterests.length === 0) {
      triggerToast("⚠️", "Please select at least one civic category!");
      return;
    }

    const userMsg: Message = {
      id: `u-interests-${Date.now()}`,
      sender: "user",
      text: `Focus areas: ${selectedInterests.join(", ")}`,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const nextMsg: Message = {
        id: `ai-rep-${Date.now()}`,
        sender: "ai",
        text: "Excellent choices! 🌿 Have you ever reported a municipal issue to civic authorities before?",
        options: ["Yes, I have reported before", "No, this is my first time"],
      };
      setChatMessages((prev) => [...prev, nextMsg]);
      setCurrentStep(2);
    }, 1000);
  };

  const handleReset = () => {
    const freshOnboarding: OnboardingData = {
      completed: false,
      ward: "",
      interests: [],
      reportedBefore: false,
    };
    setOnboarding(freshOnboarding);
    setCurrentStep(0);
    setSelectedInterests([]);
    setChatMessages([
      {
        id: "m0",
        sender: "ai",
        text: "👋 Welcome back! Let's re-calibrate your civic profile. First, what Ward do you live in?",
        options: ["Ward 7 (Rajouri Garden)", "Ward 3 (Pitampura)", "Ward 11 (Dwarka)", "Ward 5 (Malviya Nagar)"],
      },
    ]);
  };

  return (
    <div className="page active" id="page-home" style={{ display: "block" }}>
      {!onboarding.completed ? (
        // ONBOARDING CHAT FLOW
        <div className="hero" style={{ minHeight: "580px", padding: "3rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="hero-bg-circles">
            <div className="hero-circle" style={{ width: "500px", height: "500px", top: "-100px", left: "-100px" }}></div>
            <div className="hero-circle" style={{ width: "300px", height: "300px", bottom: "-50px", right: "-50px" }}></div>
          </div>
          <div className="card w-full max-w-2xl" style={{ border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(20px)", background: "rgba(30, 41, 59, 0.75)" }}>
            <div className="card-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--leaf)", animation: "pulse 1.5s infinite" }}></div>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", fontFamily: "Poppins, sans-serif" }}>
                  CiviQ Personalized Onboarding
                </span>
              </div>
              <span className="badge badge-ai" style={{ background: "rgba(124, 58, 237, 0.2)", color: "#C084FC" }}>
                <i className="fas fa-robot"></i> AI Guide
              </span>
            </div>
            
            {/* CHAT BUBBLES CONTAINER */}
            <div style={{ height: "320px", overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "0.85rem 1.1rem",
                      borderRadius: "18px",
                      borderBottomRightRadius: msg.sender === "user" ? "3px" : "18px",
                      borderBottomLeftRadius: msg.sender === "ai" ? "3px" : "18px",
                      background: msg.sender === "user" ? "var(--leaf)" : "rgba(255,255,255,0.1)",
                      color: msg.sender === "user" ? "white" : "rgba(255,255,255,0.95)",
                      fontSize: "0.88rem",
                      lineHeight: "1.5",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      padding: "0.75rem 1.2rem",
                      borderRadius: "18px",
                      borderBottomLeftRadius: "3px",
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <i className="fas fa-spinner fa-spin"></i> Guide is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT / OPTIONS AREA */}
            <div style={{ padding: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(15, 23, 42, 0.4)" }}>
              {chatMessages[chatMessages.length - 1]?.multiSelect ? (
                // MULTI-SELECT DISPLAY
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {chatMessages[chatMessages.length - 1].options?.map((opt) => {
                      const selected = selectedInterests.includes(opt);
                      return (
                        <button
                          key={opt}
                          className="btn btn-sm"
                          onClick={() => handleToggleInterest(opt)}
                          style={{
                            background: selected ? "var(--leaf)" : "rgba(255,255,255,0.08)",
                            color: "white",
                            border: selected ? "1px solid var(--leaf)" : "1px solid rgba(255,255,255,0.15)",
                            transition: "all 0.2s",
                          }}
                        >
                          {selected ? "✓ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="btn btn-green"
                    onClick={handleConfirmInterests}
                    style={{ alignSelf: "center", width: "200px" }}
                  >
                    Confirm Categories
                  </button>
                </div>
              ) : (
                // SINGLE OPTIONS DISPLAY
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {!isTyping &&
                    chatMessages[chatMessages.length - 1]?.options?.map((opt) => (
                      <button
                        key={opt}
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleSelectOption(opt)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "white",
                          borderRadius: "12px",
                          padding: "0.5rem 1rem",
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // PERSONALIZED WELCOME SCREEN
        <div className="hero glass-panel overflow-hidden relative rounded-[2rem] p-8 md:p-12 mb-10" style={{ minHeight: "440px", border: "1px solid rgba(255,255,255,0.8)" }}>
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1500"
              alt="Eco-civic forest backdrop"
              className="w-full h-full object-cover opacity-20 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/50"></div>
          </div>
          <div className="hero-content relative z-10" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "left" }}>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div className="hero-tag bg-emerald-100 border border-emerald-300 text-emerald-900 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold shadow-sm" style={{ marginBottom: 0 }}>
                <i className="fas fa-location-dot mr-2"></i> Ward {onboarding.ward} Citizen Hub
              </div>
              <div className="hero-tag bg-purple-100 border border-purple-300 text-purple-900 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold shadow-sm" style={{ marginBottom: 0 }}>
                <i className="fas fa-star mr-2"></i> Goal: {onboarding.xpGoal} XP Today
              </div>
            </div>
            
            <h1 className="text-emerald-950 font-black drop-shadow-sm" style={{ textAlign: "left", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              {onboarding.greeting || `Welcome to Ward ${onboarding.ward}!`}
            </h1>
            
            <p className="text-emerald-900 font-medium" style={{ textAlign: "left", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: 1.6, maxWidth: "680px" }}>
              {onboarding.dashboardMessage}
            </p>

            {/* ACTION CARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* TARGET XP PLAN CARD */}
              <div className="glass-panel p-6 rounded-2xl transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-bold font-sans text-lg text-emerald-950">
                    🎯 Daily Engagement Roadmap
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">Active</span>
                </div>
                <div className="text-sm text-emerald-800 mb-4 leading-relaxed font-medium">
                  We've calculated a daily target of <strong className="text-emerald-700">{onboarding.xpGoal} XP</strong> to help you scale local sustainability efforts:
                </div>
                <div className="flex items-center gap-4 bg-emerald-50/80 p-4 rounded-xl text-sm border border-emerald-100">
                  <i className="fas fa-lightbulb text-amber-500 text-xl animate-pulse"></i>
                  <div>
                    <strong className="block mb-1 text-emerald-950">First Recommendation:</strong> 
                    <span className="text-emerald-800">{onboarding.nextAction || "Report a new pothole cluster for instant +150 XP!"}</span>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED CAMPAIGN IN-LINE SUGGESTION */}
              <div className="glass-panel p-6 rounded-2xl transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-4">
                  <div className="font-bold font-sans text-lg text-emerald-950">
                    📣 Recommended Ward Campaigns
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold border border-purple-300">AI Suggested</span>
                </div>
                <div className="flex flex-col gap-3">
                  {onboarding.suggestedCampaigns?.map((camp, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-emerald-50/80 p-3 rounded-xl text-sm border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      <span className="font-semibold truncate max-w-[180px] text-emerald-900">
                        {camp}
                      </span>
                      <button
                        className="glass-button text-xs px-4 py-1.5 rounded-full shadow-sm text-white"
                        onClick={() => {
                          onNavigate("campaigns");
                          triggerToast("📣", `Loading ${camp}...`);
                        }}
                      >
                        Enlist
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex flex-wrap items-center gap-4">
              <button className="glass-button px-6 py-3 rounded-full font-bold shadow-lg text-sm text-white" onClick={() => onNavigate("report")}>
                <i className="fas fa-camera mr-2"></i> Report New Issue
              </button>
              <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-6 py-3 rounded-full font-bold shadow-sm transition-all text-sm" onClick={() => onNavigate("dashboard")}>
                <i className="fas fa-chart-line mr-2"></i> View Dashboard
              </button>
              <button 
                className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-6 py-3 rounded-full font-bold shadow-sm transition-all text-sm" 
                onClick={() => onNavigate("ai_showcase")}
              >
                <i className="fas fa-magic mr-2"></i> See AI Impact
              </button>
              <button
                onClick={handleReset}
                className="text-emerald-600 hover:text-emerald-800 text-xs underline transition-colors ml-2 cursor-pointer bg-transparent border-none font-medium"
              >
                Reset Onboarding Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="section" style={{ background: "transparent" }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-route"></i> How it works
            </div>
            <h2 className="section-title">From photo to fix in 4 steps</h2>
            <p className="section-sub">AI guides every step — from spotting the issue to crowdsourced verification of the fix.</p>
          </div>
          <div className="grid g4">
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                📷
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>Snap & report</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Take a photo or video. GPS auto-tags location. AI verifies it's a real issue.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.15))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                🤖
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>AI categorizes</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                AI assigns category, checks duplicates within 15m, and routes to the right authority.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.15))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                👥
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>
                Community verifies
              </div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Nearby citizens confirm the fix is real. Fake closures are rejected automatically.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(248,113,113,0.15))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                🏆
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>Earn credits</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Every action earns Civic Credits redeemable for utility discounts, free bus passes & more.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3R SECTION */}
      <div className="section" style={{ background: "transparent" }}>
        <div className="section-inner" style={{ background: "var(--bg2)", padding: "2.5rem", borderRadius: "var(--radius)" }}>
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-recycle"></i> The 3R principle
            </div>
            <h2 className="section-title">Reduce · Reuse · Recycle</h2>
            <p className="section-sub">
              Our platform is built around the 3R philosophy. Every action on CiviQ maps to one of these pillars.
            </p>
          </div>
          <div className="grid g3">
            <div
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(96,165,250,0.1))",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>♻️</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "var(--sky)", marginBottom: ".5rem" }}>Reduce</h3>
              <p style={{ fontSize: ".85rem", color: "var(--text)", opacity: 0.8, lineHeight: 1.6 }}>
                AI predicts waste hotspots before they form. Proactive prevention over reactive cleanup.
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.1))",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🔄</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "var(--amber)", marginBottom: ".5rem" }}>Reuse</h3>
              <p style={{ fontSize: ".85rem", color: "var(--text)", opacity: 0.8, lineHeight: 1.6 }}>
                Connect citizens with e-scrap dealers, compost kits, and material exchange programs.
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.1))",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🌱</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "var(--leaf)", marginBottom: ".5rem" }}>Recycle</h3>
              <p style={{ fontSize: ".85rem", color: "var(--text)", opacity: 0.8, lineHeight: 1.6 }}>
                Track recycling pickups live. Earn XP for segregation. Map nearest recycling plants.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI ROLES */}
      <div className="section" style={{ background: "transparent" }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-brain"></i> AI at the core
            </div>
            <h2 className="section-title">8 AI engines powering this platform</h2>
          </div>
          <div className="grid g4">
            {[
              { emoji: "🖼️", title: "Image Verifier", desc: "Detects spam, fake reports & invalid photos" },
              { emoji: "🏷️", title: "Issue Categorizer", desc: "Classifies issue type from image + description" },
              { emoji: "🔍", title: "Duplicate Detector", desc: "Merges reports within 15m radius" },
              { emoji: "💬", title: "Civic Assistant", desc: "24/7 AI chat for guidance & RTI help" },
              { emoji: "📊", title: "Insight Engine", desc: "Predicts issues before they spike" },
              { emoji: "📋", title: "RTI Generator", desc: "Auto-drafts legal notices for SLA breaches" },
              { emoji: "🗑️", title: "Bin Identifier", desc: "Photo → tells which bin it belongs in" },
              { emoji: "📣", title: "Campaign Recommender", desc: "Matches you to campaigns by location & interest" },
            ].map((role, idx) => (
              <div key={idx} className="card card-body" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: ".6rem" }}>{role.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: ".88rem", fontFamily: "Poppins, sans-serif", marginBottom: ".3rem" }}>
                  {role.title}
                </div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{role.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
