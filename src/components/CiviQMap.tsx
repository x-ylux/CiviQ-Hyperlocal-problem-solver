import React from "react";

interface CiviQMapProps {
  triggerToast: (icon: string, message: string) => void;
}

export function CiviQMap({ triggerToast }: CiviQMapProps) {
  return (
    <div className="page active" id="page-map" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-map-location-dot"></i> Live Issue Map
        </h2>
        <p>247 active issues · 8 waste vehicles tracked · Recycling plants & e-scrap shops</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="card" style={{ overflow: "hidden", marginBottom: "1.5rem" }}>
            <div
              style={{
                padding: ".85rem 1.25rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: ".75rem",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: ".9rem" }}>Jaipur City — Live</span>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--lime)",
                  animation: "blink 1.5s infinite",
                  display: "inline-block",
                }}
              ></span>
              <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>247 active · 8 vehicles</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => triggerToast("🔍", "Filtering Map layer...")}>
                  <i className="fas fa-filter"></i> Filters
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => triggerToast("♻️", "Recycling plants highlighted on Jaipur map")}>
                  <i className="fas fa-recycle"></i> Plants
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => triggerToast("🔌", "e-Scrap dealers highlighted")}>
                  <i className="fas fa-plug"></i> e-Scrap
                </button>
              </div>
            </div>
            <div style={{ background: "linear-gradient(160deg,#C8E6C9 0%,#A5D6A7 40%,#81C784 70%,#C8E6C9 100%)", height: "380px", position: "relative", overflow: "hidden" }}>
              <svg width="100%" height="100%" viewBox="0 0 800 380" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(27,94,32,.1)" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="800" height="380" fill="url(#mapgrid)" />
                {/* Roads */}
                <path d="M 0,190 Q200,180 400,190 Q600,200 800,185" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="4" />
                <path d="M 0,100 Q250,90 500,105 Q650,115 800,100" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
                <path d="M 0,300 Q300,285 600,300 Q720,308 800,295" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
                <path d="M 200,0 Q190,120 205,240 Q215,320 200,380" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
                <path d="M 500,0 Q490,120 505,240 Q515,320 500,380" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
                
                {/* Pins */}
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("🕳️", "Pothole Cluster — 3 merged reports. Priority: Critical")}>
                  <circle cx="140" cy="230" r="18" fill="rgba(229,57,53,.18)" stroke="#E53935" strokeWidth="2" />
                  <circle cx="140" cy="230" r="8" fill="#E53935" />
                  <text x="140" y="258" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="#B71C1C" fontWeight="600">Pothole x3</text>
                </g>

                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("💧", "Contaminated water leak. Priority: High")}>
                  <circle cx="280" cy="130" r="14" fill="rgba(2,136,209,.15)" stroke="#0288D1" strokeWidth="2" />
                  <circle cx="280" cy="130" r="6" fill="#0288D1" />
                  <text x="280" y="153" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="#01579B" fontWeight="600">Water leak</text>
                </g>

                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("🗑️", "Illegal dumping report. Priority: Medium")}>
                  <circle cx="520" cy="160" r="12" fill="rgba(245,158,11,.15)" stroke="#F59E0B" strokeWidth="2" />
                  <circle cx="520" cy="160" r="6" fill="#F59E0B" />
                  <text x="520" y="181" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="#78350F" fontWeight="600">Dumping</text>
                </g>

                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("✅", "Issue Resolved and verified by community!")}>
                  <circle cx="650" cy="260" r="12" fill="rgba(67,160,71,.2)" stroke="#43A047" strokeWidth="2" />
                  <circle cx="650" cy="260" r="6" fill="#43A047" />
                  <text x="650" y="281" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="#1B5E20" fontWeight="600">Resolved ✓</text>
                </g>

                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("💡", "Broken street light report")}>
                  <circle cx="380" cy="80" r="12" fill="rgba(216,90,48,.15)" stroke="#D84315" strokeWidth="2" />
                  <circle cx="380" cy="80" r="6" fill="#D84315" />
                  <text x="380" y="101" textAnchor="middle" fontSize="11" fontFamily="Inter, sans-serif" fill="#BF360C" fontWeight="600">Broken light</text>
                </g>

                {/* Trucks */}
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("🚛", "WV-3 Live Location: ETA 22 min to Malviya Nagar")}>
                  <rect x="210" y="215" width="28" height="28" rx="14" fill="#F59E0B" stroke="white" strokeWidth="2" />
                  <text x="224" y="232" textAnchor="middle" fontSize="14">🚛</text>
                  <text x="224" y="253" textAnchor="middle" fontSize="10" fill="#78350F" fontWeight="600">WV-3</text>
                </g>
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("🚛", "WV-7 Live Location: Collection completed in Tonk Road sector")}>
                  <rect x="560" y="115" width="28" height="28" rx="14" fill="#F59E0B" stroke="white" strokeWidth="2" />
                  <text x="574" y="132" textAnchor="middle" fontSize="14">🚛</text>
                  <text x="574" y="153" textAnchor="middle" fontSize="10" fill="#78350F" fontWeight="600">WV-7</text>
                </g>

                {/* Facilities */}
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("♻️", "GreenCycle Malviya Nagar: Open 9am - 6pm. Segregated waste drops earn +50 credits")}>
                  <rect x="60" y="150" width="32" height="32" rx="8" fill="rgba(46,125,50,.85)" stroke="white" strokeWidth="2" />
                  <text x="76" y="170" textAnchor="middle" fontSize="16">♻️</text>
                  <text x="76" y="193" textAnchor="middle" fontSize="10" fill="#1B5E20" fontWeight="600">Recycle</text>
                </g>
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("🔌", "e-Scrap Dealer: Turn in defunct routers or cables for credit")}>
                  <rect x="700" y="60" width="32" height="32" rx="8" fill="rgba(74,58,167,.85)" stroke="white" strokeWidth="2" />
                  <text x="716" y="80" textAnchor="middle" fontSize="16">🔌</text>
                  <text x="716" y="103" textAnchor="middle" fontSize="10" fill="#311B92" fontWeight="600">e-Scrap</text>
                </g>
                <g style={{ cursor: "pointer" }} onClick={() => triggerToast("⚡", "Waste-to-Energy operational plant")}>
                  <rect x="430" y="290" width="32" height="32" rx="8" fill="rgba(245,158,11,.85)" stroke="white" strokeWidth="2" />
                  <text x="446" y="310" textAnchor="middle" fontSize="16">⚡</text>
                  <text x="446" y="333" textAnchor="middle" fontSize="10" fill="#78350F" fontWeight="600">W2E Plant</text>
                </g>

                <text x="400" y="200" textAnchor="middle" fontSize="13" fill="rgba(27,94,32,.35)" fontWeight="700" fontFamily="Poppins, sans-serif">JAIPUR</text>
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: ".85rem",
                padding: ".85rem 1.25rem",
                background: "white",
                borderTop: "1px solid var(--border)",
                fontSize: ".75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--red-bin)", display: "inline-block" }}></span> Critical
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--sky)", display: "inline-block" }}></span> Water
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--amber)", display: "inline-block" }}></span> Medium
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--green-bin)", display: "inline-block" }}></span> Resolved
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "4px", background: "var(--amber)", display: "inline-block" }}></span> Waste vehicle (live)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "4px", background: "var(--leaf)", display: "inline-block" }}></span> Recycling facility
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
