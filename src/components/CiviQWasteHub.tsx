import React from "react";

interface CiviQWasteHubProps {
  onNavigate: (tab: string) => void;
  openModal: (type: "rti" | "compost") => void;
  triggerToast: (icon: string, message: string) => void;
  onBuyCompostItem: (name: string, price: number) => void;
}

export function CiviQWasteHub({
  onNavigate,
  openModal,
  triggerToast,
  onBuyCompostItem,
}: CiviQWasteHubProps) {
  return (
    <div className="page active" id="page-waste" style={{ display: "block" }}>
      <div className="page-hero relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 gap-6 rounded-3xl bg-gradient-to-r from-emerald-800 to-green-600 text-white mb-8">
        <div className="flex-1 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            <i className="fas fa-recycle text-[9px]"></i>
            Municipal Ecosystem
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">Smart Waste Hub</h2>
          <p className="text-emerald-100/90 text-sm max-w-lg">
            Complete ward segregation, real-time collection vehicle tracking, premium compost rewards, and localized recycling operations.
          </p>
        </div>
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-xl shadow-emerald-950/20 border border-white/15 shrink-0">
          <img
            src="/src/assets/images/civiq_clean_bin_1782730762819.jpg"
            alt="Eco Waste Segregation"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="section">
        <div className="section-inner">
          <div className="flex flex-col lg:flex-row gap-8 items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-100/30 dark:shadow-none mb-10">
            <div className="flex-1 space-y-4">
              <div className="section-tag inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                <i className="fas fa-trash-can"></i> 3-Bin segregation guide
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                Which bin for what?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Proper waste segregation at source prevents landfills from growing and supports eco-friendly bio-conversion. CiviQ rewards compliant households with credits!
              </p>
            </div>
            <div className="w-full lg:w-1/3 flex justify-center">
              <div className="relative group max-w-[240px]">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <img
                    src="/src/assets/images/civiq_clean_bin_1782730762819.jpg"
                    alt="Charming sorting guide illustration"
                    className="w-full rounded-xl object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Smarter Segregation
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bin-guide" style={{ marginBottom: "2.5rem" }}>
            <div className="bin-card green-bin">
              <div className="bin-emoji">🟢</div>
              <div className="bin-title" style={{ color: "#1B5E20" }}>
                Green bin — Biodegradable
              </div>
              <ul className="bin-items" style={{ color: "#2E7D32" }}>
                <li className="bin-item">Food scraps & peels</li>
                <li className="bin-item">Vegetable waste</li>
                <li className="bin-item">Garden & leaf waste</li>
                <li className="bin-item">Cooked food (no packaging)</li>
                <li className="bin-item">Paper towels & napkins</li>
              </ul>
              <div style={{ marginTop: "1rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => openModal("compost")}>
                  <i className="fas fa-seedling"></i> Compost it!
                </button>
              </div>
            </div>
            <div className="bin-card blue-bin">
              <div className="bin-emoji">🔵</div>
              <div className="bin-title" style={{ color: "#0D47A1" }}>
                Blue bin — Dry & Recyclable
              </div>
              <ul className="bin-items" style={{ color: "#1565C0" }}>
                <li className="bin-item">Paper & cardboard</li>
                <li className="bin-item">Glass bottles & jars</li>
                <li className="bin-item">Plastic containers</li>
                <li className="bin-item">Metal cans & tins</li>
                <li className="bin-item">Old newspapers, magazines</li>
              </ul>
              <div style={{ marginTop: "1rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => triggerToast("🔵", "Recycling pickup scheduled for tomorrow 8am")}>
                  <i className="fas fa-truck"></i> Schedule pickup
                </button>
              </div>
            </div>
            <div className="bin-card red-bin">
              <div className="bin-emoji">🔴</div>
              <div className="bin-title" style={{ color: "#B71C1C" }}>
                Red bin — Non-biodegradable
              </div>
              <ul className="bin-items" style={{ color: "#C62828" }}>
                <li className="bin-item">Medicines & syringes</li>
                <li className="bin-item">Batteries & electronics</li>
                <li className="bin-item">Sanitary waste & diapers</li>
                <li className="bin-item">Chemical containers</li>
                <li className="bin-item">Broken glass & ceramics</li>
              </ul>
              <div style={{ marginTop: "1rem" }}>
                <button className="btn btn-outline btn-sm" onClick={() => onNavigate("map")}>
                  <i className="fas fa-map-pin"></i> Find drop-off
                </button>
              </div>
            </div>
          </div>

          <div className="grid g2">
            <div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".85rem" }}>
                <i className="fas fa-truck" style={{ color: "var(--amber)" }}></i> Live vehicle tracking
              </h3>
              <div style={{ marginBottom: "1.25rem" }}>
                <div className="vehicle-row">
                  <span className="vehicle-indicator v-active"></span>
                  <span style={{ fontSize: "1.25rem" }}>🚛</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".85rem" }}>WV-3 — Malviya Nagar route</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>ETA to your street: 22 min</div>
                  </div>
                  <span className="badge badge-progress">On route</span>
                </div>
                <div className="vehicle-row">
                  <span className="vehicle-indicator v-done"></span>
                  <span style={{ fontSize: "1.25rem" }}>🚛</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".85rem" }}>WV-7 — Tonk Road sector</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>Collection complete today</div>
                  </div>
                  <span className="badge badge-resolved">Done</span>
                </div>
                <div className="vehicle-row">
                  <span className="vehicle-indicator v-active"></span>
                  <span style={{ fontSize: "1.25rem" }}>🚛</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: ".85rem" }}>WV-1 — Vaishali Nagar</div>
                    <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>ETA: 45 min</div>
                  </div>
                  <span className="badge badge-progress">On route</span>
                </div>
              </div>

              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".85rem" }}>
                <i className="fas fa-award" style={{ color: "var(--amber)" }}></i> Incentives & penalties
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
                <div className="reward-alert">
                  <strong style={{ color: "#1B5E20" }}>✅ Segregating correctly:</strong> +20 XP per pickup + ₹50 monthly rebate
                </div>
                <div className="warn-card">
                  <strong style={{ color: "#78350F" }}>⚠️ First violation:</strong> Warning + civic learning module assigned
                </div>
                <div className="penalty-card">
                  <strong style={{ color: "#B71C1C" }}>❌ Repeat offence:</strong> ₹500 fine − 100 XP + public notice
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".85rem" }}>
                <i className="fas fa-shop" style={{ color: "var(--leaf)" }}></i> Compost kit shop
              </h3>
              <div className="grid g2" style={{ marginBottom: "1.25rem" }}>
                <div className="shop-card">
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🪣</div>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Home compost bin</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", margin: ".3rem 0" }}>5L capacity</div>
                  <div style={{ color: "var(--leaf)", fontWeight: 700, fontSize: ".85rem" }}>Free with 300 XP</div>
                  <button
                    className="btn btn-green btn-sm"
                    style={{ width: "100%", justifyContent: "center", marginTop: ".6rem" }}
                    onClick={() => onBuyCompostItem("Home compost bin", 300)}
                  >
                    Redeem
                  </button>
                </div>
                <div className="shop-card">
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🌱</div>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Vermi-compost kit</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", margin: ".3rem 0" }}>With worms</div>
                  <div style={{ color: "var(--leaf)", fontWeight: 700, fontSize: ".85rem" }}>₹299 or 400 XP</div>
                  <button
                    className="btn btn-green btn-sm"
                    style={{ width: "100%", justifyContent: "center", marginTop: ".6rem" }}
                    onClick={() => onBuyCompostItem("Vermi-compost kit", 400)}
                  >
                    Redeem
                  </button>
                </div>
                <div className="shop-card">
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🧴</div>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Liquid waste converter</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", margin: ".3rem 0" }}>1L kit</div>
                  <div style={{ color: "var(--leaf)", fontWeight: 700, fontSize: ".85rem" }}>₹199 or 250 XP</div>
                  <button
                    className="btn btn-green btn-sm"
                    style={{ width: "100%", justifyContent: "center", marginTop: ".6rem" }}
                    onClick={() => onBuyCompostItem("Liquid waste converter", 250)}
                  >
                    Redeem
                  </button>
                </div>
                <div className="shop-card">
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📦</div>
                  <div style={{ fontWeight: 600, fontSize: ".85rem" }}>Starter 3-bin set</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", margin: ".3rem 0" }}>All 3 colours</div>
                  <div style={{ color: "var(--amber)", fontWeight: 700, fontSize: ".85rem" }}>₹599 or 700 XP</div>
                  <button
                    className="btn btn-amber btn-sm"
                    style={{ width: "100%", justifyContent: "center", marginTop: ".6rem" }}
                    onClick={() => onBuyCompostItem("Starter 3-bin set", 700)}
                  >
                    Best value
                  </button>
                </div>
              </div>

              <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".85rem" }}>
                <i className="fas fa-bolt" style={{ color: "#7C3AED" }}></i> Waste-to-Energy network
              </h3>
              <div className="card card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", fontSize: ".85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: ".6rem", background: "var(--bg2)", borderRadius: "8px" }}>
                    <span>
                      <i className="fas fa-recycle" style={{ color: "var(--leaf)" }}></i> Recycling plants
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--leaf)" }}>3 active nearby</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: ".6rem", background: "var(--bg2)", borderRadius: "8px" }}>
                    <span>
                      <i className="fas fa-plug" style={{ color: "#7C3AED" }}></i> e-Scrap dealers
                    </span>
                    <span style={{ fontWeight: 700, color: "#7C3AED" }}>7 registered</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: ".6rem", background: "var(--bg2)", borderRadius: "8px" }}>
                    <span>
                      <i className="fas fa-bolt" style={{ color: "var(--amber)" }}></i> W2E plants
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--amber)" }}>1 operational</span>
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: ".85rem" }}
                  onClick={() => onNavigate("map")}
                >
                  <i className="fas fa-map-pin"></i> View on map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
