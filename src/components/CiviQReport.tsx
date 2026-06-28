import React from "react";

interface CiviQReportProps {
  onNavigate: (tab: string) => void;
  reportStep: number;
  setReportStep: (step: number) => void;
  selectedCat: string;
  setSelectedCat: (cat: string) => void;
  onReportSubmit: () => void;
  onResetReport: () => void;
  openModal: (type: "rti" | "compost") => void;
}

export function CiviQReport({
  onNavigate,
  reportStep,
  setReportStep,
  selectedCat,
  setSelectedCat,
  onReportSubmit,
  onResetReport,
  openModal,
}: CiviQReportProps) {
  return (
    <div className="page active" id="page-report" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-camera"></i> Report an Issue
        </h2>
        <p>AI-verified · GPS auto-tagged · Earn 150 XP for your first report</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div>
              <div className="steps" id="reportSteps">
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 1 ? "active" : reportStep > 1 ? "done" : ""}`}>1</div>
                  <div className={`step-line ${reportStep > 1 ? "done" : ""}`}></div>
                </div>
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 2 ? "active" : reportStep > 2 ? "done" : ""}`}>2</div>
                  <div className={`step-line ${reportStep > 2 ? "done" : ""}`}></div>
                </div>
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 3 ? "active" : reportStep > 3 ? "done" : ""}`}>3</div>
                  <div className={`step-line ${reportStep > 3 ? "done" : ""}`} style={{ display: "none" }}></div>
                </div>
                <div className="step-item" style={{ flex: 0 }}>
                  <div className={`step-circle ${reportStep === 4 ? "active" : ""}`}>4</div>
                </div>
              </div>

              {/* STEP 1 */}
              <div className={`form-step ${reportStep === 1 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".35rem" }}>
                  Upload photo or video
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  AI auto-verifies and checks for duplicates within 15m radius
                </div>
                <div className="upload-zone" onClick={() => setReportStep(2)}>
                  <div className="upload-icon">
                    <i className="fas fa-camera-retro"></i>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: ".95rem", marginBottom: ".3rem" }}>Tap to capture or upload</div>
                  <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>Supports JPG, PNG, MP4 · GPS auto-tagged</div>
                </div>
                <div className="ai-verify" style={{ marginTop: ".85rem" }}>
                  <div className="ai-verify-icon">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div>
                    <strong>AI Image Verification</strong> — detects spam, near-duplicates, and invalid reports. XP awarded only
                    for genuine issues.
                  </div>
                </div>
                <button
                  className="btn btn-green"
                  style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}
                  onClick={() => setReportStep(2)}
                >
                  <i className="fas fa-arrow-right"></i> Continue
                </button>
              </div>

              {/* STEP 2 */}
              <div className={`form-step ${reportStep === 2 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".25rem" }}>
                  Select category
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: ".5rem" }}>
                  AI suggests from your image — confirm or change
                </div>
                <div className="cat-grid" id="catGrid">
                  {["Roads", "Water", "Waste", "Lights", "Parks", "Build", "Power", "Traffic"].map((catName, idx) => {
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
                    return (
                      <div
                        key={idx}
                        className={`cat-btn ${selectedCat === catName ? "sel" : ""}`}
                        onClick={() => setSelectedCat(catName)}
                      >
                        <span className="cat-icon">{emojis[catName]}</span>
                        {catName}
                      </div>
                    );
                  })}
                </div>
                <div className="badge badge-ai" style={{ marginBottom: ".85rem" }}>
                  <i className="fas fa-robot"></i> AI suggests: Roads & Potholes — 94% confidence
                </div>
                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button className="btn btn-ghost" onClick={() => setReportStep(1)}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={() => setReportStep(3)}>
                    <i className="fas fa-arrow-right"></i> Continue
                  </button>
                </div>
              </div>

              {/* STEP 3 */}
              <div className={`form-step ${reportStep === 3 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".25rem" }}>
                  Confirm location
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: ".75rem" }}>
                  GPS auto-tagged from your photo
                </div>
                <div
                  style={{
                    background: "var(--bg2)",
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: ".85rem",
                    display: "flex",
                    gap: ".75rem",
                    alignItems: "center",
                  }}
                >
                  <i className="fas fa-location-dot" style={{ fontSize: "1.3rem", color: "var(--leaf)" }}></i>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--forest)" }}>Rajouri Garden, Sector 5</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>28.6648°N, 77.1167°E · Auto-tagged</div>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Description (optional)</label>
                  <textarea className="form-input" placeholder="Describe the issue in your own words..."></textarea>
                </div>
                <div className="ai-verify">
                  <div className="ai-verify-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <div>
                    <strong>Smart de-duplication:</strong> No existing report within 15m. New issue will be created.
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".75rem", marginTop: ".85rem" }}>
                  <button className="btn btn-ghost" onClick={() => setReportStep(2)}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={onReportSubmit}>
                    <i className="fas fa-paper-plane"></i> Submit Report
                  </button>
                </div>
              </div>

              {/* STEP 4 (Success) */}
              <div className={`form-step ${reportStep === 4 ? "active" : ""}`}>
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.4rem", marginBottom: ".5rem" }}>
                    Report submitted!
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: ".88rem", marginBottom: "1.5rem" }}>
                    Ticket #1089 · AI-verified · GPS tagged · Assigned to Ward Engineer
                  </p>
                  <div
                    style={{
                      background: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
                      borderRadius: "14px",
                      padding: "1.25rem",
                      display: "flex",
                      gap: ".85rem",
                      alignItems: "center",
                      textAlign: "left",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ fontSize: "2rem" }}>⭐</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#78350F", fontFamily: "Poppins, sans-serif" }}>
                        +150 Civic Credits earned!
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#92400E" }}>First report bonus — You're now Silver Citizen</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
                    <button className="btn btn-ghost" onClick={() => onNavigate("track")}>
                      <i className="fas fa-timeline"></i> Track issue
                    </button>
                    <button className="btn btn-green" onClick={onResetReport}>
                      <i className="fas fa-house"></i> Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card card-body">
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: ".9rem",
                    marginBottom: ".85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <i className="fas fa-star" style={{ color: "var(--amber)" }}></i> XP for every action
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", fontSize: ".82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Photo report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +50 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Video report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +80 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Verify a fix</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +30 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Issue resolved</span>
                    <span className="badge" style={{ background: "#E8F5E9", color: "#2E7D32" }}>
                      +100 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>First report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +150 XP
                    </span>
                  </div>
                </div>
              </div>
              <div className="rti-banner" onClick={() => openModal("rti")}>
                <div className="rti-icon">
                  <i className="fas fa-file-contract"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#BF360C", fontFamily: "Poppins, sans-serif" }}>
                    1-Click RTI Generation
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#E64A19" }}>Auto-draft RTI if SLA is missed</div>
                </div>
                <i className="fas fa-chevron-right" style={{ marginLeft: "auto", color: "#E64A19", fontSize: ".8rem" }}></i>
              </div>
              <div className="card card-body">
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".75rem" }}>
                  <i className="fas fa-brain" style={{ color: "#7C3AED" }}></i> AI roles in this step
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", fontSize: ".78rem", color: "var(--muted)" }}>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Image spam detection
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Category prediction
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> 15m duplicate check
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> GPS verification
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Authority routing
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
