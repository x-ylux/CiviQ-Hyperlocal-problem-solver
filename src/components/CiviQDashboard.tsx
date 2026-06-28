import React from "react";

interface CiviQDashboardProps {
  onNavigate: (tab: string) => void;
  openModal: (type: "rti" | "compost") => void;
  triggerToast: (icon: string, message: string) => void;
}

export function CiviQDashboard({ onNavigate, openModal, triggerToast }: CiviQDashboardProps) {
  return (
    <div className="page active" id="page-dashboard" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-chart-line"></i> Community Dashboard
        </h2>
        <p>Real-time overview of civic issues across your city</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="sla-alert">
            <i className="fas fa-triangle-exclamation" style={{ color: "#E53935", fontSize: "1.1rem", flexShrink: 0 }}></i>
            <div>
              <strong style={{ color: "#B71C1C" }}>SLA Breach:</strong> Ward 7 pothole (Report #1042) ignored 14 days —
              escalated to Dy. Commissioner.
              <span
                onClick={() => openModal("rti")}
                style={{
                  color: "var(--red-bin)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  marginLeft: ".35rem",
                }}
              >
                Generate RTI
              </span>
            </div>
          </div>

          <div className="grid g4" style={{ marginBottom: "1.5rem" }}>
            <div className="metric red">
              <div className="metric-icon">
                <i className="fas fa-circle-exclamation"></i>
              </div>
              <div className="metric-value" style={{ color: "var(--red-bin)" }}>
                247
              </div>
              <div className="metric-label">Open issues</div>
              <span className="metric-delta delta-down">
                <i className="fas fa-arrow-up"></i> 12 this week
              </span>
            </div>
            <div className="metric green">
              <div className="metric-icon">
                <i className="fas fa-circle-check"></i>
              </div>
              <div className="metric-value" style={{ color: "var(--leaf)" }}>
                1,084
              </div>
              <div className="metric-label">Resolved (30d)</div>
              <span className="metric-delta delta-up">
                <i className="fas fa-arrow-up"></i> 23% vs last month
              </span>
            </div>
            <div className="metric blue">
              <div className="metric-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="metric-value" style={{ color: "var(--sky)" }}>
                8,341
              </div>
              <div className="metric-label">Citizens engaged</div>
              <span className="metric-delta delta-up">
                <i className="fas fa-arrow-up"></i> 340 new
              </span>
            </div>
            <div className="metric amber">
              <div className="metric-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="metric-value" style={{ color: "var(--amber)" }}>
                4.2d
              </div>
              <div className="metric-label">Avg resolution</div>
              <span className="metric-delta delta-up">
                <i className="fas fa-arrow-down"></i> 1.8d faster
              </span>
            </div>
          </div>

          <div className="grid g2">
            <div>
              <h3
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                }}
              >
                <i className="fas fa-fire" style={{ color: "var(--red-bin)" }}></i> High-priority issues
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
                <div className="issue-card urgent" onClick={() => onNavigate("track")}>
                  <div style={{ display: "flex", gap: ".85rem" }}>
                    <div className="issue-emoji" style={{ background: "#FEF3C7" }}>
                      🕳️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".3rem" }}>
                        <span className="badge badge-critical">Critical</span>
                        <span className="badge badge-progress">In progress</span>
                        <span className="badge badge-ai">
                          <i className="fas fa-robot"></i> AI verified
                        </span>
                      </div>
                      <div className="issue-title">Pothole cluster — 3 merged reports</div>
                      <div className="issue-addr">
                        <i className="fas fa-location-dot"></i> Rajouri Garden, Sector 5
                      </div>
                    </div>
                  </div>
                  <div className="issue-footer">
                    <span>
                      <i className="fas fa-arrow-up"></i> 143
                    </span>
                    <span>
                      <i className="fas fa-users"></i> 38 verified
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> 14d open
                    </span>
                    <button
                      className="upvote-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerToast("⬆️", "Upvoted! Issue priority raised.");
                      }}
                    >
                      <i className="fas fa-arrow-up"></i> Upvote
                    </button>
                  </div>
                </div>

                <div className="issue-card" onClick={() => onNavigate("track")}>
                  <div style={{ display: "flex", gap: ".85rem" }}>
                    <div className="issue-emoji" style={{ background: "#E3F2FD" }}>
                      💧
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".3rem" }}>
                        <span className="badge" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          High
                        </span>
                        <span className="badge badge-verify">Citizen verify</span>
                        <span className="badge badge-ai">
                          <i className="fas fa-robot"></i> AI verified
                        </span>
                      </div>
                      <div className="issue-title">Contaminated water leak near school</div>
                      <div className="issue-addr">
                        <i className="fas fa-location-dot"></i> Pitampura, Block A
                      </div>
                    </div>
                  </div>
                  <div className="issue-footer">
                    <span>
                      <i className="fas fa-arrow-up"></i> 89
                    </span>
                    <span>
                      <i className="fas fa-users"></i> 14 verified
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> 6d open
                    </span>
                    <button
                      className="upvote-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerToast("⬆️", "Upvoted! Issue priority raised.");
                      }}
                    >
                      <i className="fas fa-arrow-up"></i> Upvote
                    </button>
                  </div>
                </div>

                <div className="issue-card" onClick={() => onNavigate("track")}>
                  <div style={{ display: "flex", gap: ".85rem" }}>
                    <div className="issue-emoji" style={{ background: "#E8F5E9" }}>
                      🗑️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".3rem" }}>
                        <span className="badge badge-open">Open</span>
                      </div>
                      <div className="issue-title">Illegal dumping — residential area</div>
                      <div className="issue-addr">
                        <i className="fas fa-location-dot"></i> Dwarka Sector 12
                      </div>
                    </div>
                  </div>
                  <div className="issue-footer">
                    <span>
                      <i className="fas fa-arrow-up"></i> 52
                    </span>
                    <span>
                      <i className="fas fa-users"></i> 7 verified
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> 2d open
                    </span>
                    <button
                      className="upvote-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerToast("⬆️", "Upvoted!");
                      }}
                    >
                      <i className="fas fa-arrow-up"></i> Upvote
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: "1rem" }}>
                <i className="fas fa-medal" style={{ color: "var(--amber)" }}></i> Contractor scorecards
              </h3>
              <div className="card card-body" style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: ".75rem", color: "var(--muted)", marginBottom: ".85rem" }}>
                  Public ranking by active delays + failure rate
                </div>
                <div className="contractor-row">
                  <div className="contractor-grade" style={{ background: "#E8F5E9", color: "#1B5E20" }}>
                    A+
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".88rem" }}>GreenBuild Pvt Ltd</div>
                    <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>2 delays · ₹12L sanctioned</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--leaf)" }}>94</div>
                </div>
                <div className="contractor-row">
                  <div className="contractor-grade" style={{ background: "#FEF3C7", color: "#78350F" }}>
                    B
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".88rem" }}>UrbanFix Corp</div>
                    <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>7 delays · ₹48L sanctioned</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--amber)" }}>71</div>
                </div>
                <div className="contractor-row" style={{ borderBottom: "none" }}>
                  <div className="contractor-grade" style={{ background: "#FFEBEE", color: "#B71C1C" }}>
                    D
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".88rem" }}>Metro Roads Ltd</div>
                    <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>19 delays · ₹2.3Cr sanctioned</div>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--red-bin)" }}>38</div>
                </div>
              </div>

              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".85rem" }}>
                <i className="fas fa-chart-bar" style={{ color: "var(--sky)" }}></i> Resolution by category
              </h3>
              <div className="card card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: ".3rem" }}>
                      <span>Roads & potholes</span>
                      <span style={{ fontWeight: 600 }}>78%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: ".3rem" }}>
                      <span>Water supply</span>
                      <span style={{ fontWeight: 600 }}>62%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: "62%", background: "linear-gradient(90deg,var(--sky),#29B6F6)" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: ".3rem" }}>
                      <span>Waste & sanitation</span>
                      <span style={{ fontWeight: 600 }}>84%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: "84%", background: "linear-gradient(90deg,#00897B,#26A69A)" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: ".3rem" }}>
                      <span>Street lighting</span>
                      <span style={{ fontWeight: 600 }}>91%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: "91%", background: "linear-gradient(90deg,var(--amber),#FB923C)" }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".78rem", marginBottom: ".3rem" }}>
                      <span>Parks & green</span>
                      <span style={{ fontWeight: 600 }}>55%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: "55%", background: "linear-gradient(90deg,#8BC34A,#CDDC39)" }}></div>
                    </div>
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
