import React, { useState, useEffect } from "react";
import { CivicIssue } from "../types";

interface CiviQTrackProps {
  issues: CivicIssue[];
  selectedIssueId: string;
  setSelectedIssueId: (id: string) => void;
  openModal: (type: "rti" | "compost") => void;
  triggerToast: (icon: string, message: string) => void;
  onUpvoteIssue: (id: string) => void;
}

export function CiviQTrack({
  issues,
  selectedIssueId,
  setSelectedIssueId,
  openModal,
  triggerToast,
  onUpvoteIssue,
}: CiviQTrackProps) {
  const [ticker, setTicker] = useState<number>(0);

  // Live ticking counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeIssue = issues.find((i) => i.id === selectedIssueId) || issues[0];

  // Helper to calculate risk score breakdown
  const getRiskBreakdown = (issue: CivicIssue) => {
    const daysFactor = issue.daysOpen * 3;
    const upvotesFactor = Math.round(issue.upvotes * 0.2);
    const densityFactor = Math.round((issue.populationDensity / 20000) * 15);
    
    let weatherFactor = 5;
    if (issue.weatherForecast.toLowerCase().includes("rain") || issue.weatherForecast.toLowerCase().includes("storm")) {
      if (["Roads", "Water", "Lights"].includes(issue.category)) {
        weatherFactor = 20;
      }
    }
    
    const contractorFactor = Math.round((100 - issue.contractorRating) * 0.3);
    const totalRaw = daysFactor + upvotesFactor + densityFactor + weatherFactor + contractorFactor;
    const totalScore = Math.min(100, Math.max(0, totalRaw));

    return {
      total: totalScore,
      days: daysFactor,
      upvotes: upvotesFactor,
      density: densityFactor,
      weather: weatherFactor,
      contractor: contractorFactor,
    };
  };

  // Helper to format SLA countdown timer
  const getSLATimer = (issue: CivicIssue) => {
    // Simulate real countdown in seconds
    const createdTime = new Date(issue.createdAt).getTime();
    const slaDurationMs = issue.slaDays * 24 * 60 * 60 * 1000;
    const deadlineTime = createdTime + slaDurationMs;
    const now = Date.now() + (ticker * 0); // use actual time

    const diff = deadlineTime - Date.now();

    if (diff <= 0) {
      const overdueSecs = Math.abs(diff) / 1000;
      const days = Math.floor(overdueSecs / (24 * 3600));
      const hours = Math.floor((overdueSecs % (24 * 3600)) / 3600);
      const mins = Math.floor((overdueSecs % 3600) / 60);
      const secs = Math.floor(overdueSecs % 60);
      return {
        isOverdue: true,
        text: `Overdue by ${days}d ${hours}h ${mins}m ${secs}s`,
      };
    } else {
      const remainSecs = diff / 1000;
      const days = Math.floor(remainSecs / (24 * 3600));
      const hours = Math.floor((remainSecs % (24 * 3600)) / 3600);
      const mins = Math.floor((remainSecs % 3600) / 60);
      const secs = Math.floor(remainSecs % 60);
      return {
        isOverdue: false,
        text: `SLA Time Left: ${days}d ${hours}h ${mins}m ${secs}s`,
      };
    }
  };

  const getCategoryEmoji = (cat: string) => {
    const emojis: Record<string, string> = {
      Roads: "🕳️",
      Water: "💧",
      Waste: "🗑️",
      Lights: "💡",
      Parks: "🌿",
      Build: "🏗️",
      Power: "🔌",
      Traffic: "🚦",
    };
    return emojis[cat] || "📍";
  };

  return (
    <div className="page active" id="page-track" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-timeline"></i> Interactive Ticket Center
        </h2>
        <p>Track your reported incidents, check live SLA counters & review AI escalation risk</p>
      </div>

      <div className="section" style={{ paddingTop: "2rem" }}>
        <div className="section-inner">
          <div className="grid" style={{ gridTemplateColumns: "300px 1fr", gap: "1.5rem" }} id="trackMainGrid">
            
            {/* LEFT COLUMN: TICKETS DIRECTORY */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "0.95rem", color: "var(--forest)", marginBottom: "0.2rem" }}>
                Active Ward Incidents ({issues.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "600px", overflowY: "auto", paddingRight: "0.25rem" }}>
                {issues.map((issue) => {
                  const rScore = getRiskBreakdown(issue).total;
                  const sla = getSLATimer(issue);
                  const isSelected = issue.id === activeIssue?.id;

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`card ${isSelected ? "selected-ticket-card" : ""}`}
                      style={{
                        padding: "1rem",
                        cursor: "pointer",
                        border: isSelected ? "2.5px solid var(--leaf)" : "1px solid var(--border)",
                        background: isSelected ? "rgba(76, 175, 80, 0.05)" : "var(--card)",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: "bold" }}>
                          Ticket #{issue.id}
                        </span>
                        {/* Escalation Risk Badge */}
                        <span
                          className="badge"
                          style={{
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.4rem",
                            background: rScore > 80 ? "#FFEBEE" : rScore > 50 ? "#FFF3E0" : "#E8F5E9",
                            color: rScore > 80 ? "#C62828" : rScore > 50 ? "#E65100" : "#2E7D32",
                          }}
                        >
                          Risk: {rScore}%
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", gap: "0.4rem", alignItems: "center", color: "var(--text)" }}>
                        <span>{getCategoryEmoji(issue.category)}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {issue.title}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem" }}>
                        📍 {issue.address}
                      </div>

                      {/* Timer preview in sidebar */}
                      <div
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          marginTop: "0.6rem",
                          color: sla.isOverdue ? "#E53935" : "var(--leaf)",
                        }}
                      >
                        <i className={`fas ${sla.isOverdue ? "fa-circle-exclamation animate-pulse" : "fa-clock"}`}></i>{" "}
                        {sla.text.split(":")[1] || sla.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE TICKET DETAILS */}
            {activeIssue ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* ACTIVE TICKET BANNER CARD */}
                <div className="card card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div
                        style={{
                          background: "#E8F5E9",
                          width: "60px",
                          height: "60px",
                          borderRadius: "14px",
                          fontSize: "2.2rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getCategoryEmoji(activeIssue.category)}
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                          <span
                            className="badge"
                            style={{
                              background: activeIssue.severity === "Critical" ? "#FFEBEE" : activeIssue.severity === "High" ? "#FFF3E0" : "#E8F5E9",
                              color: activeIssue.severity === "Critical" ? "#B71C1C" : activeIssue.severity === "High" ? "#E65100" : "#1B5E20",
                            }}
                          >
                            {activeIssue.severity}
                          </span>
                          <span className="badge badge-progress">{activeIssue.status}</span>
                        </div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, fontFamily: "Poppins, sans-serif" }}>
                          {activeIssue.title}
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                          Ticket ID: #{activeIssue.id} · Registered in {activeIssue.address} · {activeIssue.daysOpen} days open
                        </p>
                      </div>
                    </div>
                    
                    {/* Upvote buttons */}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        onUpvoteIssue(activeIssue.id);
                        triggerToast("⬆️", "SLA Escalation threshold accelerated!");
                      }}
                    >
                      <i className="fas fa-arrow-up"></i> Upvote ({activeIssue.upvotes})
                    </button>
                  </div>

                  {activeIssue.image && (
                    <div style={{ marginBottom: "1rem", borderRadius: "8px", overflow: "hidden", maxHeight: "150px" }}>
                      <img src={activeIssue.image} alt="Report Incident visual" style={{ width: "100%", height: "150px", objectFit: "cover" }} referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "var(--text)", marginBottom: "1rem" }}>
                    <strong>Resident description:</strong> {activeIssue.description}
                  </p>

                  {/* ACTIVE LIVE SLA TICKING COUNTER */}
                  {(() => {
                    const sla = getSLATimer(activeIssue);
                    return (
                      <div
                        style={{
                          background: sla.isOverdue ? "#FFEBEE" : "rgba(76,175,80,0.06)",
                          border: sla.isOverdue ? "1px solid #FFCDD2" : "1px solid rgba(76,175,80,0.2)",
                          borderRadius: "12px",
                          padding: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                          <i
                            className={`fas ${sla.isOverdue ? "fa-circle-exclamation animate-pulse" : "fa-hourglass-half"}`}
                            style={{ fontSize: "1.5rem", color: sla.isOverdue ? "#DC2626" : "var(--leaf)" }}
                          ></i>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "bold" }}>
                              Official Service Level Agreement Deadline
                            </div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: sla.isOverdue ? "#DC2626" : "var(--leaf)" }}>
                              {sla.text}
                            </div>
                          </div>
                        </div>

                        {sla.isOverdue && (
                          <button
                            className="btn btn-amber btn-sm"
                            onClick={() => {
                              openModal("rti");
                              triggerToast("⚖️", "Drafting Public Records Request...");
                            }}
                          >
                            <i className="fas fa-file-contract"></i> Draft RTI Notice
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ background: "var(--bg2)", borderRadius: "10px", padding: ".85rem", fontSize: ".82rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                      <span style={{ color: "var(--muted)" }}>Sanctioned Ward Budget</span>
                      <span style={{ fontWeight: 700, color: "var(--leaf)" }}>{activeIssue.budget}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                      <span style={{ color: "var(--muted)" }}>Responsible Contractor</span>
                      <span style={{ fontWeight: 600 }}>{activeIssue.contractorName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                      <span style={{ color: "var(--muted)" }}>Contractor Quality Score</span>
                      <span style={{ fontWeight: 600, color: activeIssue.contractorRating > 80 ? "var(--leaf)" : "var(--red-bin)" }}>
                        {activeIssue.contractorRating}/100
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Assigned Municipal Officer</span>
                      <span style={{ fontWeight: 600 }}>{activeIssue.assignedOfficer}</span>
                    </div>
                  </div>
                </div>

                {/* AI ESCALATION RISK PREDICTOR DIAGNOSTIC */}
                {(() => {
                  const diag = getRiskBreakdown(activeIssue);
                  const isHighRisk = diag.total > 80;

                  return (
                    <div
                      className="card card-body"
                      style={{
                        borderLeft: isHighRisk ? "4px solid #E53935" : diag.total > 50 ? "4px solid var(--amber)" : "4px solid var(--leaf)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                        <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <i className="fas fa-brain" style={{ color: "var(--sky)" }}></i>
                          <span>AI Predictive Escalation Risk Model</span>
                        </div>
                        <span
                          className="badge"
                          style={{
                            fontWeight: 700,
                            background: isHighRisk ? "#FFEBEE" : "#E8F5E9",
                            color: isHighRisk ? "#C62828" : "#2E7D32",
                          }}
                        >
                          {isHighRisk ? "🚨 Critical Risk Index" : "🟢 Stable Index"}
                        </span>
                      </div>

                      {/* RISK SCORE DISPLAY */}
                      <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", marginBottom: "1rem" }}>
                        <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "Poppins, sans-serif", color: isHighRisk ? "#D32F2F" : "var(--leaf)" }}>
                          {diag.total}%
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="progress-track" style={{ height: "10px", background: "var(--bg2)", borderRadius: "5px" }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${diag.total}%`,
                                height: "100%",
                                borderRadius: "5px",
                                background: isHighRisk
                                  ? "linear-gradient(90deg, #EF5350, #E53935)"
                                  : "linear-gradient(90deg, var(--leaf), var(--lime))",
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem", display: "block" }}>
                            Continuous calculations based on 5 local municipal metrics
                          </span>
                        </div>
                      </div>

                      {/* DETAILED RISK FACTOR BREAKDOWN */}
                      <div className="grid g3" style={{ background: "var(--bg2)", padding: "0.85rem", borderRadius: "10px", fontSize: "0.78rem", marginBottom: "1rem" }}>
                        <div>
                          <div style={{ color: "var(--muted)" }}>📅 Days Open</div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {activeIssue.daysOpen} days (+{diag.days} pts)
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--muted)" }}>⬆️ Upvotes</div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {activeIssue.upvotes} citizens (+{diag.upvotes} pts)
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--muted)" }}>👥 Local Density</div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {activeIssue.populationDensity.toLocaleString()}/km² (+{diag.density} pts)
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--muted)" }}>⛈️ Weather Forecast</div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {activeIssue.weatherForecast} (+{diag.weather} pts)
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "var(--muted)" }}>🏗️ Contractor rating</div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginTop: "0.15rem" }}>
                            {activeIssue.contractorRating}/100 (+{diag.contractor} pts)
                          </div>
                        </div>
                      </div>

                      {/* HIGH RISK PUSH NOTIFICATION SIMULATOR */}
                      {isHighRisk && (
                        <div
                          style={{
                            background: "#FFF8E1",
                            border: "1px solid #FFE082",
                            color: "#8D6E63",
                            fontSize: "0.78rem",
                            borderRadius: "8px",
                            padding: "0.75rem",
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "flex-start",
                          }}
                        >
                          <i className="fas fa-bell animate-bounce" style={{ color: "#FFB300", marginTop: "0.15rem" }}></i>
                          <div>
                            <strong>Escalation Dispatch Triggered:</strong> Risk index exceeded 80%. Automated physical verification request broadcasted to all active <strong>Green Champions</strong> within a 2km radius!
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                  {/* COMMUNITY VERIFICATION CARD */}
                  <div className="card card-body">
                    <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".85rem" }}>
                      <i className="fas fa-users" style={{ color: "var(--sky)" }}></i> Citizen Crowdsourced Verification
                    </div>
                    <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: ".85rem" }}>
                      Active peer verification network confirms true resolution state:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", fontSize: ".85rem" }}>
                      <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                        <i className="fas fa-xmark" style={{ color: "var(--red-bin)", marginTop: ".15rem", flexShrink: 0 }}></i>
                        <div>
                          <strong>Arnav S.</strong> — "Unfinished. Contractor has left gravel pile on the road."
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                        <i className="fas fa-xmark" style={{ color: "var(--red-bin)", marginTop: ".15rem", flexShrink: 0 }}></i>
                        <div>
                          <strong>Meera K.</strong> — "AI verification failed claim yesterday. Still open and hazardous."
                        </div>
                      </div>
                    </div>
                    <div style={{ background: "#FFEBEE", borderRadius: "10px", padding: ".85rem", marginTop: ".85rem", fontSize: ".82rem", color: "#B71C1C" }}>
                      <i className="fas fa-triangle-exclamation"></i> <strong>SLA Failure Penalty Warning active.</strong> Liquidated damages are being charged daily to {activeIssue.contractorName}.
                    </div>
                  </div>
                </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                Select an active ticket on the left directory to track.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
