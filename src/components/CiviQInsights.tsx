import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CiviQInsightsProps {
  triggerToast: (icon: string, message: string) => void;
}

const resolvedIssuesData = [
  { category: "Roads", resolved: 245 },
  { category: "Water", resolved: 189 },
  { category: "Waste", resolved: 312 },
  { category: "Lights", resolved: 145 },
  { category: "Parks", resolved: 67 },
];

interface WardReportData {
  scoreCommentary: string;
  contractorCommentary: string;
  actionPlan: string[];
}

export function CiviQInsights({ triggerToast }: CiviQInsightsProps) {
  // Report Generator State
  const [selectedWard, setSelectedWard] = useState<string>("7");
  const [selectedMonth, setSelectedMonth] = useState<string>("June 2026");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportData, setReportData] = useState<WardReportData | null>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    triggerToast("🤖", `Querying Gemini to synthesize Ward ${selectedWard} metrics...`);

    try {
      const res = await fetch("/api/gemini/ward-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ward: selectedWard, month: selectedMonth }),
      });
      const data = await res.json();
      setReportData(data);
      setIsGenerating(false);
      triggerToast("📄", `Ward ${selectedWard} Health Report successfully generated!`);
    } catch (err) {
      console.error("Failed to generate ward report:", err);
      setIsGenerating(false);
      // Fallback
      setReportData({
        scoreCommentary: `Ward ${selectedWard} achieved robust citizen response this month. Active verifications successfully flagged contractor closure claims, ensuring full taxpayer value.`,
        contractorCommentary: `Contractor performance reviews show steady marks for local gardening teams, but paving crews remain subject to ongoing audit reviews due to consecutive project delays.`,
        actionPlan: [
          "Establish secondary composting bin clusters in dense high-rise developments.",
          "Perform pre-monsoon clearing of drains in main commercial sectors.",
          "Conduct emergency audit of street light grids before heavy monsoon weather."
        ]
      });
      triggerToast("⚠️", "Report generated with local system fallback.");
    }
  };

  const handleDownloadPDF = () => {
    triggerToast("📥", "Preparing print-ready PDF file download...");
    // Use window.print() or download simulation
    const printContent = document.getElementById("printable-ward-report")?.innerHTML;
    if (!printContent) return;

    const originalBody = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ward_${selectedWard}_Health_Report_${selectedMonth.replace(" ", "_")}</title>
            <style>
              body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
              .header { border-bottom: 2px solid #2e7d32; padding-bottom: 20px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; margin: 0; color: #1b5e20; }
              .meta { font-size: 14px; color: #64748b; margin-top: 5px; }
              h3 { color: #2e7d32; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px; }
              p { font-size: 14px; line-height: 1.6; }
              ul { padding-left: 20px; font-size: 14px; line-height: 1.6; }
              li { margin-bottom: 8px; }
              .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; background: #f8fafc; padding: 15px; border-radius: 8px; }
              .stat-box { text-align: center; }
              .stat-val { font-size: 18px; font-weight: bold; color: #2e7d32; }
              .stat-lbl { font-size: 11px; color: #64748b; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="page active" id="page-insights" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-brain"></i> AI Predictive Insights
        </h2>
        <p>8 AI models analyzing patterns to prevent issues before they happen</p>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="grid g2" style={{ alignItems: "start", marginBottom: "1.5rem" }}>
            
            {/* LEFT AREA: ORIGINAL PREDICTIVE CARDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="insight-card">
                <div className="insight-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="insight-text">
                  <strong>Pothole surge predicted</strong>
                  <br />
                  Based on monsoon patterns + 3 years of data, Ward 7 is likely to see a 340% spike in road damage in the next 21 days.
                  Pre-emptive repair recommended before July 15.
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon">
                  <i className="fas fa-route"></i>
                </div>
                <div className="insight-text">
                  <strong>Waste vehicle route optimization</strong>
                  <br />
                  Rerouting WV-3 and WV-7 via Route B saves 2.4 hours/day and reduces missed collection by 67% in Pitampura sector.
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon">
                  <i className="fas fa-triangle-exclamation"></i>
                </div>
                <div className="insight-text">
                  <strong>Contractor risk flag</strong>
                  <br />
                  Metro Roads Ltd has failed SLA in 19 consecutive projects. AI recommends suspension review before sanctioning ₹2.3Cr for
                  Outer Ring Road tender.
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-icon">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <div className="insight-text">
                  <strong>Engagement opportunity</strong>
                  <br />
                  Ward 12 has 0 active Green Champions despite 78 registered users. Targeted in-app nudge could convert 12 users based on
                  report history.
                </div>
              </div>
            </div>

            {/* RIGHT AREA: AI EXECUTIVE REPORT GENERATOR */}
            <div className="card card-body" style={{ background: "rgba(30, 41, 59, 0.03)", border: "1.5px solid rgba(76, 175, 80, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "0.95rem", color: "var(--forest)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <i className="fas fa-file-contract"></i>
                  <span>AI Executive Ward Health Synthesizer</span>
                </div>
                <span className="badge badge-ai" style={{ background: "rgba(76,175,80,0.12)", color: "var(--leaf)" }}>
                  PDF Export
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                Instantly aggregate active citizen verifications, contractor compliance penalties, carbon footprints, and budget utilization rates into a downloadable PDF report.
              </div>

              <div className="grid g2" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: "0.72rem" }}>Target Ward</label>
                  <select
                    className="form-input"
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem", height: "auto" }}
                  >
                    <option value="7">Ward 7 (Rajouri Garden)</option>
                    <option value="3">Ward 3 (Pitampura)</option>
                    <option value="11">Ward 11 (Dwarka)</option>
                    <option value="5">Ward 5 (Malviya Nagar)</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: "0.72rem" }}>Report Month</label>
                  <select
                    className="form-input"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem", height: "auto" }}
                  >
                    <option value="June 2026">June 2026 (Monsoon Launch)</option>
                    <option value="May 2026">May 2026 (Summer Peak)</option>
                    <option value="April 2026">April 2026 (Spring Audit)</option>
                  </select>
                </div>
              </div>

              <button
                className="btn btn-green"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Synthesizing official record streams...
                  </>
                ) : (
                  <>
                    <i className="fas fa-microchip"></i> Generate Executive Ward Health Report
                  </>
                )}
              </button>

              {/* REPORT DISPLAY SHEET */}
              {reportData && (
                <div
                  className="card"
                  style={{
                    background: "white",
                    border: "1px dashed #cbd5e1",
                    color: "#1e293b",
                    padding: "1.25rem",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                    transition: "all 0.4s",
                  }}
                >
                  <div id="printable-ward-report">
                    {/* REPORT PRINT HEADER */}
                    <div style={{ borderBottom: "2px solid #2e7d32", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.62rem", letterSpacing: "0.1em", fontWeight: "bold", color: "#64748b" }}>
                          MUNICIPAL CORPORATION OF DELHI (MCD)
                        </span>
                        <span style={{ fontSize: "0.62rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                          CONFIDENTIAL / INTERNAL
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.25rem 0 0", color: "#1b5e20", fontFamily: "Poppins, sans-serif" }}>
                        Ward {selectedWard} Health Audit & SLA Compliance Report
                      </h4>
                      <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
                        Synthesized on {selectedMonth} by CivicAI Insight Engine
                      </p>
                    </div>

                    {/* SECTIONS */}
                    <div style={{ fontSize: "0.78rem", lineHeight: "1.5" }}>
                      <div style={{ marginBottom: "0.85rem" }}>
                        <strong style={{ color: "#2e7d32", display: "block", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", paddingBottom: "2px", marginBottom: "4px" }}>
                          1. Citizen Engagement & Verification Score
                        </strong>
                        <p style={{ margin: 0, color: "#334155" }}>{reportData.scoreCommentary}</p>
                      </div>

                      <div style={{ marginBottom: "0.85rem" }}>
                        <strong style={{ color: "#2e7d32", display: "block", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", paddingBottom: "2px", marginBottom: "4px" }}>
                          2. Active Contractor Compliance & Penalty Logs
                        </strong>
                        <p style={{ margin: 0, color: "#334155" }}>{reportData.contractorCommentary}</p>
                      </div>

                      <div style={{ marginBottom: "0.85rem" }}>
                        <strong style={{ color: "#2e7d32", display: "block", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", paddingBottom: "2px", marginBottom: "4px" }}>
                          3. Council Strategic Action Recommendations
                        </strong>
                        <ul style={{ margin: "4px 0 0", paddingLeft: "1.1rem", color: "#334155" }}>
                          {reportData.actionPlan.map((plan, idx) => (
                            <li key={idx} style={{ marginBottom: "3px" }}>{plan}</li>
                          ))}
                        </ul>
                      </div>

                      {/* STATS MATRIX */}
                      <div
                        style={{
                          marginTop: "1rem",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          padding: "0.75rem",
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "0.5rem",
                          textAlign: "center",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#1b5e20" }}>298/342</div>
                          <div style={{ fontSize: "0.58rem", color: "#64748b" }}>Resolved / Reported</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#1b5e20" }}>₹14.5L</div>
                          <div style={{ fontSize: "0.58rem", color: "#64748b" }}>Budget Utilized</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#1b5e20" }}>-24%</div>
                          <div style={{ fontSize: "0.58rem", color: "#64748b" }}>Co2 Emissions</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#1b5e20" }}>84%</div>
                          <div style={{ fontSize: "0.58rem", color: "#64748b" }}>Citizen Verification</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DOWNLOAD CONTROL */}
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={handleDownloadPDF}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginTop: "1rem",
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                    }}
                  >
                    <i className="fas fa-download"></i> Download Official Printable PDF
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* VISUALS: RECHARTS BAR CHART */}
          <div className="card card-body" style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1.1rem", marginBottom: "1rem" }}>
              <i className="fas fa-chart-bar" style={{ color: "var(--leaf)" }}></i> Issues Resolved by Category
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolvedIssuesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="resolved" fill="var(--leaf)" radius={[4, 4, 0, 0]} barSize={40} name="Issues Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid g2">
            <div className="card card-body" style={{ borderLeft: "3px solid var(--amber)" }}>
              <div style={{ fontSize: ".72rem", color: "var(--amber)", fontWeight: 700, letterSpacing: ".05em", marginBottom: ".35rem" }}>
                PREDICTION — NEXT 30 DAYS
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".5rem" }}>
                +180 road issues expected
              </div>
              <div style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: ".85rem", lineHeight: 1.6 }}>
                Based on monsoon onset, traffic density, and historical SLA patterns in Wards 3, 7, and 11.
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => triggerToast("📊", "Generating pre-monsoon civic action plan...")}>
                <i className="fas fa-download"></i> Generate action plan
              </button>
            </div>
            <div className="card card-body">
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".85rem" }}>
                <i className="fas fa-coins" style={{ color: "var(--leaf)" }}></i> Budget vs impact score
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: ".65rem", fontSize: ".82rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                    <span>Roads</span>
                    <span style={{ fontWeight: 600 }}>₹4.2Cr</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: "72%", background: "linear-gradient(90deg,#1976D2,#42A5F5)" }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                    <span>Sanitation</span>
                    <span style={{ fontWeight: 600 }}>₹3.1Cr</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: "55%", background: "linear-gradient(90deg,#00897B,#26A69A)" }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                    <span>Water</span>
                    <span style={{ fontWeight: 600 }}>₹2.2Cr</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: "38%", background: "linear-gradient(90deg,#0288D1,#29B6F6)" }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                    <span>Parks</span>
                    <span style={{ fontWeight: 600 }}>₹1.1Cr</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: "20%" }}></div>
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
