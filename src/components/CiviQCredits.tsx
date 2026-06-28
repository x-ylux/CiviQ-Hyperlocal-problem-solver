import React from "react";

interface CiviQCreditsProps {
  credits: number;
  onNavigate: (tab: string) => void;
  triggerToast: (icon: string, message: string) => void;
  onRedeemReward: (msg: string, cost: number) => void;
  onStartCivicLearning: (title: string, xp: number) => void;
  setGameTab: (tab: "sort" | "quiz" | "speed") => void;
}

export function CiviQCredits({
  credits,
  onNavigate,
  triggerToast,
  onRedeemReward,
  onStartCivicLearning,
  setGameTab,
}: CiviQCreditsProps) {
  return (
    <div className="page active" id="page-gamify" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-trophy"></i> Civic Credits
        </h2>
        <p>Your impact, quantified. Earn, redeem, and rise through the ranks.</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="grid g2" style={{ marginBottom: "1.5rem" }}>
            <div className="xp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,.6)", fontWeight: 500, letterSpacing: ".05em", marginBottom: ".25rem" }}>YOUR RANK</div>
                  <div className="xp-rank">🥈 Silver Citizen</div>
                  <div style={{ fontSize: ".88rem", opacity: 0.8, marginTop: ".15rem" }}>Priya Malhotra</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "2.4rem", fontWeight: 800, fontFamily: "Poppins, sans-serif", color: "#CCFF90" }}>
                    {credits.toLocaleString()}
                  </div>
                  <div style={{ fontSize: ".75rem", opacity: 0.7 }}>Civic Credits</div>
                </div>
              </div>
              <div className="xp-level-bar">
                <div className="xp-level-fill" style={{ width: `${Math.min(100, (credits / 3500) * 100)}%` }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".72rem", opacity: 0.7, marginBottom: "1rem" }}>
                <span>Silver</span>
                <span>{credits} / 3,500 → Gold</span>
              </div>
              <div className="badge-grid">
                <div className="badge-item" title="First Reporter">🌱</div>
                <div className="badge-item" title="5 Issues Reported">📍</div>
                <div className="badge-item" title="Verifier">✅</div>
                <div className="badge-item" title="Green Champion">🏆</div>
                <div className={`badge-item ${credits < 3000 ? "locked" : ""}`} title="RTI Hero">⚖️</div>
                <div className={`badge-item ${credits < 3500 ? "locked" : ""}`} title="City Guardian">🛡️</div>
                <div className={`badge-item ${credits < 4000 ? "locked" : ""}`} title="Master Civic">👑</div>
              </div>
            </div>

            <div className="card card-body">
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: "1rem" }}>
                Redeem your credits
              </div>
              <div className="grid g2">
                <div className="reward-card" onClick={() => onRedeemReward("10% utility bill discount applied! Saving ₹240 this month.", 500)}>
                  <div className="reward-emoji">💡</div>
                  <div style={{ fontWeight: 600, fontSize: ".82rem" }}>10% utility bill</div>
                  <div className="reward-pts">500 credits</div>
                </div>
                <div className="reward-card" onClick={() => onRedeemReward("Free bus pass for July applied to your account!", 800)}>
                  <div className="reward-emoji">🚌</div>
                  <div style={{ fontWeight: 600, fontSize: ".82rem" }}>Free bus pass</div>
                  <div className="reward-pts">800 credits</div>
                </div>
                <div
                  className="reward-card"
                  onClick={() => {
                    onNavigate("waste");
                    triggerToast("🌱", "Choose a compost kit to redeem your credits!");
                  }}
                >
                  <div className="reward-emoji">🌱</div>
                  <div style={{ fontWeight: 600, fontSize: ".82rem" }}>Free compost kit</div>
                  <div className="reward-pts">300 credits</div>
                </div>
                <div className="reward-card" onClick={() => onRedeemReward("Civic training certificate queued for download!", 200)}>
                  <div className="reward-emoji">🎓</div>
                  <div style={{ fontWeight: 600, fontSize: ".82rem" }}>Civic certificate</div>
                  <div className="reward-pts">200 credits</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid g2">
            <div className="card card-body">
              <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".85rem" }}>
                <i className="fas fa-chart-bar" style={{ color: "var(--amber)" }}></i> Ward leaderboard
              </div>
              <div className="lb-row">
                <div className="lb-rank" style={{ color: "var(--amber)", fontSize: "1rem" }}>🥇</div>
                <div className="lb-avatar" style={{ background: "#FEF3C7", color: "#78350F" }}>RK</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Rajan Kumar</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>🌿 Green Champion · Ward 7</div>
                </div>
                <div className="lb-xp">4,210</div>
              </div>
              <div className="lb-row">
                <div className="lb-rank" style={{ color: "var(--muted)" }}>🥈</div>
                <div className="lb-avatar" style={{ background: "#E3F2FD", color: "#1565C0" }}>PM</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Priya Malhotra</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>📍 Active reporter</div>
                </div>
                <div className="lb-xp">{credits}</div>
              </div>
              <div className="lb-row">
                <div className="lb-rank" style={{ color: "var(--muted)" }}>🥉</div>
                <div className="lb-avatar" style={{ background: "#EDE7F6", color: "#4527A0" }}>AS</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Arnav Shah</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>✅ Top verifier</div>
                </div>
                <div className="lb-xp">2,190</div>
              </div>
              <div className="lb-row">
                <div className="lb-rank">4</div>
                <div className="lb-avatar" style={{ background: "#E8F5E9", color: "#1B5E20" }}>MR</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Meera Rao</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>📋 RTI generator</div>
                </div>
                <div className="lb-xp">1,840</div>
              </div>
              <div className="lb-row" style={{ borderBottom: "none" }}>
                <div className="lb-rank">5</div>
                <div className="lb-avatar" style={{ background: "#FCE4EC", color: "#880E4F" }}>VT</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Vijay Tiwari</div>
                  <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>🌱 Newcomer</div>
                </div>
                <div className="lb-xp">920</div>
              </div>
            </div>

            <div>
              <div className="champion-banner" style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "2.5rem" }}>🌿</div>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".95rem", marginBottom: ".25rem" }}>
                    Green Champions program
                  </div>
                  <div style={{ fontSize: ".8rem", opacity: 0.8, lineHeight: 1.5 }}>
                    Reach 3,500 XP for early access to city data, a direct ward officer line, and a special Green Champion badge.
                  </div>
                  <div style={{ marginTop: ".75rem", background: "rgba(255,255,255,.15)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                    <div
                      style={{
                        background: "linear-gradient(90deg,#69F0AE,#CCFF90)",
                        height: "100%",
                        width: `${Math.min(100, (credits / 3500) * 100)}%`,
                        borderRadius: "999px",
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: ".72rem", opacity: 0.7, marginTop: ".3rem" }}>{credits} / 3,500 XP</div>
                </div>
              </div>

              <div className="card card-body">
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".85rem" }}>
                  <i className="fas fa-book-open" style={{ color: "var(--sky)" }}></i> Civic learning — earn XP
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                  <div className="learn-card" onClick={() => onStartCivicLearning("How municipal budgets work", 75)}>
                    <div className="learn-icon" style={{ background: "#E8F5E9", color: "var(--leaf)" }}>🏛️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".85rem" }}>How municipal budgets work</div>
                      <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+75 XP · 10 min</div>
                    </div>
                  </div>
                  <div
                    className="learn-card"
                    onClick={() => {
                      setGameTab("sort");
                      onNavigate("games");
                      triggerToast("♻️", "Practice sorting to build AI recognition engines and earn XP!");
                    }}
                  >
                    <div className="learn-icon" style={{ background: "#FEF3C7", color: "var(--amber)" }}>♻️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Waste segregation guide</div>
                      <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+50 XP · 5 min · Interactive</div>
                    </div>
                  </div>
                  <div className="learn-card" onClick={() => onStartCivicLearning("Your RTI rights explained", 100)}>
                    <div className="learn-icon" style={{ background: "#EDE7F6", color: "#7C3AED" }}>⚖️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Your RTI rights explained</div>
                      <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+100 XP · 15 min</div>
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
