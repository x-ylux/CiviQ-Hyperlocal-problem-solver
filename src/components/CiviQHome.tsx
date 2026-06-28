import React from "react";

interface CiviQHomeProps {
  onNavigate: (tab: string) => void;
}

export function CiviQHome({ onNavigate }: CiviQHomeProps) {
  return (
    <div className="page active" id="page-home" style={{ display: "block" }}>
      <div className="hero">
        <div className="hero-bg-circles">
          <div className="hero-circle" style={{ width: "600px", height: "600px", top: "-200px", left: "-150px" }}></div>
          <div className="hero-circle" style={{ width: "400px", height: "400px", bottom: "-100px", right: "-100px" }}></div>
          <div className="hero-circle" style={{ width: "200px", height: "200px", top: "60%", left: "30%" }}></div>
        </div>
        <div className="hero-content">
          <div className="hero-tag">
            <i className="fas fa-robot"></i> AI-Powered Civic Platform
          </div>
          <h1>
            Clean Cities,
            <br />
            <span>Smarter Citizens</span>
          </h1>
          <p>
            Report. Verify. Track. Resolve. Together we build cleaner, greener communities — powered by AI, driven by
            you.
          </p>
          <div className="hero-actions">
            <button className="btn-hero btn-hero-primary" onClick={() => onNavigate("report")}>
              <i className="fas fa-camera"></i> Report an Issue
            </button>
            <button className="btn-hero btn-hero-secondary" onClick={() => onNavigate("games")}>
              <i className="fas fa-gamepad"></i> Play & Learn
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">8,341</div>
              <div className="hero-stat-label">Citizens engaged</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">1,084</div>
              <div className="hero-stat-label">Issues resolved</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">247</div>
              <div className="hero-stat-label">Active reports</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">4.2d</div>
              <div className="hero-stat-label">Avg resolution</div>
            </div>
          </div>
        </div>
        <div className="scroll-cue" onClick={() => onNavigate("dashboard")} style={{ cursor: "pointer" }}>
          <i className="fas fa-chevron-down"></i>
          <span>Explore</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section" style={{ background: "white" }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-route"></i> How it works
            </div>
            <h2 className="section-title">From photo to fix in 4 steps</h2>
            <p className="section-sub">AI guides every step — from spotting the issue to crowdsourced verification of the fix.</p>
          </div>
          <div className="grid g4">
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#E8F5E9,#C8E6C9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                📷
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>Snap & report</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Take a photo or video. GPS auto-tags location. AI verifies it's a real issue.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#EDE7F6,#D1C4E9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                🤖
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>AI categorizes</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                AI assigns category, checks duplicates within 15m, and routes to the right authority.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                👥
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>
                Community verifies
              </div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Nearby citizens confirm the fix is real. Fake closures are rejected automatically.
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#FFEBEE,#FFCDD2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  margin: "0 auto 1rem",
                }}
              >
                🏆
              </div>
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", marginBottom: ".4rem" }}>Earn credits</div>
              <div style={{ fontSize: ".82rem", color: "var(--muted)", lineHeight: 1.6 }}>
                Every action earns Civic Credits redeemable for utility discounts, free bus passes & more.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3R SECTION */}
      <div className="section" style={{ background: "var(--bg)" }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-recycle"></i> The 3R principle
            </div>
            <h2 className="section-title">Reduce · Reuse · Recycle</h2>
            <p className="section-sub">
              Our platform is built around the 3R philosophy. Every action on CivicAI maps to one of these pillars.
            </p>
          </div>
          <div className="grid g3">
            <div
              style={{
                background: "linear-gradient(135deg,#E3F2FD,#BBDEFB)",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid #90CAF9",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>♻️</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#0D47A1", marginBottom: ".5rem" }}>Reduce</h3>
              <p style={{ fontSize: ".85rem", color: "#1565C0", lineHeight: 1.6 }}>
                AI predicts waste hotspots before they form. Proactive prevention over reactive cleanup.
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid #FCD34D",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🔄</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#78350F", marginBottom: ".5rem" }}>Reuse</h3>
              <p style={{ fontSize: ".85rem", color: "#92400E", lineHeight: 1.6 }}>
                Connect citizens with e-scrap dealers, compost kits, and material exchange programs.
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg,#E8F5E9,#C8E6C9)",
                borderRadius: "var(--radius)",
                padding: "2rem",
                textAlign: "center",
                border: "1px solid #A5D6A7",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🌱</div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", color: "#1B5E20", marginBottom: ".5rem" }}>Recycle</h3>
              <p style={{ fontSize: ".85rem", color: "#2E7D32", lineHeight: 1.6 }}>
                Track recycling pickups live. Earn XP for segregation. Map nearest recycling plants.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI ROLES */}
      <div className="section" style={{ background: "white" }}>
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">
              <i className="fas fa-brain"></i> AI at the core
            </div>
            <h2 className="section-title">8 AI engines powering this platform</h2>
          </div>
          <div className="grid g4">
            {[
              { emoji: "🖼️", title: "Image Verifier", desc: "Detects spam, fake reports & invalid photos" },
              { emoji: "🏷️", title: "Issue Categorizer", desc: "Classifies issue type from image + description" },
              { emoji: "🔍", title: "Duplicate Detector", desc: "Merges reports within 15m radius" },
              { emoji: "💬", title: "Civic Assistant", desc: "24/7 AI chat for guidance & RTI help" },
              { emoji: "📊", title: "Insight Engine", desc: "Predicts issues before they spike" },
              { emoji: "📋", title: "RTI Generator", desc: "Auto-drafts legal notices for SLA breaches" },
              { emoji: "🗑️", title: "Bin Identifier", desc: "Photo → tells which bin it belongs in" },
              { emoji: "📣", title: "Campaign Recommender", desc: "Matches you to campaigns by location & interest" },
            ].map((role, idx) => (
              <div key={idx} className="card card-body" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: ".6rem" }}>{role.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: ".88rem", fontFamily: "Poppins, sans-serif", marginBottom: ".3rem" }}>
                  {role.title}
                </div>
                <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{role.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
