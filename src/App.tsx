import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, query, where, getDocs } from "firebase/firestore";
import confetti from "canvas-confetti";
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
import { CiviQAuthorityDashboard } from "./components/CiviQAuthorityDashboard";
import CiviQAIShowcase from "./components/CiviQAIShowcase";

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
    q: "What does the SLA Breach mean in CiviQ?",
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
    ans: 2,
    exp: "Reduce (produce less waste), Reuse (use items again), Recycle (process waste into new materials). Follow this order — reduction is always best!",
  },
];

// Offline chatbot dictionary
const aiReplies: Record<string, string> = {
  report:
    "To report an issue: tap the Report tab, upload a photo, select category, confirm GPS location, and submit. You earn +50–150 XP per report. Our AI will verify the image and check for nearby duplicates! 📷",
  rti:
    "The RTI (Right to Information) Act lets you request information from any government body within 30 days. On CiviQ, if your issue is ignored past the SLA deadline, tap 'Generate RTI' on the ticket page and we auto-draft it for you! ⚖️",
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
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem("civiq_active_user") ? "home" : "login");
  
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("civiq_theme", "light");
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const activeSandboxJson = localStorage.getItem("civiq_active_user");
    if (activeSandboxJson) {
      try {
        return JSON.parse(activeSandboxJson) as UserProfile;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

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
      text: "👋 Hi! I'm your CiviQ assistant. I can help you report issues, generate RTIs, find recycling centers, or answer civic questions!",
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
  const [modal, setModal] = useState<{ open: boolean; type: "rti" | "compost" | "" }>({
    open: false,
    type: "",
  });

  // Dynamic Firestore Issues Sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "issues"), (snapshot) => {
      const fbIssues: CivicIssue[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fbIssues.push({
          id: doc.id,
          title: data.title || "Reported Incident",
          category: data.category || "Roads",
          address: data.address || "",
          lat: data.lat || 28.6648,
          lng: data.lng || 77.1167,
          daysOpen: data.daysOpen || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          slaDays: data.slaDays || 7,
          upvotes: data.upvotes || 1,
          status: data.status || "Open",
          severity: data.severity || "Medium",
          verifiedCount: data.verifiedCount || 0,
          budget: data.budget || "₹45,000 (Allocating)",
          contractorName: data.contractorName || "GreenBuild Pvt Ltd",
          contractorRating: data.contractorRating || 94,
          populationDensity: data.populationDensity || 15000,
          weatherForecast: data.weatherForecast || "Slight Overcast",
          assignedOfficer: data.assignedOfficer || "Zone Supervisor",
          image: data.image || data.photoURL || "",
          voiceTranscription: data.voiceTranscription || "",
        } as CivicIssue);
      });

      // Default hardcoded issues
      const defaultIssues: CivicIssue[] = [
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
      ];

      // Combine Firestore issues first (newest reports appear first) with the default ones
      const combined = [...fbIssues];
      defaultIssues.forEach((def) => {
        if (!combined.some((x) => x.id === def.id)) {
          combined.push(def);
        }
      });

      setIssues(combined);
    }, (err) => {
      console.warn("Firestore issues listener failed gracefully:", err);
    });

    return () => unsub();
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
          let userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            // Wait 1.5 seconds to avoid race condition with officer or citizen custom registration write
            await new Promise((resolve) => setTimeout(resolve, 1500));
            userDoc = await getDoc(doc(db, "users", user.uid));
          }

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
              localStorage.setItem("civiq_active_user", JSON.stringify(data));
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
            localStorage.setItem("civiq_active_user", JSON.stringify(newProfile));
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
          localStorage.setItem("civiq_active_user", JSON.stringify(offlineProfile));
          loadLocalProfile();
        }
      } else {
        const activeSandboxJson = localStorage.getItem("civiq_active_user");
        if (activeSandboxJson) {
          try {
            const sandboxProfile = JSON.parse(activeSandboxJson);
            setUserProfile(sandboxProfile);
            setCredits(sandboxProfile.credits || 0);
          } catch (e) {
            setUserProfile(null);
            setCredits(0);
          }
        } else {
          setUserProfile(null);
          setCredits(0);
        }
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

    // Confetti gamification for rewards, XP, etc.
    const confettiTriggers = ["🎉", "🎁", "🔥", "⭐", "🪣", "🎓", "🌱", "♻️", "✅", "⚡", "🎯"];
    
    // Check for negative outcomes
    const isError = ["❌", "⚠️", "error", "insufficient", "failed"].some(str => 
      icon === str || message.toLowerCase().includes(str)
    );

    if (!isError) {
      if (
        confettiTriggers.includes(icon) ||
        message.toLowerCase().includes("earned") ||
        message.toLowerCase().includes("xp") ||
        message.toLowerCase().includes("credit")
      ) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6', '#8b5cf6'],
          disableForReducedMotion: true
        });
      }
    }
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
  const handleReportSubmit = async (reportData: {
    title: string;
    category: string;
    severity: string;
    description: string;
    address: string;
    image?: string;
    voiceTranscription?: string;
    lat?: number;
    lng?: number;
  }) => {
    const newId = (1000 + Math.floor(Math.random() * 9000)).toString();

    // Determine issue's ward
    const formatWard = (w: string) => {
      if (!w) return "Ward 7";
      const cleaned = w.trim();
      if (cleaned.toLowerCase().startsWith("ward ")) return cleaned;
      return `Ward ${cleaned}`;
    };
    const issueWard = formatWard(userProfile?.ward || onboarding?.ward || "Ward 7");
    const issueCategory = reportData.category || "Roads";

    // Matching department helper
    const isCategoryDeptMatch = (cat: string, dept: string) => {
      if (!cat || !dept) return false;
      const c = cat.toLowerCase();
      const d = dept.toLowerCase();
      if (c === d) return true;
      if (c.includes(d) || d.includes(c)) return true;
      if (c === "waste" && d.includes("sanitation")) return true;
      if (c === "sanitation" && d.includes("waste")) return true;
      if (c === "roads" && d.includes("infrastructure")) return true;
      return false;
    };

    let assignedTo: any = null;
    let assignmentNote = "No matching active authority found for this ward and department. Marked as Unassigned.";

    try {
      // Query active authorities in the users collection
      const authoritiesQuery = query(
        collection(db, "users"),
        where("role", "==", "authority")
      );
      const authSnap = await getDocs(authoritiesQuery);
      const activeAuthorities = authSnap.docs
        .map(d => ({ uid: d.id, ...d.data() } as any))
        .filter(u => u.status === "active");

      const matchingAuthorities = activeAuthorities.filter(u => {
        const uWardNorm = formatWard(u.ward);
        const issueWardNorm = formatWard(issueWard);
        return uWardNorm === issueWardNorm && isCategoryDeptMatch(issueCategory, u.department);
      });

      if (matchingAuthorities.length > 0) {
        // Load balancing: find current open issues count for each matching officer
        const officersWithCounts = await Promise.all(
          matchingAuthorities.map(async (officer) => {
            const openIssuesQuery = query(
              collection(db, "issues"),
              where("assignedTo.uid", "==", officer.uid),
              where("status", "in", ["Open", "In progress", "Acknowledged", "Contractor Assigned", "Work In Progress"])
            );
            const openIssuesSnap = await getDocs(openIssuesQuery);
            return {
              officer,
              openCount: openIssuesSnap.size
            };
          })
        );

        // Sort by openCount ascending
        officersWithCounts.sort((a, b) => a.openCount - b.openCount);
        const bestOfficer = officersWithCounts[0].officer;

        assignedTo = {
          uid: bestOfficer.uid,
          name: bestOfficer.displayName,
          designation: bestOfficer.designation,
          department: bestOfficer.department,
          ward: bestOfficer.ward
        };
        assignmentNote = `Auto-assigned to ${bestOfficer.displayName}, ${bestOfficer.designation}`;
      }
    } catch (err) {
      console.error("Auto-assignment query failed:", err);
    }

    // Prepare issue data for Firestore
    const issueToSave = {
      title: reportData.title || "Reported Incident",
      category: reportData.category || "Roads",
      address: reportData.address || "Rajouri Garden, Sector 5",
      lat: reportData.lat || 28.6648,
      lng: reportData.lng || 77.1167,
      daysOpen: 0,
      createdAt: new Date().toISOString(),
      slaDays: reportData.severity === "Critical" ? 3 : reportData.severity === "High" ? 5 : 7,
      upvotes: 1,
      status: "Open",
      severity: reportData.severity || "Medium",
      verifiedCount: 0,
      budget: "₹45,000 (Allocating)",
      contractorName: "GreenBuild Pvt Ltd",
      contractorRating: 94,
      populationDensity: 15000,
      weatherForecast: "Slight Overcast",
      assignedOfficer: assignedTo ? assignedTo.name : "Unassigned",
      assignedTo: assignedTo,
      ward: issueWard,
      image: reportData.image || "",
      photoURL: reportData.image || "",
      reporterUID: auth.currentUser?.uid || "anonymous",
      reporterName: userProfile?.displayName || "Anonymous Citizen",
      voiceTranscription: reportData.voiceTranscription || "",
    };

    try {
      // Save directly to Firestore
      const docRef = await addDoc(collection(db, "issues"), issueToSave);
      const createdIssueId = docRef.id;
      setSelectedIssueId(createdIssueId);
      console.log("Document successfully written to Firestore with ID:", createdIssueId);

      // Write status history entry
      const historyRef = doc(collection(db, `issues/${createdIssueId}/statusHistory`));
      await setDoc(historyRef, {
        status: "Open",
        note: assignmentNote,
        changedBy: "CiviQ AI Dispatcher",
        timestamp: new Date().toISOString()
      });

      // Write to authorities/{uid}/assignedIssues subcollection if assigned
      if (assignedTo) {
        await setDoc(doc(db, `authorities/${assignedTo.uid}/assignedIssues`, createdIssueId), {
          issueId: createdIssueId,
          title: issueToSave.title,
          category: issueToSave.category,
          status: "Open",
          assignedAt: new Date().toISOString()
        });

        // Write a notification to notifications/{uid}/items
        const notifRef = doc(collection(db, `notifications/${assignedTo.uid}/items`));
        await setDoc(notifRef, {
          type: "new_assignment",
          issueId: createdIssueId,
          issueTitle: issueToSave.title,
          issueCategory: issueToSave.category,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      // Also update local fallback for instant local navigation
      const newIssue: CivicIssue = {
        id: createdIssueId,
        ...issueToSave,
        severity: issueToSave.severity as any,
        status: "Open",
        image: reportData.image,
      };
      setIssues((prev) => [newIssue, ...prev]);

      // Save coords for the map to zoom in on
      localStorage.setItem(
        "civiq_submitted_issue_coords",
        JSON.stringify({ lat: reportData.lat || 28.6648, lng: reportData.lng || 77.1167, id: createdIssueId })
      );

      setActiveTab("map");
      setReportStep(1); // Reset for next time
      handleUpdateCredits(credits + 150);
      triggerToast("⭐", "Report submitted! AI Dispatcher completed auto-routing! +150 XP");

    } catch (error) {
      console.error("Error saving reported issue to Firestore:", error);
    }
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
    setActiveTab("dashboard");
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

  const sendChatMessage = async (text: string) => {
    setChatMessages((prev) => [...prev, { text, role: "user" }]);
    setChatInput("");
    setTyping(true);

    try {
      // Map existing messages to the expected backend format
      const history = chatMessages.map((msg) => ({
        role: msg.role === "bot" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      setChatMessages((prev) => [...prev, { text: data.text, role: "bot" }]);
    } catch (error) {
      console.error("Failed to send chat message:", error);
      // Fallback
      setChatMessages((prev) => [
        ...prev,
        { text: "Sorry, I'm having trouble connecting to the network right now. Please try again later.", role: "bot" },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const getBackgroundImage = (tab: string) => {
    switch(tab) {
      case "home": return "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2500')"; // Forest glow
      case "dashboard": return "url('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=2500')"; // Sun rays in forest
      case "report": return "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2500')"; // Deep nature
      case "map": return "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2500')"; // Mountains
      case "track": return "url('https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=2500')"; // Nature path
      case "campaigns": return "url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2500')"; // Earth globe leaf
      case "games": return "url('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=2500')"; // Sunset field
      case "waste": return "url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=2500')"; // Green moss
      case "carbon": return "url('https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=2500')"; // Clean water / ice
      case "gamify": return "url('https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=2500')"; // Nature textures
      case "insights": return "url('https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&q=80&w=2500')"; // Mountain view
      case "ai_showcase": return "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2500')"; // Abstract organic green
      default: return "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2500')";
    }
  };

  return (
    <div className="min-h-screen relative text-[#0F172A] antialiased transition-colors duration-300 flex flex-col font-sans overflow-hidden">
      {/* Dynamic Realistic Nature Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform scale-105" 
        style={{
          backgroundImage: getBackgroundImage(activeTab),
          filter: 'brightness(1.1) saturate(1.4)'
        }}
      />
      <div className="fixed inset-0 z-0 bg-white/40 backdrop-blur-md pointer-events-none transition-all duration-700"></div>

      {/* Premium glowing ambient backdrops */}
      <div className="absolute top-[5%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] rounded-full filter blur-[120px] bg-emerald-400/50 pointer-events-none z-0 mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] max-w-[800px] rounded-full filter blur-[120px] bg-sky-400/40 pointer-events-none z-0 mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] max-w-[600px] rounded-full filter blur-[100px] bg-amber-300/40 pointer-events-none z-0 mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }}></div>

      {/* Falling Leaves Background container */}
      <div className="leaves-container fixed inset-0 z-0 pointer-events-none" id="leavesContainer"></div>

      {/* Navbar with Glassmorphism */}
      <nav className="nav relative z-50" id="navbar">
        <a
          className="nav-logo hover:scale-105 transition-transform"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("home");
          }}
        >
          <div className="nav-logo-icon shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-gradient-to-br from-emerald-400 to-emerald-600">
            <i className="fas fa-leaf text-white"></i>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-800 font-bold">CiviQ</span>
        </a>
        <div className="nav-links">
          {userProfile?.role === "authority" ? (
            <>
              <button className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                Official Dashboard
              </button>
            </>
          ) : (
            <>
              <button className={`nav-link ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>
                Home
              </button>
              <button className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                Dashboard
              </button>
              <button className={`nav-link ${activeTab === "report" ? "active" : ""}`} onClick={() => setActiveTab("report")}>
                Report
              </button>
              <button className={`nav-link ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")}>
                Map
              </button>
              <button className={`nav-link ${activeTab === "track" ? "active" : ""}`} onClick={() => setActiveTab("track")}>
                Track
              </button>
              <button className={`nav-link ${activeTab === "campaigns" ? "active" : ""}`} onClick={() => setActiveTab("campaigns")}>
                Campaigns
              </button>
              <button className={`nav-link ${activeTab === "games" ? "active" : ""}`} onClick={() => setActiveTab("games")}>
                Games
              </button>
              <button className={`nav-link ${activeTab === "waste" ? "active" : ""}`} onClick={() => setActiveTab("waste")}>
                Waste Hub
              </button>
              <button className={`nav-link ${activeTab === "carbon" ? "active" : ""}`} onClick={() => setActiveTab("carbon")}>
                Carbon Tracker
              </button>
              <button className={`nav-link ${activeTab === "gamify" ? "active" : ""}`} onClick={() => setActiveTab("gamify")}>
                Credits
              </button>
              <button className={`nav-link ${activeTab === "insights" ? "active" : ""}`} onClick={() => setActiveTab("insights")}>
                AI Insights
              </button>
              <button className={`nav-link ${activeTab === "ai_showcase" ? "active" : ""}`} onClick={() => setActiveTab("ai_showcase")}>
                AI Demo
              </button>
              {!isUserLoggedIn && (
                <button className={`nav-link ${activeTab === "login" ? "active" : ""}`} onClick={() => setActiveTab("login")}>
                  Login
                </button>
              )}
            </>
          )}
        </div>
        <div className="nav-right">
          {isUserLoggedIn && userProfile?.role !== "authority" && (
            <div className="xp-badge">
              <i className="fas fa-star"></i> {credits.toLocaleString()} XP
            </div>
          )}
          {userProfile?.role !== "authority" && (
            <button className="nav-btn" onClick={() => setActiveTab("report")}>
              <i className="fas fa-plus"></i> Report
            </button>
          )}
          {isUserLoggedIn ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                className="nav-avatar"
                title={userProfile?.displayName || userProfile?.email}
                onClick={() => setActiveTab("login")}
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
                    setUserProfile(null);
                    setCredits(0);
                    await signOut(auth);
                    triggerToast("🔓", "Logged out successfully!");
                    setActiveTab("login");
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
                onClick={() => setActiveTab("login")}
              >
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
              <div className="nav-avatar" title="Guest Citizen" onClick={() => setActiveTab("login")}>
                GC
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main page view containers */}
      <main className="main max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10 w-full flex-grow flex flex-col" style={{ paddingBottom: "80px" }}>
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQHome
                onNavigate={setActiveTab}
                onboarding={onboarding}
                setOnboarding={setOnboarding}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div key="dashboard" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              {userProfile?.role === "authority" ? (
                <CiviQAuthorityDashboard triggerToast={triggerToast} userProfile={userProfile} />
              ) : (
                <CiviQDashboard onNavigate={setActiveTab} openModal={openModal} triggerToast={triggerToast} />
              )}
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div key="report" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQReport
                onNavigate={setActiveTab}
                reportStep={reportStep}
                setReportStep={setReportStep}
                selectedCat={selectedCat}
                setSelectedCat={setSelectedCat}
                onReportSubmit={handleReportSubmit}
                onResetReport={resetReport}
                openModal={openModal}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div key="map" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQMap triggerToast={triggerToast} />
            </motion.div>
          )}

          {activeTab === "track" && (
            <motion.div key="track" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQTrack
                issues={issues}
                selectedIssueId={selectedIssueId}
                setSelectedIssueId={setSelectedIssueId}
                openModal={openModal}
                triggerToast={triggerToast}
                onUpvoteIssue={handleUpvoteIssue}
              />
            </motion.div>
          )}

          {activeTab === "campaigns" && (
            <motion.div key="campaigns" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQCampaigns
                campaignFilter={campaignFilter}
                setCampaignFilter={setCampaignFilter}
                joinedCampaigns={joinedCampaigns}
                onJoinCampaign={handleJoinCampaign}
              />
            </motion.div>
          )}

          {activeTab === "games" && (
            <motion.div key="games" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
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
            </motion.div>
          )}

          {activeTab === "waste" && (
            <motion.div key="waste" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQWasteHub
                onNavigate={setActiveTab}
                openModal={openModal}
                triggerToast={triggerToast}
                onBuyCompostItem={buyCompostItem}
              />
            </motion.div>
          )}

          {activeTab === "carbon" && (
            <motion.div key="carbon" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQCarbonTracker
                credits={credits}
                handleUpdateCredits={handleUpdateCredits}
                triggerToast={triggerToast}
              />
            </motion.div>
          )}

          {activeTab === "gamify" && (
            <motion.div key="gamify" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQCredits
                credits={credits}
                userProfile={userProfile}
                onNavigate={setActiveTab}
                triggerToast={triggerToast}
                onRedeemReward={redeemReward}
                onStartCivicLearning={startCivicLearning}
                setGameTab={setGameTab}
              />
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div key="insights" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQInsights triggerToast={triggerToast} />
            </motion.div>
          )}

          {activeTab === "ai_showcase" && (
            <motion.div key="ai_showcase" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQAIShowcase />
            </motion.div>
          )}

          {activeTab === "login" && (
            <motion.div key="login" className="flex-grow flex flex-col" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CiviQLogin
                onNavigate={setActiveTab}
                triggerToast={triggerToast}
                onLoginSuccess={(role) => {
                  const activeUserJson = localStorage.getItem("civiq_active_user");
                  if (activeUserJson) {
                    try {
                      const p = JSON.parse(activeUserJson);
                      setUserProfile(p);
                      if (typeof p.credits === "number") {
                        setCredits(p.credits);
                      }
                      if (p.role === "authority") {
                        setActiveTab("dashboard");
                      } else {
                        setActiveTab("home");
                      }
                    } catch (e) {
                      console.error("Error loading user profile on login success:", e);
                    }
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Smart AI Chatbot assistant with standard or keyword responses */}
      <div className="ai-orb">
        <div className={`ai-chat ${chatOpen ? "open" : ""}`} id="aiChat">
          <div className="ai-chat-header">
            <div className="ai-chat-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <div className="ai-chat-name">CiviQ Assistant</div>
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
        <button className="ai-orb-btn" onClick={() => setChatOpen(!chatOpen)} title="Chat with CiviQ">
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
                  setActiveTab("waste");
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
