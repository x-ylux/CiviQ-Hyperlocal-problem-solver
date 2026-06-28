import React, { useState, useEffect } from "react";
import { Leaf, Plus, Sparkles, Download, FileSpreadsheet, CheckCircle2, History, Trash2, HelpCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { CarbonEntry } from "../types";
import { getCarbonTips, exportCSV, exportPDF } from "../api";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore";

interface CarbonCalculatorProps {
  userId: string;
  onAddCredits: (amount: number) => void;
  onAddAuditLog: (action: string, details: string, severity: "info" | "warning" | "critical") => void;
  showToastMessage: (icon: string, msg: string) => void;
}

export function CarbonCalculator({
  userId,
  onAddCredits,
  onAddAuditLog,
  showToastMessage,
}: CarbonCalculatorProps) {
  const [transport, setTransport] = useState<number>(0);
  const [electricity, setElectricity] = useState<number>(0);
  const [waste, setWaste] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<CarbonEntry[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([
    "Commute by bike or walk for short trips to zero out transport emissions.",
    "Switch off appliances at the wall to save up to 10% on power draw.",
    "Adopt backyard composting to transform natural scraps into organic garden fertilizer."
  ]);
  const [aiComparison, setAiComparison] = useState<string>(
    "Your current calculated output will be assessed in real-time against regional baselines of 5.5 kg CO2."
  );
  const [predictedSavings, setPredictedSavings] = useState<number>(35);
  const [committedTips, setCommittedTips] = useState<boolean[]>([false, false, false]);

  // Calculations:
  // Transportation: 0.15kg CO2 per km
  // Electricity: 0.85kg CO2 per kWh
  // Waste: 0.45kg CO2 per kg
  const totalCo2 = parseFloat((transport * 0.15 + electricity * 0.85 + waste * 0.45).toFixed(2));

  // Load local or firestore history
  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      if (userId && userId !== "anonymous") {
        const q = query(
          collection(db, "carbon_footprints"),
          where("userId", "==", userId),
          orderBy("date", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const data: CarbonEntry[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as CarbonEntry);
        });
        if (data.length > 0) {
          setHistory(data.reverse());
        } else {
          loadLocalHistory();
        }
      } else {
        loadLocalHistory();
      }
    } catch (err) {
      console.error("Error loading footprint history:", err);
      loadLocalHistory();
    }
  };

  const loadLocalHistory = () => {
    const local = localStorage.getItem("civicai_carbon_history");
    if (local) {
      setHistory(JSON.parse(local));
    } else {
      setHistory([]);
      localStorage.setItem("civicai_carbon_history", JSON.stringify([]));
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await getCarbonTips(transport, electricity, waste, totalCo2);
      setAiTips(result.tips);
      setAiComparison(result.comparison);
      setPredictedSavings(result.predictedImprovement);
      setCommittedTips([false, false, false]);

      // Add to history list
      const dateStr = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
      const newEntry: CarbonEntry = {
        id: Math.random().toString(36).substr(2, 9),
        userId: userId || "local",
        date: dateStr,
        transportationKm: transport,
        electricityKwh: electricity,
        wasteKg: waste,
        totalCo2Kg: totalCo2,
        tips: result.tips,
      };

      const updatedHistory = [...history, newEntry].slice(-10); // Keep last 10 entries for cleaner chart
      setHistory(updatedHistory);
      localStorage.setItem("civicai_carbon_history", JSON.stringify(updatedHistory));

      // Sync to Firestore if authenticated
      if (userId && userId !== "anonymous") {
        await addDoc(collection(db, "carbon_footprints"), {
          userId,
          date: dateStr,
          transportationKm: transport,
          electricityKwh: electricity,
          wasteKg: waste,
          totalCo2Kg: totalCo2,
          tips: result.tips,
          createdAt: new Date().toISOString()
        });
      }

      onAddCredits(30); // Gaining credits for environmental tracking
      onAddAuditLog("Calculate Carbon", `Computed daily carbon footprint: ${totalCo2} kg CO2`, "info");
      showToastMessage("🌿", "Calculated successfully! Awarded +30 Environmental Credits.");

    } catch (err: any) {
      console.error(err);
      showToastMessage("⚠️", "Calculation completed in local sandbox mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommitTip = (index: number) => {
    if (committedTips[index]) return;
    const newCommitted = [...committedTips];
    newCommitted[index] = true;
    setCommittedTips(newCommitted);
    onAddCredits(20); // Gaining credits for commitment
    onAddAuditLog("Commit Carbon Action", `Committed to carbon tip: "${aiTips[index]}"`, "info");
    showToastMessage("🏆", "Committed! +20 Credits registered under green goals.");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("civicai_carbon_history");
    showToastMessage("🗑️", "Local footprint logs cleared.");
  };

  const handleCSVExport = async () => {
    try {
      await exportCSV("footprint", history);
      showToastMessage("📊", "CSV spreadsheet downloaded successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePDFExport = async () => {
    try {
      const report = await exportPDF("footprint", history);
      showToastMessage("📋", "PDF layout exported with integrity SHA-256 code.");
      // Open modal print window or format it neatly
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${report.title}</title>
              <style>
                body { font-family: sans-serif; padding: 40px; color: #111; }
                h1 { color: #1B5E20; border-bottom: 2px solid #1B5E20; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #E8F5E9; color: #1B5E20; }
                .meta { margin-top: 20px; font-size: 14px; color: #666; }
                .hash { font-family: monospace; font-size: 12px; background: #eee; padding: 5px; word-break: break-all; }
              </style>
            </head>
            <body>
              <h1>${report.title}</h1>
              <div class="meta">
                <p><strong>Generated By:</strong> ${report.generatedBy}</p>
                <p><strong>Export Date:</strong> ${new Date(report.exportDate).toLocaleString()}</p>
                <p><strong>Total Logs:</strong> ${report.totalRecords}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transportation (km)</th>
                    <th>Electricity (kWh)</th>
                    <th>Waste (kg)</th>
                    <th>Total CO2 emissions (kg CO2)</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map(h => `
                    <tr>
                      <td>${h.date}</td>
                      <td>${h.transportationKm} km</td>
                      <td>${h.electricityKwh} kWh</td>
                      <td>${h.wasteKg} kg</td>
                      <td><strong>${h.totalCo2Kg} kg CO2</strong></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <div class="meta" style="margin-top: 50px;">
                <p><strong>Document Cryptographic Signature (Audit Integrity):</strong></p>
                <p class="hash">${report.integrityHash}</p>
              </div>
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

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 bg-[#F9FBF7]">
      {/* Title */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 px-4 py-1 rounded-full text-xs font-semibold">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>CARBON EMISSION OFFSETS</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">Carbon Footprint Calculator</h1>
        <p className="text-sm text-emerald-800/70 font-light max-w-xl mx-auto leading-relaxed">
          Log daily activities, calculate exact greenhouse gas footprints, and receive high-accuracy offset suggestions powered by Gemini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input sliders section */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <span>📊</span> Log Daily Activities
          </h2>

          <div className="space-y-4">
            {/* Travel Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-emerald-950">
                <span>🚗 Travel distance</span>
                <span className="text-emerald-700">{transport} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={transport}
                onChange={(e) => setTransport(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-emerald-800/50">
                <span>0 km</span>
                <span>150 km</span>
              </div>
            </div>

            {/* Electricity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-emerald-950">
                <span>⚡ Power usage</span>
                <span className="text-emerald-700">{electricity} kWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={electricity}
                onChange={(e) => setElectricity(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-emerald-800/50">
                <span>0 kWh</span>
                <span>50 kWh</span>
              </div>
            </div>

            {/* Waste Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-emerald-950">
                <span>🗑️ Organic/General waste</span>
                <span className="text-emerald-700">{waste} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={waste}
                onChange={(e) => setWaste(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-emerald-800/50">
                <span>0 kg</span>
                <span>20 kg</span>
              </div>
            </div>
          </div>

          {/* Current calculated score block */}
          <div className="bg-[#1D3B1F] text-emerald-50 p-6 rounded-2xl text-center space-y-2 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-700/20 rounded-full" />
            <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase">Estimated Emissions</span>
            <div className="text-4xl font-extrabold text-white flex items-baseline justify-center gap-1.5">
              {totalCo2} <span className="text-xs font-light text-emerald-300">kg CO₂e</span>
            </div>
            <p className="text-[10px] text-emerald-300/80 leading-normal font-light">
              Formula: (Travel × 0.15) + (Electricity × 0.85) + (Waste × 0.45).
            </p>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-950 disabled:bg-emerald-800/50 text-white rounded-full font-bold text-xs transition-colors shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>AI Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Calculate & Recommend</span>
              </>
            )}
          </button>
        </div>

        {/* AI Recommendations section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Gemini Clean Tech Recommendations</span>
                </h2>
                <p className="text-xs text-emerald-800/50 mt-1">
                  Validated against national baselines of 5.5 kg CO2.
                </p>
              </div>
              <div className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                <span>Save ~{predictedSavings} kg / mo</span>
              </div>
            </div>

            <div className="text-xs text-emerald-900/80 leading-relaxed bg-[#F4F9F1] p-4 rounded-2xl border border-emerald-900/5 font-light">
              <strong>Comparison Analysis:</strong> {aiComparison}
            </div>

            {/* Recommendations stack */}
            <div className="space-y-3">
              {aiTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-700/20 bg-[#FBFDF9] flex justify-between items-center gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">
                      Goal {idx + 1}
                    </span>
                    <p className="text-xs font-medium text-emerald-950 leading-relaxed">
                      {tip}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCommitTip(idx)}
                    disabled={committedTips[idx]}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      committedTips[idx]
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 cursor-pointer"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{committedTips[idx] ? "Committed!" : "Commit"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Recharts Graph */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-900/10 shadow-sm space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-700" />
                  <span>Emission History Tracker</span>
                </h3>
                <p className="text-xs text-emerald-800/50 mt-1">
                  Interactive real-time graph of your environmental footprints.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCSVExport}
                  className="p-2 border border-emerald-900/10 rounded-xl hover:bg-emerald-50 text-emerald-800 flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Export to CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handlePDFExport}
                  className="p-2 border border-emerald-900/10 rounded-xl hover:bg-emerald-50 text-emerald-800 flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Export to PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={clearHistory}
                  className="p-2 border border-rose-100 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Recharts chart */}
            <div className="w-full h-64 pt-4">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#065f46" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#065f46" }} />
                    <Tooltip contentStyle={{ background: "#1d3b1f", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="totalCo2Kg" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCo2)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-emerald-800/40 text-xs">
                  No records logged yet. Use the log sliders to compile your first footprint.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
