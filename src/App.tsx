import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, OnboardingData, CivicIssue } from "./types";

// Modular Views
import { CiviQHome } from "./components/CiviQHome";
import { CiviQDashboard } from "./components/CiviQDashboard";
import { CiviQReport } from "./components/CiviQReport";
import { CiviQMap } from "./components/CiviQMap";
import { CiviQTrack } from "./components/CiviQTrack";
import { CiviQCampaigns } from "./components/CiviQCampaigns";
import { CiviQGames, GameItem } from "./components/CiviQGames";
import { CiviQWasteHub } from "./components/CiviQWasteHub";
import { CiviQCredits } from "./components/CiviQCredits";
import { CiviQInsights } from "./components/CiviQInsights";
import { CiviQCarbonTracker } from "./components/CiviQCarbonTracker";
import { CiviQLogin } from "./components/CiviQLogin";

// Static Games Data
const items: GameItem[] = [
  { emoji: "🍌", label: "Banana peel", bin: "green" },
  { emoji: "🥤", label: "Plastic bottle", bin: "blue" },
  { emoji: "💊", label: "Medicine packet", bin: "red" },
  { emoji: "📰", label: "Old newspaper", bin: "blue" },
  { emoji: "🥕", label: "Vegetable peel", bin: "green" },
  { emoji: "🔋", label: "Used battery", bin: "red" },
  { emoji: "🍾", label: "Glass bottle", bin: "blue" },
  { emoji: "🍕", label: "Leftover food", bin: "green" },
  { emoji: "💉", label: "Syringe", bin: "red" },
  { emoji: "📦", label: "Cardboard box", bin: "blue" },
  { emoji: "☕", label: "Tea leaves", bin: "green" },
  { emoji: "🧴", label: "Shampoo bottle", bin: "blue" },
];

const quizQs = [
  {
    q: "What does RTI stand for, and when can you use it?",
    opts: [
      "Right to Information — for government data requests",
      "Road Traffic Index",
      "Report of Town Issues",
      "Real-Time Infrastructure",
    ],
    ans: 0,
    exp: "The Right to Information Act (2005) allows any Indian citizen to request information from public authorities within 30 days.",
  },
  {
    q: "Which bin should used batteries go into?",
    opts: [
      "Green bin (biodegradable)",
      "Blue bin (recyclable)",
      "Red bin (hazardous/non-biodegradable)",
      "Any bin is fine",
    ],
    ans: 2,
    exp: "Batteries contain toxic chemicals. They belong in the Red bin for hazardous waste and should be taken to designated e-waste collection points.",
  },
  {
    q: "What does the SLA Breach mean in CivicAI?",
    opts: [
      "A new law passed",
      "A Service Level Agreement deadline missed by authorities",
      "A citizen complaint escalated",
      "A waste vehicle breakdown",
    ],
    ans: 1,
    exp: "SLA (Service Level Agreement) defines the deadline by which civic authorities must resolve an issue. A breach means the deadline was missed.",
  },
  {
    q: "What is the 3R principle in waste management?",
    opts: [
      "Report, Review, Resolve",
      "Reduce, Reuse, Recycle",
      "Red, Round, Remove",
      "Register, Report, Rate",
    ],
    ans: 1,
    exp: "Reduce (produce less waste), Reuse (use items again), Recycle (process waste into new materials). Follow this order — reduction is always best!",
  },
];

