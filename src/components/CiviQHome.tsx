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
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatedAddress, setLocatedAddress] = useState<string>("");

  // Automatically fetch location on mount and auto-fill ward
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      
      const options = {
        enableHighAccuracy: false, // Much faster & more reliable inside standard iframes/sandboxes
        timeout: 6000,
        maximumAge: 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude, longitude } = position.coords;
          
          // Delhi coordinates of our 4 main wards
          const wards = [
            { id: "7", name: "Ward 7 (Rajouri Garden)", lat: 28.6415, lng: 77.1218 },
            { id: "3", name: "Ward 3 (Pitampura)", lat: 28.7032, lng: 77.1325 },
            { id: "11", name: "Ward 11 (Dwarka)", lat: 28.5921, lng: 77.0460 },
            { id: "5", name: "Ward 5 (Malviya Nagar)", lat: 28.5355, lng: 77.2081 }
          ];
          
          // Calculate closest ward by Euclidean distance
          let closestWard = wards[0];
          let minD = Infinity;
          wards.forEach(w => {
            const d = Math.hypot(w.lat - latitude, w.lng - longitude);
            if (d < minD) {
              minD = d;
              closestWard = w;
            }
          });
          
          setOnboarding({
            ...onboarding,
            ward: closestWard.id,
            completed: true,
          });
          
          setLocatedAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          triggerToast("📍", `Detected nearest: ${closestWard.name}`);
        },
        (error) => {
          console.warn("GPS fetch error (using standard fallback):", error.message);
          setIsLocating(false);
          
          let friendlyError = "GPS offline. Select ward manually.";
          if (error.code === error.PERMISSION_DENIED) {
            friendlyError = "GPS blocked. Select ward manually.";
          } else if (error.code === error.TIMEOUT) {
            friendlyError = "GPS timeout. Select ward manually.";
          }
          
          setLocatedAddress(friendlyError);
          
          // Standard fallback to default Ward 7 if not set
          if (!onboarding.ward) {
            setOnboarding({
              ...onboarding,
              ward: "7",
              completed: true,
            });
          }
        },
        options
      );
    } else {
      setLocatedAddress("GPS unsupported. Select ward manually.");
      if (!onboarding.ward) {
        setOnboarding({
          ...onboarding,
          ward: "7",
          completed: true,
        });
      }
    }
  }, []);

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
      {/* BEAUTIFUL GREENERY EARTH & ENVIRONMENTAL BANNER */}
      <div className="hero glass-panel overflow-hidden relative rounded-[2.5rem] p-8 md:p-12 mb-10 min-h-[480px] border border-emerald-900/10 flex flex-col justify-between shadow-xl">
        {/* Breathtaking Greenery Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1600"
            alt="Eco-civic lush green canopy"
            className="w-full h-full object-cover brightness-[0.45] contrast-[1.05]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent"></div>
          {/* Subtle slow pulsing green light glow */}
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        </div>

        {/* Hero Content Area */}
        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
          {/* Top Row: Decorative Header and Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-emerald-200 border border-emerald-400/20 uppercase tracking-wider shadow-sm">
              <i className="fas fa-globe-americas"></i>
              <span>CiviQ Planet Alliance</span>
            </div>
            
            <div className="text-emerald-300/80 font-mono text-[11px] font-semibold">
              <i className="far fa-clock mr-1"></i> Live Eco-Impact Tracker
            </div>
          </div>

          {/* Middle Row: Quote Block and Slogan */}
          <div className="max-w-3xl space-y-6 my-auto mx-auto text-center flex flex-col items-center">
            <div className="space-y-3">
              <span className="text-emerald-400 font-extrabold uppercase tracking-widest text-xs font-mono block">Weekly Environmental Inspiration</span>
              <h1 className="text-white font-black leading-tight tracking-tight drop-shadow-md text-3xl sm:text-4xl md:text-5xl" style={{ textAlign: "center" }}>
                Nurture Nature, Empower Community.
              </h1>
            </div>

            {/* Quote Card */}
            <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-500/20 p-6 rounded-2xl relative shadow-lg w-full">
              <div className="absolute -top-3 -left-2 text-4xl text-emerald-400/40 font-serif">“</div>
              <p className="text-emerald-100 text-sm sm:text-base md:text-lg italic font-medium leading-relaxed font-sans pr-4 pl-3" style={{ textAlign: "center" }}>
                The environment is where we all meet; where we all have a mutual interest; it is the one thing all of us share.
              </p>
              <div className="mt-3 text-center">
                <span className="text-emerald-300 text-xs font-black uppercase tracking-wider">— Lady Bird Johnson</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Quick Stats & Preferences Configurator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-emerald-500/10">
            {/* Quick Quote of the Day Highlight */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <i className="fas fa-leaf"></i>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300/80 font-bold block uppercase tracking-wider">Earth Action Target</span>
                <span className="text-white font-black text-xs block">Carbon Neutrality Model</span>
              </div>
            </div>

            {/* Personalization state trigger */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <i className="fas fa-award"></i>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300/80 font-bold block uppercase tracking-wider">Your Civic Goal</span>
                <span className="text-white font-black text-xs block">Earn {onboarding.xpGoal || 300} XP Daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>



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
