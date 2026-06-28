import React, { useState, useEffect } from "react";
import { Recycle, Gamepad, Truck, Award, ShoppingBag, HelpCircle, ChevronRight, Play, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

interface WasteGamesProps {
  onAddCredits: (amount: number) => void;
  onAddAuditLog: (action: string, details: string, severity: "info" | "warning" | "critical") => void;
  showToastMessage: (icon: string, msg: string) => void;
}

export function WasteGames({ onAddCredits, onAddAuditLog, showToastMessage }: WasteGamesProps) {
  const [activeSubTab, setActiveTab] = useState<"waste" | "games">("waste");

  // Bin Sorter Game state
  const sortItems = [
    { emoji: "🍌", label: "Banana peel", bin: "green" },
    { emoji: "🥤", label: "Plastic bottle", bin: "blue" },
    { emoji: "💊", label: "Medicine packet", bin: "red" },
    { emoji: "📰", label: "Old newspaper", bin: "blue" },
    { emoji: "🥕", label: "Vegetable peel", bin: "green" },
    { emoji: "🔋", label: "Used battery", bin: "red" },
    { emoji: "🍾", label: "Glass bottle", bin: "blue" },
    { emoji: "🍕", label: "Leftover food", bin: "green" },
  ];
  const [sortIdx, setSortIdx] = useState<number>(0);
  const [sortScore, setSortScore] = useState<number>(0);
  const [sortFeedback, setSortFeedback] = useState<string>("");

  // Quiz Game state
  const quizQs = [
    {
      q: "What does the RTI Act guarantee, and when can citizens deploy it?",
      opts: [
        "A document to report road potholes online",
        "Right to Information — used to request official public records within 30 days",
        "A permit for waste disposal and compost units",
        "An application to track maintenance trucks",
      ],
      ans: 1,
      exp: "The Right to Information Act (2005) empowers citizens to request data from public authorities, promoting transparency.",
    },
    {
      q: "Which bin should hazardous items like medical syringes go into?",
      opts: ["Green biodegradable bin", "Blue dry recyclable bin", "Red hazardous waste bin", "Standard office basket"],
      ans: 2,
      exp: "Red bins are reserved for hazardous materials (batteries, chemicals, medical waste) to protect sorting engineers.",
    },
  ];
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFeedback, setQuizFeedback] = useState<string>("");
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // Speed Sort state
  const [speedRunning, setSpeedRunning] = useState<boolean>(false);
  const [speedTimer, setSpeedTimer] = useState<number>(60);
  const [speedScore, setSpeedScore] = useState<number>(0);
  const [speedIdx, setSpeedIdx] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (speedRunning && speedTimer > 0) {
      interval = setInterval(() => {
        setSpeedTimer((prev) => {
          if (prev <= 1) {
            setSpeedRunning(false);
            onAddCredits(speedScore * 2);
            showToastMessage("⚡", `Speed Sort finished! Earned +${speedScore * 2} credits.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [speedRunning, speedTimer, speedScore]);

  const handleSortAnswer = (bin: string) => {
    const cur = sortItems[sortIdx % sortItems.length];
    if (bin === cur.bin) {
      setSortScore((s) => s + 10);
      setSortFeedback("✅ Correct! Gained +10 credits.");
      onAddCredits(10);
    } else {
      setSortFeedback(`❌ Incorrect. The ${cur.label} goes into the ${cur.bin} bin.`);
    }
    setTimeout(() => {
      setSortFeedback("");
      setSortIdx((prev) => prev + 1);
    }, 1800);
  };

  const handleQuizAnswer = (optIdx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optIdx);
    const q = quizQs[quizIdx % quizQs.length];
    if (optIdx === q.ans) {
      setQuizScore((s) => s + 25);
      setQuizFeedback("✅ Correct! Excellent civic literacy.");
      onAddCredits(25);
    } else {
      setQuizFeedback(`❌ Incorrect. The correct answer was option ${String.fromCharCode(65 + q.ans)}.`);
    }
  };

  const nextQuiz = () => {
    setSelectedOpt(null);
    setQuizFeedback("");
    setQuizIdx((prev) => prev + 1);
  };

  const handleSpeedAnswer = (bin: string) => {
    if (!speedRunning) return;
    const cur = sortItems[speedIdx % sortItems.length];
    if (bin === cur.bin) {
      setSpeedScore((s) => s + 1);
    }
    setSpeedIdx((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 bg-[#F9FBF7]">
      {/* Tab Selector */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-200/50 p-1 rounded-full">
          <button
            onClick={() => setActiveTab("waste")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "waste" ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            Smart Waste Hub
          </button>
          <button
            onClick={() => setActiveTab("games")}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === "games" ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            Play & Learn Games
          </button>
        </div>
      </div>

      {activeSubTab === "waste" ? (
        <div className="space-y-12">
          {/* Section 1: 3-Bin Segregation Guide */}
          <div className="space-y-4 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
              <Recycle className="w-3.5 h-3.5 text-emerald-600" />
              <span>3-BIN RECYCLING SYSTEM</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">How to Segregate Like a Champion</h1>
            <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
              Proper segregation prevents resource contamination, allowing local Waste-to-Energy (W2E) networks to process materials with maximum speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Green Bin */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-600" />
              <div className="text-4xl">🟢</div>
              <h3 className="text-lg font-bold text-emerald-950">Green Bin — Biodegradable</h3>
              <p className="text-xs text-emerald-800/60 leading-relaxed font-light">
                For organic materials. Decomposes naturally into valuable organic fertilizer.
              </p>
              <ul className="text-xs text-emerald-950 font-medium space-y-2 pt-2">
                <li>• Food leftovers & fruit skins</li>
                <li>• Garden leaves & tea bags</li>
                <li>• Uncoated raw paper towels</li>
              </ul>
            </div>

            {/* Blue Bin */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
              <div className="text-4xl">🔵</div>
              <h3 className="text-lg font-bold text-emerald-950">Blue Bin — Dry & Recyclable</h3>
              <p className="text-xs text-emerald-800/60 leading-relaxed font-light">
                For clean, dry materials processed by our mechanical sorting networks.
              </p>
              <ul className="text-xs text-emerald-950 font-medium space-y-2 pt-2">
                <li>• Plastic containers & PET bottles</li>
                <li>• Newspapers, cardboard & cartons</li>
                <li>• Clean glass jars & aluminum tins</li>
              </ul>
            </div>

            {/* Red Bin */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-rose-600" />
              <div className="text-4xl">🔴</div>
              <h3 className="text-lg font-bold text-emerald-950">Red Bin — Hazardous & E-Waste</h3>
              <p className="text-xs text-emerald-800/60 leading-relaxed font-light">
                For materials requiring secondary environmental neutralization.
              </p>
              <ul className="text-xs text-emerald-950 font-medium space-y-2 pt-2">
                <li>• Used batteries & lightbulbs</li>
                <li>• Expired medicines & syringes</li>
                <li>• Broken screens & wiring cables</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Live Tracking Simulator & Compost Kit Shop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Live Tracking */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <span>Simulated Waste Vehicle Tracking</span>
              </h2>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/30 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">VEHICLE WV-3</span>
                    <p className="text-xs font-semibold text-emerald-950">Malviya Nagar Route</p>
                    <p className="text-[10px] text-emerald-800/60">Arriving in approx 18 mins</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold animate-pulse">
                    ON ROUTE
                  </span>
                </div>

                <div className="p-4 bg-[#FBFDF9] rounded-2xl border border-emerald-950/5 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">VEHICLE WV-7</span>
                    <p className="text-xs font-semibold text-emerald-950">Pitampura Sector</p>
                    <p className="text-[10px] text-emerald-800/60">Collection completed today at 11:20 AM</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Incentives / Fines block */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/40 text-xs text-amber-900 leading-relaxed font-light space-y-1">
                <strong>💡 Segregation Incentives:</strong> Keeping wet and dry waste isolated earns you <strong>+20 Credits</strong> per daily pickup verified by our on-site sanitation workers. Incorrect sorting causes warning flags.
              </div>
            </div>

            {/* Compost Shop */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <span>Compost & Clean Tech Store</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-emerald-900/5 bg-[#FBFDF9] hover:shadow-sm transition-shadow space-y-3">
                  <div className="text-3xl">🪣</div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Home Compost Bin</h4>
                    <p className="text-[10px] text-emerald-800/60">5L heavy-duty natural composting system.</p>
                  </div>
                  <button
                    onClick={() => {
                      onAddCredits(-300);
                      onAddAuditLog("Redeem Reward", "Redeemed Home Compost Bin for 300 credits.", "info");
                      showToastMessage("🪣", "Compost Bin redeemed successfully! Free delivery active.");
                    }}
                    className="w-full py-2 bg-emerald-850 hover:bg-emerald-950 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Redeem (300 XP)
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-900/5 bg-[#FBFDF9] hover:shadow-sm transition-shadow space-y-3">
                  <div className="text-3xl">🪱</div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Vermi-Compost Kit</h4>
                    <p className="text-[10px] text-emerald-800/60">Organic live worm kits for natural nutrient enrichment.</p>
                  </div>
                  <button
                    onClick={() => {
                      onAddCredits(-400);
                      onAddAuditLog("Redeem Reward", "Redeemed Vermi-Compost Kit for 400 credits.", "info");
                      showToastMessage("🌱", "Vermi-compost kit processed! Code verified.");
                    }}
                    className="w-full py-2 bg-emerald-850 hover:bg-emerald-950 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    Redeem (400 XP)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Bin Sorter interactive mini-game */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <Gamepad className="w-5 h-5 text-emerald-700" />
                  <span>Mini Game: Bin Sorter</span>
                </h2>
                <p className="text-xs text-emerald-800/50 mt-1">
                  Sort the item correctly to earn XP and train our categorization AI.
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                Score: {sortScore} XP
              </span>
            </div>

            <div className="p-8 bg-[#FBFDF9] rounded-2xl border border-emerald-900/5 text-center space-y-4">
              <div className="text-6xl animate-bounce-short">
                {sortItems[sortIdx % sortItems.length].emoji}
              </div>
              <h3 className="text-md font-extrabold text-emerald-950">
                {sortItems[sortIdx % sortItems.length].label}
              </h3>
            </div>

            {sortFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center rounded-xl font-medium animate-pulse">
                {sortFeedback}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSortAnswer("green")}
                className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-200/50 cursor-pointer"
              >
                Biodeg 🟢
              </button>
              <button
                onClick={() => handleSortAnswer("blue")}
                className="py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-blue-200/50 cursor-pointer"
              >
                Recycle 🔵
              </button>
              <button
                onClick={() => handleSortAnswer("red")}
                className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-rose-200/50 cursor-pointer"
              >
                Hazardous 🔴
              </button>
            </div>
          </div>

          {/* Civic Quiz Game */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-700" />
                  <span>Civic Knowledge Quiz</span>
                </h2>
                <p className="text-xs text-emerald-800/50 mt-1">
                  Validate your knowledge on RTI and public administration.
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                Score: {quizScore} XP
              </span>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold text-emerald-950 leading-relaxed bg-[#FBFDF9] p-4 rounded-2xl border border-emerald-900/5">
                {quizQs[quizIdx % quizQs.length].q}
              </div>

              <div className="space-y-2">
                {quizQs[quizIdx % quizQs.length].opts.map((opt, i) => (
                  <button
                    key={i}
                    disabled={selectedOpt !== null}
                    onClick={() => handleQuizAnswer(i)}
                    className={`w-full text-left p-3.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedOpt === i
                        ? i === quizQs[quizIdx % quizQs.length].ans
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-rose-50 border-rose-500 text-rose-800"
                        : selectedOpt !== null && i === quizQs[quizIdx % quizQs.length].ans
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200/50"
                    }`}
                  >
                    <span className="font-extrabold mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>

              {quizFeedback && (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl leading-relaxed">
                    {quizFeedback}
                  </div>
                  <p className="text-[10px] text-emerald-800/60 leading-normal italic font-light">
                    💡 Explanation: {quizQs[quizIdx % quizQs.length].exp}
                  </p>
                  <button
                    onClick={nextQuiz}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-bold text-xs cursor-pointer transition-colors"
                  >
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Speed Sort 60 seconds game */}
          <div className="lg:col-span-12 bg-[#1D3B1F] text-emerald-50 p-6 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Play className="w-5 h-5 text-emerald-400" />
                  <span>⚡ Speed Sort — 60 Seconds Match</span>
                </h3>
                <p className="text-xs text-emerald-300 font-light mt-1">
                  Speed-sort as many items as you can. Every correct match earns +2 Credits.
                </p>
              </div>

              <div className="flex gap-4">
                <span className="text-xs bg-emerald-800 text-white font-mono px-3 py-1 rounded-full">
                  Time: {speedTimer}s
                </span>
                <span className="text-xs bg-amber-500 text-emerald-950 font-bold px-3 py-1 rounded-full">
                  Sorted: {speedScore}
                </span>
              </div>
            </div>

            {!speedRunning ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-xs text-emerald-300 max-w-md mx-auto leading-relaxed font-light">
                  Ready to test your instincts under pressure? Press Start to initialize the clock.
                </p>
                <button
                  onClick={() => {
                    setSpeedRunning(true);
                    setSpeedTimer(60);
                    setSpeedScore(0);
                    setSpeedIdx(0);
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold text-xs rounded-full cursor-pointer transition-colors"
                >
                  Start clock
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-6 max-w-sm mx-auto">
                <div className="space-y-2">
                  <div className="text-6xl animate-bounce-short">
                    {sortItems[speedIdx % sortItems.length].emoji}
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {sortItems[speedIdx % sortItems.length].label}
                  </h4>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleSpeedAnswer("green")}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Biodeg
                  </button>
                  <button
                    onClick={() => handleSpeedAnswer("blue")}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 border border-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Recyclable
                  </button>
                  <button
                    onClick={() => handleSpeedAnswer("red")}
                    className="px-4 py-2 bg-rose-800 hover:bg-rose-900 border border-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Hazardous
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