// Offline chatbot dictionary
const aiReplies: Record<string, string> = {
  report:
    "To report an issue: tap the Report tab, upload a photo, select category, confirm GPS location, and submit. You earn +50–150 XP per report. Our AI will verify the image and check for nearby duplicates! 📷",
  rti:
    "The RTI (Right to Information) Act lets you request information from any government body within 30 days. On CivicAI, if your issue is ignored past the SLA deadline, tap 'Generate RTI' on the ticket page and we auto-draft it for you! ⚖️",
  recycl:
    "I found 3 recycling plants near Jaipur: (1) GreenCycle Malviya Nagar — 2.3km, (2) EcoSort Vaishali Nagar — 3.8km, (3) PureRecycle Tonk Road — 5.1km. Tap the Map tab to see them on the live map! ♻️",
  xp:
    "Great question! Earn XP by: reporting issues (+50–150), verifying fixes (+30), playing games (+10–25 each), joining campaigns (+60–120), completing learning modules (+50–100), and daily login streaks (+10/day) 🌟",
  bin:
    "Use 3 bins: 🟢 Green = food waste & organics, 🔵 Blue = paper/glass/plastic (recyclables), 🔴 Red = medicines/batteries/sanitary waste. When in doubt, use the Bin Sorter game to practice! I can also identify items if you tell me what it is.",
  default:
    "I can help with reporting issues, understanding RTI rights, finding recycling centers, earning XP, waste segregation, and more! What specific civic topic can I assist you with? 🌿",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("civiq_theme") === "dark";
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("civiq_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("civiq_theme", "light");
    }
  }, [isDarkMode]);
  const [credits, setCredits] = useState<number>(0);
  const isUserLoggedIn = !!userProfile && (userProfile.uid.startsWith("sb_") || !auth.currentUser?.isAnonymous);
  const [reportStep, setReportStep] = useState<number>(1);
  const [selectedCat, setSelectedCat] = useState<string>("Roads");

  // Onboarding & Incident states
  const [onboarding, setOnboarding] = useState<OnboardingData>({
    completed: false,
    ward: "",
    interests: [],
    reportedBefore: false,
  });

  const [issues, setIssues] = useState<CivicIssue[]>([
    {
      id: "1042",
      title: "Pothole cluster — Ward 7",
      category: "Roads",
      address: "Rajouri Garden Sector 5",
      lat: 28.6648,
      lng: 77.1167,
      daysOpen: 14,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      slaDays: 10,
      upvotes: 143,
      status: "In progress",
      severity: "Critical",
      verifiedCount: 38,
      budget: "₹4,20,000",
      contractorName: "Metro Roads Ltd",
      contractorRating: 71,
      populationDensity: 18400,
      weatherForecast: "Heavy Rain & Storm Alert",
      assignedOfficer: "Dy. Commissioner",
      description: "Severe pothole cluster blocking traffic flow on Rajouri Garden Main Road. Highly hazardous during rainy hours.",
    },
    {
      id: "1085",
      title: "Broken street lamp grid",
      category: "Lights",
      address: "Dwarka Sector 11 Main Market",
      lat: 28.5855,
      lng: 77.0601,
      daysOpen: 2,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      slaDays: 7,
      upvotes: 24,
      status: "Open",
      severity: "Medium",
      verifiedCount: 4,
      budget: "₹65,000",
      contractorName: "BrightLite Systems",
      contractorRating: 88,
      populationDensity: 12500,
      weatherForecast: "Clear Sky",
      assignedOfficer: "Asst. Engineer Lights",
      description: "A block of 5 streetlights is completely dark near Sector 11 metro station gate, creating dark zones for pedestrians.",
    },
    {
      id: "1091",
      title: "Water pipeline leakage",
      category: "Water",
      address: "Pitampura Block KP-23",
      lat: 28.7032,
      lng: 77.1325,
      daysOpen: 1,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      slaDays: 5,
      upvotes: 68,
      status: "In progress",
      severity: "High",
      verifiedCount: 12,
      budget: "₹1,80,000",
      contractorName: "AquaFlow Solutions",
      contractorRating: 92,
      populationDensity: 24000,
      weatherForecast: "Thunderstorms Expected",
      assignedOfficer: "Executive Engineer (DJB)",
      description: "Clean drinking water bursting through the main pipeline beneath the pavement, wasting thousands of gallons hourly.",
    }
  ]);

  const [selectedIssueId, setSelectedIssueId] = useState<string>("1042");

  // Games
  const [gameTab, setGameTab] = useState<"sort" | "quiz" | "speed">("sort");
  const [sortScore, setSortScore] = useState<number>(0);
  const [sortIdx, setSortIdx] = useState<number>(0);
  const [sortLevel, setSortLevel] = useState<number>(1);
  const [sortFeedback, setSortFeedback] = useState<{ text: string; isCorrect: boolean | null }>({
    text: "",
    isCorrect: null,
  });

  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);

  const [speedState, setSpeedState] = useState<"start" | "playing" | "end">("start");
  const [speedCount, setSpeedCount] = useState<number>(60);
  const [speedScoreVal, setSpeedScoreVal] = useState<number>(0);
  const [speedIdx, setSpeedIdx] = useState<number>(0);
  const [speedFeedback, setSpeedFeedback] = useState<{ text: string; isCorrect: boolean | null }>({
    text: "",
    isCorrect: null,
  });

  // Campaigns
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [joinedCampaigns, setJoinedCampaigns] = useState<string[]>([]);

  // Chatbot
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; role: "bot" | "user" }>>([
    {
      text: "👋 Hi! I'm your CivicAI assistant. I can help you report issues, generate RTIs, find recycling centers, or answer civic questions!",
      role: "bot",
    },
  ]);
  const [typing, setTyping] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; icon: string; message: string }>({
    visible: false,
    icon: "",
    message: "",
  });

  // Modal
  const [modal, setModal] = useState<{ open: boolean; type: "rti" | "compost" | "welcome" | "" }>({
    open: false,
    type: "",
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setPageKey((k) => k + 1);
  };

  // Welcome popup on first visit
  useEffect(() => {
    if (!localStorage.getItem("civiq_welcome_seen")) {
      const timer = setTimeout(() => {
        setModal({ open: true, type: "welcome" });
        localStorage.setItem("civiq_welcome_seen", "1");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Falling leaves effect
  useEffect(() => {
    const emojis = ["🌿", "🍃", "🌱", "♻️", "🍀"];
    const container = document.getElementById("leavesContainer");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 12; i++) {
      const l = document.createElement("div");
      l.className = "leaf";
      l.style.cssText = `left:${Math.random() * 100}%;font-size:${14 + Math.random() * 12}px;animation-duration:${
        8 + Math.random() * 12
      }s;animation-delay:${Math.random() * 10}s;`;
      l.textContent = emojis[i % emojis.length];
      container.appendChild(l);
    }
  }, [activeTab]);

  // Load user profile & credits
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clean slate policy: do not pre-populate or mock data. Wait for genuine Firebase Auth.
      if (user && !user.isAnonymous) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (data) {
              if (data.credits > 0 && localStorage.getItem("civiq_reset_credits") !== "done") {
                await setDoc(doc(db, "users", user.uid), { credits: 0 }, { merge: true });
                data.credits = 0;
                localStorage.setItem("civiq_reset_credits", "done");
              }
              
              // Daily Login Streak Logic
              const today = new Date().toISOString().split("T")[0];
              let currentStreak = data.loginStreak || 0;
              const lastDate = data.lastLoginDate;
              let bonusXP = 0;

              if (lastDate !== today) {
                if (lastDate) {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toISOString().split("T")[0];
                  if (lastDate === yesterdayStr) {
                    currentStreak += 1;
                  } else {
                    currentStreak = 1;
                  }
                } else {
                  currentStreak = 1;
                }
                
                bonusXP = currentStreak > 1 ? Math.min(currentStreak * 10, 100) : 10; // Base 10 XP for login
                
                data.loginStreak = currentStreak;
                data.lastLoginDate = today;
                data.credits = (data.credits || 0) + bonusXP;
                
                await setDoc(doc(db, "users", user.uid), { 
                  loginStreak: currentStreak, 
                  lastLoginDate: today,
                  credits: data.credits 
                }, { merge: true });
              }

              setUserProfile(data);
              if (typeof data.credits === "number") {
                setCredits(data.credits);
              }
              
              // We need to trigger this after the component renders or just use standard state
              if (bonusXP > 0) {
                 setTimeout(() => triggerToast("🔥", `Streak Day ${currentStreak}! +${bonusXP} XP`), 1000);
              }
            }
          } else {
            // Register initial profile in firestore with clean slate (0 credits)
            const today = new Date().toISOString().split("T")[0];
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "New Citizen",
              role: "citizen",
              credits: 10, // 10 initial XP for first login
              mfaEnabled: false,
              createdAt: new Date().toISOString(),
              loginStreak: 1,
              lastLoginDate: today
            };
            await setDoc(doc(db, "users", user.uid), newProfile);
            setUserProfile(newProfile);
            setCredits(10);
            setTimeout(() => triggerToast("🔥", `Streak Day 1! +10 XP`), 1000);
          }
        } catch (err) {
          console.warn("Firestore profile sync block (offline fallback):", err);
          const offlineProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "New Citizen",
            role: "citizen",
            credits: 0,
            mfaEnabled: false,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(offlineProfile);
          loadLocalProfile();
        }
      } else {
        setUserProfile(null);
        setCredits(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadLocalProfile = () => {
    const local = localStorage.getItem("civicai_credits");
    if (local) {
      setCredits(parseInt(local) || 0);
    }
  };

  const handleUpdateCredits = async (newVal: number) => {
    setCredits(newVal);
    localStorage.setItem("civicai_credits", newVal.toString());

    const activeSandboxJson = localStorage.getItem("civiq_active_user");
    if (activeSandboxJson) {
      try {
        const sandboxProfile = JSON.parse(activeSandboxJson) as UserProfile;
        sandboxProfile.credits = newVal;
        localStorage.setItem("civiq_active_user", JSON.stringify(sandboxProfile));
        setUserProfile(sandboxProfile);

        const sbUsersStr = localStorage.getItem("civiq_sandbox_users");
        if (sbUsersStr) {
          const sbUsers = JSON.parse(sbUsersStr) as any[];
          const idx = sbUsers.findIndex(u => u.uid === sandboxProfile.uid);
          if (idx !== -1) {
            sbUsers[idx].credits = newVal;
            localStorage.setItem("civiq_sandbox_users", JSON.stringify(sbUsers));
          }
        }
        return;
      } catch (e) {
        console.warn("Error updating sandbox credits", e);
      }
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { credits: newVal }, { merge: true });
      } catch (err) {
        console.warn("Firestore credits save offline:", err);
      }
    }
  };

  const triggerToast = (icon: string, message: string) => {
    setToast({ visible: true, icon, message });
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Modal actions
  const openModal = (type: "rti" | "compost") => {
    setModal({ open: true, type });
  };

  const closeModal = () => {
    setModal({ open: false, type: "" });
  };

  // Speed Sorter countdown timer
  useEffect(() => {
    let timer: any;
    if (gameTab === "speed" && speedState === "playing") {
      timer = setInterval(() => {
        setSpeedCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // End speed game
            setSpeedState("end");
            const earnedXp = speedScoreVal * 2;
            handleUpdateCredits(credits + earnedXp);
            triggerToast("⚡", `Speed Sort complete! +${earnedXp} XP earned!`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameTab, speedState, speedScoreVal, credits]);

  const resetSpeedGame = () => {
    setSpeedState("start");
    setSpeedCount(60);
    setSpeedScoreVal(0);
    setSpeedIdx(0);
    setSpeedFeedback({ text: "", isCorrect: null });
  };

  const startSpeedGame = () => {
    setSpeedScoreVal(0);
    setSpeedCount(60);
    setSpeedIdx(0);
    setSpeedFeedback({ text: "", isCorrect: null });
    setSpeedState("playing");
  };

  const checkSpeedAnswer = (bin: string) => {
    if (speedState !== "playing") return;
    const cur = items[speedIdx % items.length];
    if (bin === cur.bin) {
      setSpeedScoreVal((s) => s + 2);
      setSpeedFeedback({ text: "✅", isCorrect: true });
    } else {
      setSpeedFeedback({ text: "❌", isCorrect: false });
    }
    setSpeedIdx((i) => i + 1);
  };

  // Bin Sorter actions
  const checkSortBin = (chosen: string) => {
    const cur = items[sortIdx % items.length];
    const names: Record<string, string> = {
      red: "Red (Non-biodegradable)",
      green: "Green (Biodegradable)",
      blue: "Blue (Dry recyclable)",
    };
    if (chosen === cur.bin) {
      const nextScore = sortScore + 10;
      setSortScore(nextScore);
      handleUpdateCredits(credits + 10);
      setSortFeedback({ text: "✅ Correct! +10 XP", isCorrect: true });
      if (nextScore % 50 === 0 && nextScore > 0) {
        setSortLevel((l) => l + 1);
      }
    } else {
      setSortFeedback({
        text: `❌ Wrong! Should go in ${names[cur.bin]}`,
        isCorrect: false,
      });
    }
    setTimeout(() => {
      setSortIdx((idx) => idx + 1);
      setSortFeedback({ text: "", isCorrect: null });
    }, 900);
  };

  const nextSortItem = () => {
    setSortIdx((idx) => idx + 1);
    setSortFeedback({ text: "", isCorrect: null });
  };

  // Quiz actions
  const handleQuizOptionClick = (oIdx: number, ansIdx: number) => {
    if (quizAnswered) return;
    setQuizSelected(oIdx);
    setQuizAnswered(true);
    if (oIdx === ansIdx) {
      setQuizScore((s) => s + 1);
      handleUpdateCredits(credits + 25);
      triggerToast("🧠", "Correct answer! +25 XP earned.");
    }
  };

  const nextQuizQuestion = () => {
    setQuizIdx((idx) => idx + 1);
    setQuizAnswered(false);
    setQuizSelected(null);
  };

  // Report Flow
  const handleReportSubmit = (reportData: {
    title: string;
    category: string;
    severity: string;
    description: string;
    address: string;
    image?: string;
    voiceTranscription?: string;
  }) => {
    const newId = (1000 + Math.floor(Math.random() * 9000)).toString();
    const newIssue: CivicIssue = {
      id: newId,
      title: reportData.title || "Reported Incident",
      category: reportData.category || "Roads",
      address: reportData.address || "Rajouri Garden, Sector 5",
      lat: 28.6648,
      lng: 77.1167,
      daysOpen: 0,
      createdAt: new Date().toISOString(),
      slaDays: reportData.severity === "Critical" ? 3 : reportData.severity === "High" ? 5 : 7,
      upvotes: 1,
      status: "Open",
      severity: reportData.severity as any || "Medium",
      verifiedCount: 0,
      budget: "₹45,000 (Allocating)",
      contractorName: "GreenBuild Pvt Ltd",
      contractorRating: 94,
      populationDensity: 15000,
      weatherForecast: "Slight Overcast",
      assignedOfficer: "Zone Supervisor",
      image: reportData.image,
      voiceTranscription: reportData.voiceTranscription,
    };

    setIssues((prev) => [newIssue, ...prev]);
    setSelectedIssueId(newId);
    setReportStep(4);
    handleUpdateCredits(credits + 150);
    triggerToast("⭐", "Report submitted! Background duplication checks passed! +150 XP");
  };

  const handleUpvoteIssue = (id: string) => {
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === id) {
          return { ...iss, upvotes: iss.upvotes + 1 };
        }
        return iss;
      })
    );
  };

  const resetReport = () => {
    setReportStep(1);
    setSelectedCat("Roads");
    navigateTo("dashboard");
  };

  // Campaigns enlisting
  const handleJoinCampaign = (title: string, xp: number) => {
    setJoinedCampaigns((prev) => [...prev, title]);
    handleUpdateCredits(credits + xp);
    triggerToast("🎉", `You joined "${title}"! XP credited.`);
  };

  // Compost shop
  const buyCompostItem = (name: string, price: number) => {
    if (credits < price) {
      triggerToast("❌", `Insufficient credits! Need ${price} credits to redeem.`);
      return;
    }
    handleUpdateCredits(credits - price);
    triggerToast("🪣", `Redeemed "${name}"! ${price} credits deducted.`);
  };

  // General Redeem Awards
  const redeemReward = (msg: string, cost: number) => {
    if (credits < cost) {
      triggerToast("❌", `Insufficient credits! Need ${cost} credits.`);
      return;
    }
    handleUpdateCredits(credits - cost);
    triggerToast("🎁", msg);
  };

  // Civic learning
  const startCivicLearning = (title: string, xp: number) => {
    handleUpdateCredits(credits + xp);
    triggerToast("🎓", `Completed: "${title}"! Awarded +${xp} XP.`);
  };

  // Chat messages sending
  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    sendChatMessage(text);
  };

  const sendChatMessage = (text: string) => {
    setChatMessages((prev) => [...prev, { text, role: "user" }]);
    setChatInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const cleaned = text.toLowerCase();
      let reply = aiReplies.default;
      if (cleaned.includes("report") || cleaned.includes("issue")) {
        reply = aiReplies.report;
      } else if (cleaned.includes("rti")) {
        reply = aiReplies.rti;
      } else if (cleaned.includes("recycl") || cleaned.includes("plant") || cleaned.includes("center")) {
        reply = aiReplies.recycl;
      } else if (cleaned.includes("xp") || cleaned.includes("credit") || cleaned.includes("earn")) {
        reply = aiReplies.xp;
      } else if (cleaned.includes("bin") || cleaned.includes("trash") || cleaned.includes("segregat")) {
        reply = aiReplies.bin;
      }
      setChatMessages((prev) => [...prev, { text: reply, role: "bot" }]);
    }, 800);
  };

  return (
    <div className="min-h-screen antialiased relative" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Falling Leaves Background container */}
      <div className="leaves-container" id="leavesContainer"></div>

      {/* Navbar exactly like civiQ.html */}
      <nav className="nav" id="navbar">
        <button
          className="nav-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`} />
        </button>
        <a
          className="nav-logo"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("home");
          }}
        >
          <div className="nav-logo-icon">
            <i className="fas fa-leaf"></i>
          </div>
          CivicAI
        </a>
        <div className="nav-links">
          {[
            { tab: "home", label: "Home" },
            { tab: "dashboard", label: "Dashboard" },
            { tab: "report", label: "Report" },
            { tab: "map", label: "Map" },
            { tab: "track", label: "Track" },
            { tab: "campaigns", label: "Campaigns" },
            { tab: "games", label: "Games" },
            { tab: "waste", label: "Waste Hub" },
            { tab: "carbon", label: "Carbon Tracker" },
            { tab: "gamify", label: "Credits" },
            { tab: "insights", label: "AI Insights" },
            { tab: "login", label: isUserLoggedIn ? "My Profile" : "Login" },
          ].map(({ tab, label }) => (
            <button
              key={tab}
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => navigateTo(tab)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button
            className="nav-link"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Dark Mode"
            style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
          {isUserLoggedIn && (
            <div className="xp-badge">
              <i className="fas fa-star"></i> {credits.toLocaleString()} XP
            </div>
          )}
          <button className="nav-btn" onClick={() => navigateTo("report")}>
            <i className="fas fa-plus"></i> Report
          </button>
          {isUserLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                className="nav-avatar"
                title={userProfile?.displayName || userProfile?.email}
                onClick={() => navigateTo("login")}
                style={{ cursor: "pointer", background: "var(--forest)", color: "white" }}
              >
                {userProfile?.displayName
                  ? userProfile.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "C"}
              </div>
              <button
                className="nav-link"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={async () => {
                  try {
                    localStorage.removeItem("civiq_active_user");
                    await signOut(auth);
                    triggerToast("🔓", "Logged out successfully!");
                    navigateTo("login");
                  } catch (err) {
                    console.error("Sign out error", err);
                  }
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                className="btn btn-ghost"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.4rem 0.8rem",
                  background: "var(--bg2)",
                  borderRadius: "8px",
                  fontWeight: 600,
                  color: "var(--forest)",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => navigateTo("login")}
              >
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
              <div className="nav-avatar" title="Guest Citizen" onClick={() => navigateTo("login")}>
                GC
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-menu-grid">
          {[
            { tab: "home", icon: "fa-home", label: "Home" },
            { tab: "dashboard", icon: "fa-chart-line", label: "Dashboard" },
            { tab: "report", icon: "fa-camera", label: "Report" },
            { tab: "map", icon: "fa-map", label: "Map" },
            { tab: "track", icon: "fa-list-check", label: "Track" },
            { tab: "campaigns", icon: "fa-bullhorn", label: "Campaigns" },
            { tab: "games", icon: "fa-gamepad", label: "Games" },
            { tab: "waste", icon: "fa-recycle", label: "Waste Hub" },
            { tab: "carbon", icon: "fa-cloud", label: "Carbon" },
            { tab: "gamify", icon: "fa-star", label: "Credits" },
            { tab: "insights", icon: "fa-brain", label: "AI Insights" },
            { tab: "login", icon: "fa-user", label: isUserLoggedIn ? "Profile" : "Login" },
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              className={`mobile-menu-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => navigateTo(tab)}
            >
              <i className={`fas ${icon}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom mobile navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {[
            { tab: "home", icon: "fa-home", label: "Home" },
            { tab: "map", icon: "fa-map", label: "Map" },
            { tab: "report", icon: "fa-plus", label: "Report", isReport: true },
            { tab: "track", icon: "fa-list-check", label: "Track" },
            { tab: "login", icon: "fa-user", label: "Profile" },
          ].map(({ tab, icon, label, isReport }) => (
            <button
              key={tab}
              className={`bottom-nav-item ${isReport ? "report-btn" : ""} ${activeTab === tab ? "active" : ""}`}
              onClick={() => navigateTo(tab)}
            >
              <i className={`fas ${icon}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main page view containers matching civiQ.html active class and display toggles */}
      <main style={{ marginTop: "70px", paddingBottom: "80px" }}>
        <div key={pageKey} className="page-enter">
        {activeTab === "home" && (
          <CiviQHome
            onNavigate={navigateTo}
            onboarding={onboarding}
            setOnboarding={setOnboarding}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "dashboard" && (
          <CiviQDashboard onNavigate={navigateTo} openModal={openModal} triggerToast={triggerToast} />
        )}

        {activeTab === "report" && (
          <CiviQReport
            onNavigate={navigateTo}
            reportStep={reportStep}
            setReportStep={setReportStep}
            selectedCat={selectedCat}
            setSelectedCat={setSelectedCat}
            onReportSubmit={handleReportSubmit}
            onResetReport={resetReport}
            openModal={openModal}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "map" && <CiviQMap triggerToast={triggerToast} />}

        {activeTab === "track" && (
          <CiviQTrack
            issues={issues}
            selectedIssueId={selectedIssueId}
            setSelectedIssueId={setSelectedIssueId}
            openModal={openModal}
            triggerToast={triggerToast}
            onUpvoteIssue={handleUpvoteIssue}
          />
        )}

        {activeTab === "campaigns" && (
          <CiviQCampaigns
            campaignFilter={campaignFilter}
            setCampaignFilter={setCampaignFilter}
            joinedCampaigns={joinedCampaigns}
            onJoinCampaign={handleJoinCampaign}
          />
        )}

        {activeTab === "games" && (
          <CiviQGames
            gameTab={gameTab}
            setGameTab={setGameTab}
            items={items}
            sortScore={sortScore}
            sortIdx={sortIdx}
            sortLevel={sortLevel}
            sortFeedback={sortFeedback}
            checkSortBin={checkSortBin}
            nextSortItem={nextSortItem}
            quizScore={quizScore}
            quizIdx={quizIdx}
            quizAnswered={quizAnswered}
            quizSelected={quizSelected}
            quizQs={quizQs}
            onQuizOptionClick={handleQuizOptionClick}
            nextQuizQuestion={nextQuizQuestion}
            speedState={speedState}
            speedCount={speedCount}
            speedScoreVal={speedScoreVal}
            speedIdx={speedIdx}
            speedFeedback={speedFeedback}
            onStartSpeedGame={startSpeedGame}
            onCheckSpeedAnswer={checkSpeedAnswer}
            onResetSpeedGame={resetSpeedGame}
          />
        )}

        {activeTab === "waste" && (
          <CiviQWasteHub
            onNavigate={navigateTo}
            openModal={openModal}
            triggerToast={triggerToast}
            onBuyCompostItem={buyCompostItem}
          />
        )}

        {activeTab === "carbon" && (
          <CiviQCarbonTracker
            credits={credits}
            handleUpdateCredits={handleUpdateCredits}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "gamify" && (
          <CiviQCredits
            credits={credits}
            userProfile={userProfile}
            onNavigate={navigateTo}
            triggerToast={triggerToast}
            onRedeemReward={redeemReward}
            onStartCivicLearning={startCivicLearning}
            setGameTab={setGameTab}
          />
        )}

        {activeTab === "insights" && <CiviQInsights triggerToast={triggerToast} />}

        {activeTab === "login" && (
          <CiviQLogin
            onNavigate={navigateTo}
            triggerToast={triggerToast}
            userProfile={userProfile}
            credits={credits}
          />
        )}
        </div>
      </main>

      {/* Floating Smart AI Chatbot assistant with standard or keyword responses */}
      <div className="ai-orb">
        <div className={`ai-chat ${chatOpen ? "open" : ""}`} id="aiChat">
          <div className="ai-chat-header">
            <div className="ai-chat-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <div className="ai-chat-name">CivicAI Assistant</div>
              <div className="ai-chat-status">
                <span className="ai-dot"></span> Always online
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setChatOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="ai-messages" id="aiMessages">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`ai-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {typing && (
              <div className="ai-typing" id="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="ai-chips">
            <div className="ai-chip" onClick={() => sendChatMessage("How do I report an issue?")}>
              How to report?
            </div>
            <div className="ai-chip" onClick={() => sendChatMessage("What is RTI?")}>
              What is RTI?
            </div>
            <div className="ai-chip" onClick={() => sendChatMessage("Find recycling plant near me")}>
              Recycling near me
            </div>
            <div className="ai-chip" onClick={() => sendChatMessage("How can I earn more XP?")}>
              Earn XP
            </div>
          </div>
          <div className="ai-input-row">
            <input
              className="ai-input"
              id="aiInput"
              placeholder="Ask anything civic..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
            />
            <button className="ai-send" onClick={handleSendChat}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        <button className="ai-orb-btn" onClick={() => setChatOpen(!chatOpen)} title="Chat with CivicAI">
          <i className="fas fa-robot"></i>
        </button>
      </div>

      {/* Dynamic Toast System */}
      <div className={`toast ${toast.visible ? "show" : ""}`} id="toast">
        <div className="toast-icon" id="toastIcon" style={{ background: "#E8F5E9" }}>
          {toast.icon}
        </div>
        <div>
          <div id="toastMsg" style={{ fontWeight: 600, fontSize: ".88rem", fontFamily: "Poppins, sans-serif" }}>
            {toast.message}
          </div>
        </div>
        <button
          onClick={() => setToast({ ...toast, visible: false })}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Modal Dialog System */}
      <div
        className={`modal-overlay ${modal.open ? "open" : ""}`}
        id="modalOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal" id="modalContent">
          <button className="modal-close" onClick={closeModal}>
            <i className="fas fa-times"></i>
          </button>
          {modal.type === "rti" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "3rem" }}>📋</div>
                <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#BF360C", margin: ".5rem 0" }}>Generate RTI Notice</h3>
                <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>
                  Auto-drafting legally binding RTI for Ticket #1042 — 4 days overdue
                </p>
              </div>
              <div style={{ background: "#FFF3E0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem", fontSize: ".85rem", lineHeight: 1.8 }}>
                <strong>To:</strong> Public Information Officer, Municipal Corporation
                <br />
                <strong>Subject:</strong> RTI Application — Unresolved Pothole Cluster (Ticket #1042)
                <br />
                <br />
                Under the Right to Information Act, 2005, I hereby request:
                <br />
                1. Status of repair work for pothole cluster at Rajouri Garden Sector 5
                <br />
                2. Contractor assignment and payment details (₹4,20,000 sanctioned)
                <br />
                3. Reason for SLA breach (14+ days pending)
                <br />
                4. Action taken against responsible engineer
                <br />
                <br />
                Requestor: {userProfile?.displayName || "Priya Malhotra"} | Date: June 27, 2026
              </div>
              <div style={{ display: "flex", gap: ".75rem" }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    closeModal();
                    triggerToast("📋", "RTI saved as draft");
                  }}
                >
                  Save draft
                </button>
                <button
                  className="btn btn-green"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    closeModal();
                    triggerToast("✅", "RTI submitted! Authorities have 30 days to respond.");
                  }}
                >
                  Submit RTI
                </button>
              </div>
            </>
          )}
          {modal.type === "welcome" && (
            <>
              <div
                style={{
                  height: "140px",
                  borderRadius: "16px",
                  backgroundImage: "url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  marginBottom: "1.25rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(13,31,15,0.8), transparent)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "1rem",
                    color: "white",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  🌍 Welcome to CivicAI
                </div>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                Your hyperlocal platform for reporting civic issues, tracking fixes, earning XP, and making your neighborhood greener. Everything is connected — report, track, play, and earn!
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "1.25rem" }}>
                {[
                  { icon: "📷", text: "Report issues with photo + GPS" },
                  { icon: "🗺️", text: "Track progress on live map" },
                  { icon: "♻️", text: "Learn waste segregation & earn credits" },
                ].map((item) => (
                  <div
                    key={item.text}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.65rem 0.85rem",
                      background: "var(--bg2)",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={closeModal}
                >
                  Explore
                </button>
                <button
                  className="btn btn-green"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    closeModal();
                    navigateTo("login");
                  }}
                >
                  <i className="fas fa-leaf" /> Get Started
                </button>
              </div>
            </>
          )}
          {modal.type === "compost" && (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "3rem" }}>🌱</div>
                <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#1B5E20", margin: ".5rem 0" }}>Start Composting at Home</h3>
              </div>
              <div style={{ background: "#E8F5E9", borderRadius: "12px", padding: "1rem", marginBottom: "1rem", fontSize: ".85rem" }}>
                <strong>What to add:</strong> Fruit peels, vegetable scraps, tea leaves, coffee grounds, eggshells, dried leaves,
                cardboard.
                <br />
                <br />
                <strong>What NOT to add:</strong> Meat, dairy, oily food, diseased plants.
              </div>
              <div style={{ fontSize: ".85rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                In 6–8 weeks, your food waste becomes nutrient-rich compost! Use it for your garden or donate to the community
                garden for extra XP. 🌿
              </div>
              <button
                className="btn btn-green"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  closeModal();
                  navigateTo("waste");
                }}
              >
                <i className="fas fa-shop"></i> Buy a compost kit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
