import React from "react";

interface CiviQTrackProps {
  openModal: (type: "rti" | "compost") => void;
  triggerToast: (icon: string, message: string) => void;
}

export function CiviQTrack({ openModal, triggerToast }: CiviQTrackProps) {
  return (
    <div className="page active" id="page-track" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-timeline"></i> Track Issue
        </h2>
        <p>Ticket #1042 · AI-escalated · Crowdsourced verification</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div>
              <div className="card card-body" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", gap: ".85rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div
                    className="issue-emoji"
                    style={{
                      background: "#FEF3C7",
                      width: "64px",
                      height: "64px",
                      borderRadius: "14px",
                      fontSize: "2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    🕳️
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: ".35rem" }}>
                      <span className="badge badge-critical">Critical</span>
                      <span className="badge badge-progress">In progress</span>
                    </div>
                    <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                      Pothole cluster — Ward 7
                    </div>
                    <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".2rem" }}>
                      Rajouri Garden Sector 5 · 14 days ago
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--bg2)", borderRadius: "10px", padding: ".85rem", fontSize: ".82rem", marginBottom: ".85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                    <span style={{ color: "var(--muted)" }}>Budget sanctioned</span>
                    <span style={{ fontWeight: 700, color: "var(--leaf)" }}>₹4,20,000</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                    <span style={{ color: "var(--muted)" }}>Contractor</span>
                    <span style={{ fontWeight: 600 }}>UrbanFix Corp</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                    <span style={{ color: "var(--muted)" }}>Assigned officer</span>
                    <span style={{ fontWeight: 600 }}>Dy. Commissioner</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>SLA deadline</span>
                    <span style={{ fontWeight: 700, color: "var(--red-bin)" }}>Overdue by 4 days</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => triggerToast("👥", "Citizen verifiers have confirmed unresolved status")}>
                    <i className="fas fa-users"></i> 38 citizens verified
                  </button>
                  <button className="btn btn-amber btn-sm" onClick={() => openModal("rti")}>
                    <i className="fas fa-file-contract"></i> Generate RTI
                  </button>
                </div>
              </div>

              <div className="card card-body">
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".85rem" }}>
                  <i className="fas fa-users" style={{ color: "var(--sky)" }}></i> Community verification
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: ".85rem" }}>
                  3 nearby citizens asked to verify the "fix" claim
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", fontSize: ".85rem" }}>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                    <i className="fas fa-xmark" style={{ color: "var(--red-bin)", marginTop: ".15rem", flexShrink: 0 }}></i>
                    <div>
                      <strong>Arnav S.</strong> — "Pothole still there, just patched with gravel"
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                    <i className="fas fa-xmark" style={{ color: "var(--red-bin)", marginTop: ".15rem", flexShrink: 0 }}></i>
                    <div>
                      <strong>Meera K.</strong> — "No work done. Barricades removed."
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start" }}>
                    <i className="fas fa-minus" style={{ color: "var(--amber)", marginTop: ".15rem", flexShrink: 0 }}></i>
                    <div>
                      <strong>Ravi T.</strong> — "Partial work but unsafe"
                    </div>
                  </div>
                </div>
                <div style={{ background: "#FFEBEE", borderRadius: "10px", padding: ".85rem", marginTop: ".85rem", fontSize: ".82rem", color: "#B71C1C" }}>
                  <i className="fas fa-triangle-exclamation"></i> <strong>Fake closure detected.</strong> Ticket auto-reopened.
                  Contractor penalty applied.
                </div>
              </div>
            </div>

            <div className="card card-body">
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: "1.25rem" }}>
                <i className="fas fa-clock-rotate-left" style={{ color: "var(--leaf)" }}></i> Issue timeline
              </div>
              <div className="timeline">
                <div className="tl-item">
                  <div className="tl-dot done"></div>
                  <div className="tl-card">
                    <div className="tl-label">Report submitted</div>
                    <div className="tl-sub">Day 0 — AI verified, GPS tagged, XP awarded</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot done"></div>
                  <div className="tl-card">
                    <div className="tl-label">2 similar reports merged</div>
                    <div className="tl-sub">Day 1 — De-duplication within 15m radius</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot done"></div>
                  <div className="tl-card">
                    <div className="tl-label">Assigned to Junior Engineer</div>
                    <div className="tl-sub">Day 2 — Ward office notified</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot done"></div>
                  <div className="tl-card">
                    <div className="tl-label">SLA breach — auto-escalated</div>
                    <div className="tl-sub">Day 10 — Routed to Executive Engineer</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot done"></div>
                  <div className="tl-card">
                    <div className="tl-label">2nd breach — escalated again</div>
                    <div className="tl-sub">Day 14 — Deputy Commissioner assigned</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot active"></div>
                  <div className="tl-card" style={{ borderLeft: "2px solid var(--amber)" }}>
                    <div className="tl-label">Fake closure rejected ⚠️</div>
                    <div className="tl-sub">Day 14 — Crowdsourced verification failed. Reopened.</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot pending"></div>
                  <div className="tl-card" style={{ opacity: 0.5 }}>
                    <div className="tl-label">Fix confirmed by citizens</div>
                    <div className="tl-sub">Pending</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot pending"></div>
                  <div className="tl-card" style={{ opacity: 0.5 }}>
                    <div className="tl-label">Ticket closed</div>
                    <div className="tl-sub">Pending</div>
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
