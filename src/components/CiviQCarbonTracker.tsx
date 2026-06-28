import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface CiviQCarbonTrackerProps {
  credits: number;
  handleUpdateCredits: (val: number) => void;
  triggerToast: (icon: string, message: string) => void;
}

interface CarbonLog {
  id: string;
  date: string;
  transportKm: number;
  transportType: string;
  electricityKwh: number;
  wasteKg: number;
  dietType: "heavy-meat" | "avg-meat" | "vegetarian" | "vegan";
  composted: boolean;
  recycled: boolean;
  totalCo2Kg: number;
}

export function CiviQCarbonTracker({
  credits,
  handleUpdateCredits,
  triggerToast,
}: CiviQCarbonTrackerProps) {
  // Calculator inputs
  const [transportKm, setTransportKm] = useState<number>(15);
  const [transportType, setTransportType] = useState<string>("petrol-car");
  const [electricityKwh, setElectricityKwh] = useState<number>(8);
  const [wasteKg, setWasteKg] = useState<number>(2);
  const [dietType, setDietType] = useState<"heavy-meat" | "avg-meat" | "vegetarian" | "vegan">("avg-meat");
  const [composted, setComposted] = useState<boolean>(false);
  const [recycled, setRecycled] = useState<boolean>(false);

  // Offset goals (Interactive Tips)
  const [offsetChecked, setOffsetChecked] = useState<Record<string, boolean>>({
    walk: false,
    appliances: false,
    diet: false,
    compost: false,
    dryer: false,
    acTemp: false,
    seedling: false,
  });

  // Logs History
  const [logs, setLogs] = useState<CarbonLog[]>([
    {
      id: "log-1",
      date: "Jun 21",
      transportKm: 25,
      transportType: "petrol-car",
      electricityKwh: 12,
      wasteKg: 3,
      dietType: "heavy-meat",
      composted: false,
      recycled: false,
      totalCo2Kg: 18.2,
    },
    {
      id: "log-2",
      date: "Jun 22",
      transportKm: 18,
      transportType: "petrol-car",
      electricityKwh: 10,
      wasteKg: 2.5,
      dietType: "avg-meat",
      composted: false,
      recycled: true,
      totalCo2Kg: 13.5,
    },
    {
      id: "log-3",
      date: "Jun 23",
      transportKm: 4,
      transportType: "public-transit",
      electricityKwh: 7,
      wasteKg: 1.2,
      dietType: "vegetarian",
      composted: true,
      recycled: true,
      totalCo2Kg: 6.8,
    },
    {
      id: "log-4",
      date: "Jun 24",
      transportKm: 12,
      transportType: "motorbike",
      electricityKwh: 9,
      wasteKg: 2.0,
      dietType: "vegetarian",
      composted: true,
      recycled: true,
      totalCo2Kg: 8.9,
    },
    {
      id: "log-5",
      date: "Jun 25",
      transportKm: 0,
      transportType: "walk-cycle",
      electricityKwh: 6,
      wasteKg: 0.8,
      dietType: "vegan",
      composted: true,
      recycled: true,
      totalCo2Kg: 4.2,
    },
    {
      id: "log-6",
      date: "Jun 26",
      transportKm: 30,
      transportType: "electric-vehicle",
      electricityKwh: 14,
      wasteKg: 2.2,
      dietType: "avg-meat",
      composted: false,
      recycled: true,
      totalCo2Kg: 12.1,
    },
  ]);

  // Carbon factors
  const getTransportFactor = (type: string) => {
    switch (type) {
      case "petrol-car":
        return 0.18; // kg CO2 per km
      case "diesel-car":
        return 0.16;
      case "motorbike":
        return 0.10;
      case "electric-vehicle":
        return 0.05;
      case "public-transit":
        return 0.04;
      case "walk-cycle":
      default:
        return 0.0;
    }
  };

  const getDietFactor = (type: string) => {
    switch (type) {
      case "heavy-meat":
        return 4.5; // kg CO2 per day
      case "avg-meat":
        return 3.1;
      case "vegetarian":
        return 1.7;
      case "vegan":
        return 0.9;
      default:
        return 1.7;
    }
  };

  // Live footprint calculations
  const calculateCurrentCo2 = () => {
    const transportCO2 = transportKm * getTransportFactor(transportType);
    const electricityCO2 = electricityKwh * 0.82; // 0.82 kg per kWh average

    // Waste is discounted if composted/recycled
    let wasteFactor = 1.5; // standard unsorted landfill kg CO2 per kg waste
    if (composted && recycled) wasteFactor = 0.1;
    else if (composted) wasteFactor = 0.6;
    else if (recycled) wasteFactor = 0.8;
    const wasteCO2 = wasteKg * wasteFactor;

    const dietCO2 = getDietFactor(dietType);

    // Dynamic checks on offsets
    let offsetSavings = 0;
    if (offsetChecked.walk) offsetSavings += 1.2;
    if (offsetChecked.appliances) offsetSavings += 0.8;
    if (offsetChecked.diet) offsetSavings += 1.5;
    if (offsetChecked.compost) offsetSavings += 2.0;
    if (offsetChecked.dryer) offsetSavings += 1.0;
    if (offsetChecked.acTemp) offsetSavings += 1.4;
    if (offsetChecked.seedling) offsetSavings += 0.5;

    const netValue = transportCO2 + electricityCO2 + wasteCO2 + dietCO2 - offsetSavings;
    return Math.max(0.1, Math.round(netValue * 10) / 10);
  };

  const currentCo2 = calculateCurrentCo2();

  // Handle offset item toggle
  const handleToggleOffset = (key: string, label: string, saving: number, rewardXp: number) => {
    const newVal = !offsetChecked[key];
    setOffsetChecked((prev) => ({ ...prev, [key]: newVal }));

    if (newVal) {
      handleUpdateCredits(credits + rewardXp);
      triggerToast("🌱", `Eco Action completed: "${label}"! Saved ${saving}kg CO2 & earned +${rewardXp} XP!`);
    } else {
      handleUpdateCredits(Math.max(0, credits - rewardXp));
      triggerToast("🔄", `Removed action: "${label}". CO2 offset and XP reverted.`);
    }
  };

  // Submit log
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Check if logged already today to prevent infinite spam, though allow for test
    const newLog: CarbonLog = {
      id: `log-${Date.now()}`,
      date: todayStr,
      transportKm,
      transportType,
      electricityKwh,
      wasteKg,
      dietType,
      composted,
      recycled,
      totalCo2Kg: currentCo2,
    };

    setLogs((prev) => [...prev, newLog]);
    handleUpdateCredits(credits + 50);
    triggerToast("📊", `Daily Carbon logged successfully! Awarded +50 XP. Your footprint today: ${currentCo2} kg CO2e.`);

    // Reset offsets for next day
    setOffsetChecked({
      walk: false,
      appliances: false,
      diet: false,
      compost: false,
      dryer: false,
      acTemp: false,
      seedling: false,
    });
  };

  // Standard target threshold
  const dailySustainableBudget = 5.0; // 5 kg CO2e per person is standard green threshold
  const budgetRatio = Math.round((currentCo2 / dailySustainableBudget) * 100);

  // Format Recharts data
  const chartData = logs.map((log) => {
    const tCO2 = log.transportKm * getTransportFactor(log.transportType);
    const eCO2 = log.electricityKwh * 0.82;
    let wFac = 1.5;
    if (log.composted && log.recycled) wFac = 0.1;
    else if (log.composted) wFac = 0.6;
    else if (log.recycled) wFac = 0.8;
    const wCO2 = log.wasteKg * wFac;
    const dCO2 = getDietFactor(log.dietType);

    return {
      name: log.date,
      Transport: Math.round(tCO2 * 10) / 10,
      Electricity: Math.round(eCO2 * 10) / 10,
      Waste: Math.round(wCO2 * 10) / 10,
      Diet: Math.round(dCO2 * 10) / 10,
      Total: log.totalCo2Kg,
    };
  });

  return (
    <div className="page active" id="page-carbon" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-leaf"></i> Carbon Footprint Tracking
        </h2>
        <p>Calculate your impact, complete green challenges, and offset your carbon footprint.</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="grid g3" style={{ alignItems: "stretch", marginBottom: "2rem" }}>
            {/* Left/Middle Column: Interactive Footprint Calculator */}
            <div className="card card-body md:col-span-2" style={{ gridColumn: "span 2" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1.1rem" }}>
                  <i className="fas fa-calculator" style={{ color: "var(--leaf)", marginRight: "0.5rem" }}></i>
                  Log Your Daily Footprint
                </div>
                <span className="badge badge-ai">
                  <i className="fas fa-magic"></i> Live CO2 Estimator
                </span>
              </div>

              <form onSubmit={handleLogSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Transport section */}
                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🚗</span> Transportation Distance
                  </div>
                  <div className="grid g2" style={{ gap: "1rem" }}>
                    <div>
                      <label className="form-label">Transport Mode</label>
                      <select
                        className="form-input"
                        value={transportType}
                        onChange={(e) => setTransportType(e.target.value)}
                      >
                        <option value="petrol-car">Car (Petrol/Gasoline)</option>
                        <option value="diesel-car">Car (Diesel)</option>
                        <option value="motorbike">Two-Wheeler (Motorbike/Scooter)</option>
                        <option value="electric-vehicle">Electric Vehicle (EV)</option>
                        <option value="public-transit">Public Transport (Bus/Metro)</option>
                        <option value="walk-cycle">Walk / Bicycle (Zero Emission)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Distance Traveled ({transportKm} Km)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="w-full h-2 bg-[#C8E6C9] rounded-lg appearance-none cursor-pointer"
                        style={{ marginTop: "0.75rem" }}
                        value={transportKm}
                        onChange={(e) => setTransportKm(parseInt(e.target.value))}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                        <span>0 km</span>
                        <span>50 km</span>
                        <span>100 km+</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Energy Section */}
                <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>⚡</span> Electricity Consumption
                  </div>
                  <div className="grid g2" style={{ gap: "1rem" }}>
                    <div>
                      <label className="form-label">Estimated Usage ({electricityKwh} KWh)</label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        className="w-full h-2 bg-[#C8E6C9] rounded-lg appearance-none cursor-pointer"
                        style={{ marginTop: "0.75rem" }}
                        value={electricityKwh}
                        onChange={(e) => setElectricityKwh(parseInt(e.target.value))}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                        <span>0 KWh (Eco)</span>
                        <span>20 KWh (Average)</span>
                        <span>40 KWh</span>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Quick Energy Presets</label>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, padding: "0.3rem" }}
                          onClick={() => setElectricityKwh(4)}
                        >
                          Low (4)
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, padding: "0.3rem" }}
                          onClick={() => setElectricityKwh(10)}
                        >
                          Med (10)
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, padding: "0.3rem" }}
                          onClick={() => setElectricityKwh(22)}
                        >
                          High (22)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waste and Diet */}
                <div className="grid g2" style={{ gap: "1rem" }}>
                  <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      🗑️ Waste Produced
                    </div>
                    <label className="form-label">Dry Garbage Weight ({wasteKg} Kg)</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      className="w-full h-2 bg-[#C8E6C9] rounded-lg appearance-none cursor-pointer"
                      style={{ marginTop: "0.5rem", marginBottom: "0.75rem" }}
                      value={wasteKg}
                      onChange={(e) => setWasteKg(parseFloat(e.target.value))}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                        <input
                          type="checkbox"
                          checked={composted}
                          onChange={(e) => setComposted(e.target.checked)}
                          style={{ accentColor: "var(--leaf)" }}
                        />
                        Composted Organics (-60% CO2)
                      </label>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
                        <input
                          type="checkbox"
                          checked={recycled}
                          onChange={(e) => setRecycled(e.target.checked)}
                          style={{ accentColor: "var(--leaf)" }}
                        />
                        Recycled Plastics/Paper (-45% CO2)
                      </label>
                    </div>
                  </div>

                  <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      🍽️ Dietary Choices
                    </div>
                    <label className="form-label">Meal Carbon Class</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.3rem" }}>
                      {[
                        { id: "heavy-meat", label: "🥩 High Meat (Frequent beef/pork)", factor: "4.5 kg CO2" },
                        { id: "avg-meat", label: "🍗 Average Diet (Poultry/fish/some meat)", factor: "3.1 kg CO2" },
                        { id: "vegetarian", label: "🥦 Vegetarian (No meat/seafood)", factor: "1.7 kg CO2" },
                        { id: "vegan", label: "🌱 Vegan (Purely plant-based)", factor: "0.9 kg CO2" },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className="form-label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.78rem",
                            padding: "0.35rem 0.6rem",
                            background: dietType === item.id ? "var(--bg2)" : "white",
                            border: `1px solid ${dietType === item.id ? "var(--leaf)" : "var(--border)"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <input
                              type="radio"
                              name="diet"
                              checked={dietType === item.id}
                              onChange={() => setDietType(item.id as any)}
                              style={{ accentColor: "var(--leaf)" }}
                            />
                            {item.label}
                          </span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)" }}>{item.factor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-green"
                  style={{ width: "100%", justifyContent: "center", padding: "0.85rem", marginTop: "0.5rem" }}
                >
                  <i className="fas fa-save"></i> Submit Today's Carbon Log (+50 XP)
                </button>
              </form>
            </div>

            {/* Right Column: Footprint Dial Summary & Dynamic Budget */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card card-body" style={{ textAlign: "center", background: "white", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Estimated Footprint Today
                </div>
                <div style={{ margin: "1.25rem auto", position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                  {/* Circle SVG meter */}
                  <svg style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle
                      cx="70"
                      cy="70"
                      r="58"
                      stroke="#E8F5E9"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="58"
                      stroke={currentCo2 > dailySustainableBudget ? "var(--amber)" : "var(--leaf)"}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="364.4"
                      strokeDashoffset={364.4 - (364.4 * Math.min(100, budgetRatio)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Poppins, sans-serif" }}>
                      {currentCo2}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
                      Kg CO₂e
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  {currentCo2 <= dailySustainableBudget ? (
                    <span className="badge badge-resolved">
                      <i className="fas fa-check-circle"></i> Sustainable Day!
                    </span>
                  ) : (
                    <span className="badge badge-progress">
                      <i className="fas fa-triangle-exclamation"></i> Budget Exceeded
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--muted)", padding: "0 0.5rem", lineHeight: 1.5 }}>
                  Sustainable daily quota is <strong style={{ color: "var(--leaf)" }}>{dailySustainableBudget} kg</strong>. You are at{" "}
                  <strong>{budgetRatio}%</strong> of your allowance.
                </div>
              </div>

              {/* Carbon Reduction Level card */}
              <div className="xp-card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.7, fontWeight: 600, letterSpacing: "0.05em" }}>
                  ECO-CIVIC RANK
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "Poppins, sans-serif", margin: "0.15rem 0" }}>
                  🌲 Carbon Neutral Hero
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.85, lineHeight: 1.4, margin: "0.4rem 0 1rem" }}>
                  Your consistent waste sorting & green commutes have lowered your footprint by 24% this month!
                </div>
                <div className="xp-level-bar" style={{ height: "6px", margin: "0 0 0.25rem" }}>
                  <div className="xp-level-fill" style={{ width: "78%" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", opacity: 0.7 }}>
                  <span>Level 4</span>
                  <span>780 / 1000 CO2 offsets</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid g2" style={{ alignItems: "start", marginBottom: "2rem" }}>
            {/* Left Column: Interactive Reduction Checklist (Interactive Tips!) */}
            <div>
              <div className="section-header" style={{ textAlign: "left", marginBottom: "1rem" }}>
                <div className="section-tag">
                  <i className="fas fa-lightbulb"></i> Actionable reduction tips
                </div>
                <h3 className="section-title" style={{ fontSize: "1.2rem", margin: "0" }}>
                  Tips to Lower Your Footprint
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  Toggle the checkboxes for the actions you've completed today to instantly subtract carbon emissions and earn extra XP!
                </p>
              </div>

              <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "white" }}>
                {/* Tip 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.walk ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.walk ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.walk}
                    onChange={() =>
                      handleToggleOffset("walk", "Short distance Walk or Cycle", 1.2, 15)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🚶 Short commutes by Walk/Cycle</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Choosing walking, jogging or cycling over driving for short distances (under 3 km) drastically cuts vehicle wear and tear and keeps fossil fuels in the ground.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-1.2 kg CO₂</span>
                      <span className="badge badge-ai">+15 XP Reward</span>
                    </div>
                  </div>
                </div>

                {/* Tip 2 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.appliances ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.appliances ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.appliances}
                    onChange={() =>
                      handleToggleOffset("appliances", "Cut Vampire Standby Power", 0.8, 10)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🔌 Cut Vampire Standby Power</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Unplug chargers, microwave ovens, televisions, and electronics when not in use. Standby mode accounts for up to 10% of home electricity leaks.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-0.8 kg CO₂</span>
                      <span className="badge badge-ai">+10 XP Reward</span>
                    </div>
                  </div>
                </div>

                {/* Tip 3 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.diet ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.diet ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.diet}
                    onChange={() =>
                      handleToggleOffset("diet", "Meatless Diet Choice", 1.5, 15)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🥦 Opt for a Meat-Free Meal</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Livestock operations generate massive amounts of methane gas. Eating vegetarian or plant-based meals cuts agricultural emissions immediately.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-1.5 kg CO₂</span>
                      <span className="badge badge-ai">+15 XP Reward</span>
                    </div>
                  </div>
                </div>

                {/* Tip 4 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.compost ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.compost ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.compost}
                    onChange={() =>
                      handleToggleOffset("compost", "Composting Organics", 2.0, 20)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🌱 Home Composting Organic Waste</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Diverting kitchen scraps and fruit peels to a home compost bin avoids anaerobic decomposition in public landfills, stopping methane leaks.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-2.0 kg CO₂</span>
                      <span className="badge badge-ai">+20 XP Reward</span>
                    </div>
                  </div>
                </div>

                {/* Tip 5 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.acTemp ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.acTemp ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.acTemp}
                    onChange={() =>
                      handleToggleOffset("acTemp", "Thermostat adjusted to 24°C", 1.4, 15)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🌡️ Set Air Conditioning to 24°C+</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Setting your cooling system at 24°C or higher saves up to 6% on compressor workload for every degree raised. Reduces power bills as well!
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-1.4 kg CO₂</span>
                      <span className="badge badge-ai">+15 XP Reward</span>
                    </div>
                  </div>
                </div>

                {/* Tip 6 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    background: offsetChecked.seedling ? "var(--bg2)" : "var(--bg)",
                    border: `1.5px solid ${offsetChecked.seedling ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: "12px",
                    transition: "var(--transition)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={offsetChecked.seedling}
                    onChange={() =>
                      handleToggleOffset("seedling", "Plant a green sapling", 0.5, 25)
                    }
                    style={{ marginTop: "0.25rem", accentColor: "var(--leaf)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <div style={{ flex: 1, fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--forest)" }}>🌳 Plant or Care for Urban Trees</div>
                    <div style={{ color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>
                      Trees are active carbon sinks, scrubbing carbon dioxide from ambient air while releasing vital oxygen and lowering urban heat island effects.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <span className="badge" style={{ background: "#E8F5E9", color: "#1B5E20" }}>-0.5 kg CO₂ (offset)</span>
                      <span className="badge badge-ai">+25 XP Reward</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Historical Emission Trends Chart */}
            <div>
              <div className="section-header" style={{ textAlign: "left", marginBottom: "1rem" }}>
                <div className="section-tag">
                  <i className="fas fa-chart-line"></i> Analytics & history
                </div>
                <h3 className="section-title" style={{ fontSize: "1.2rem", margin: "0" }}>
                  Emission Trends (Last 7 Days)
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  Detailed breakdown of carbon footprint by category in your city logs.
                </p>
              </div>

              <div className="card card-body" style={{ background: "white", padding: "1rem" }}>
                <div style={{ width: "100%", height: "240px", fontSize: "0.75rem" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontFamily: "Inter, sans-serif",
                        }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="Transport" name="Transport" stackId="a" fill="var(--sky)" />
                      <Bar dataKey="Electricity" name="Electricity" stackId="a" fill="var(--amber)" />
                      <Bar dataKey="Waste" name="Waste" stackId="a" fill="var(--red-bin)" />
                      <Bar dataKey="Diet" name="Diet" stackId="a" fill="var(--leaf)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* History list details */}
                <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem", fontFamily: "Poppins, sans-serif" }}>
                    Recent Daily Log Entries
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {logs
                      .slice()
                      .reverse()
                      .slice(0, 4)
                      .map((log) => {
                        const isUnder = log.totalCo2Kg <= dailySustainableBudget;
                        return (
                          <div
                            key={log.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "var(--bg)",
                              padding: "0.6rem 0.85rem",
                              borderRadius: "8px",
                              fontSize: "0.78rem",
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{log.date}</div>
                            <div style={{ color: "var(--muted)", textTransform: "capitalize" }}>
                              {log.transportKm}km ({log.transportType.replace("-", " ")}) · {log.electricityKwh}KWh
                            </div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: isUnder ? "var(--leaf)" : "var(--amber)",
                              }}
                            >
                              {log.totalCo2Kg} kg CO₂e
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
