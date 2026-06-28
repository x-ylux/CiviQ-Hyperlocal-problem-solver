import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

export function CiviQInsights({ triggerToast }: CiviQInsightsProps) {
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
          <div style={{ marginBottom: "1.5rem" }}>
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
            <div className="insight-card">
              <div className="insight-icon">
                <i className="fas fa-seedling"></i>
              </div>
              <div className="insight-text">
                <strong>Compost uptake rising</strong>
                <br />
                Green bin usage in Dwarka up 34% since last month. AI recommends running a compost kit promotion to sustain momentum.
              </div>
            </div>
            
            <div className="card card-body" style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1.1rem", marginBottom: "1rem" }}>
                <i className="fas fa-chart-bar" style={{ color: "var(--leaf)" }}></i> Issues Resolved by Category
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolvedIssuesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="resolved" fill="var(--leaf)" radius={[4, 4, 0, 0]} barSize={40} name="Issues Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
