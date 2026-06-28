import React from "react";

interface CiviQDashboardProps {
  onNavigate: (tab: string) => void;
  openModal: (type: "rti" | "compost") => void;
  triggerToast: (icon: string, message: string) => void;
}

const priorityIssues = [
  {
    title: "Pothole cluster - 3 merged reports",
    address: "Rajouri Garden, Sector 5",
    status: "Critical",
    meta: "143 votes | 38 verified | 14d open",
    icon: "fa-road",
    tone: "critical",
  },
  {
    title: "Contaminated water leak near school",
    address: "Pitampura, Block A",
    status: "High",
    meta: "89 votes | 14 verified | 6d open",
    icon: "fa-droplet",
    tone: "water",
  },
  {
    title: "Illegal dumping near residential park",
    address: "Dwarka Sector 12",
    status: "Open",
    meta: "52 votes | 7 verified | 2d open",
    icon: "fa-trash-can",
    tone: "waste",
  },
];

const categoryProgress = [
  { label: "Roads & potholes", value: 78, className: "roads" },
  { label: "Water supply", value: 62, className: "water" },
  { label: "Waste & sanitation", value: 84, className: "waste" },
  { label: "Street lighting", value: 91, className: "lights" },
  { label: "Parks & green cover", value: 55, className: "parks" },
];

export function CiviQDashboard({ onNavigate, openModal, triggerToast }: CiviQDashboardProps) {
  return (
    <div className="page active dashboard-page" id="page-dashboard" style={{ display: "block" }}>
      <section className="dashboard-hero">
        <div className="dashboard-hero-photo" aria-hidden="true"></div>
        <div className="dashboard-hero-content">
          <span className="dashboard-eyebrow">
            <i className="fas fa-satellite-dish"></i> Live municipal operations
          </span>
          <h2>Community Dashboard</h2>
          <p>Track open civic issues, response times, green impact, and contractor accountability in one command view.</p>
          <div className="dashboard-hero-actions">
            <button className="btn btn-green" onClick={() => onNavigate("report")}>
              <i className="fas fa-plus"></i> New report
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate("map")}>
              <i className="fas fa-map-location-dot"></i> Open map
            </button>
          </div>
        </div>
      </section>

      <div className="section dashboard-section">
        <div className="section-inner dashboard-grid-shell">
          <div className="sla-alert dashboard-sla">
            <i className="fas fa-triangle-exclamation"></i>
            <div>
              <strong>SLA breach:</strong> Ward 7 pothole, Report #1042, ignored for 14 days and escalated to Dy.
              Commissioner.
              <button type="button" onClick={() => openModal("rti")}>
                Generate RTI
              </button>
            </div>
          </div>

          <div className="dashboard-metrics">
            <div className="metric red">
              <div className="metric-icon"><i className="fas fa-circle-exclamation"></i></div>
              <div className="metric-value">247</div>
              <div className="metric-label">Open issues</div>
              <span className="metric-delta delta-down"><i className="fas fa-arrow-up"></i> 12 this week</span>
            </div>
            <div className="metric green">
              <div className="metric-icon"><i className="fas fa-circle-check"></i></div>
              <div className="metric-value">1,084</div>
              <div className="metric-label">Resolved in 30 days</div>
              <span className="metric-delta delta-up"><i className="fas fa-arrow-up"></i> 23% better</span>
            </div>
            <div className="metric blue">
              <div className="metric-icon"><i className="fas fa-users"></i></div>
              <div className="metric-value">8,341</div>
              <div className="metric-label">Citizens engaged</div>
              <span className="metric-delta delta-up"><i className="fas fa-arrow-up"></i> 340 new</span>
            </div>
            <div className="metric amber">
              <div className="metric-icon"><i className="fas fa-clock"></i></div>
              <div className="metric-value">4.2d</div>
              <div className="metric-label">Avg resolution</div>
              <span className="metric-delta delta-up"><i className="fas fa-arrow-down"></i> 1.8d faster</span>
            </div>
          </div>

          <div className="dashboard-main-grid">
            <section className="dashboard-panel priority-panel">
              <div className="panel-heading">
                <div>
                  <span>Priority queue</span>
                  <h3>High-impact issues</h3>
                </div>
                <button className="icon-action-btn" onClick={() => onNavigate("track")} title="View tracker">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>

              <div className="priority-list">
                {priorityIssues.map((issue) => (
                  <button key={issue.title} className={`priority-item ${issue.tone}`} onClick={() => onNavigate("track")}>
                    <span className="priority-icon"><i className={`fas ${issue.icon}`}></i></span>
                    <span className="priority-copy">
                      <span className="priority-badges">
                        <b>{issue.status}</b>
                        <em>AI verified</em>
                      </span>
                      <strong>{issue.title}</strong>
                      <small><i className="fas fa-location-dot"></i> {issue.address}</small>
                      <small>{issue.meta}</small>
                    </span>
                    <span
                      className="priority-upvote"
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerToast("UP", "Upvoted. Issue priority raised.");
                      }}
                    >
                      <i className="fas fa-arrow-up"></i>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-panel green-impact-panel">
              <div className="panel-heading">
                <div>
                  <span>Environmental impact</span>
                  <h3>Cleaner city signals</h3>
                </div>
                <i className="fas fa-seedling"></i>
              </div>
              <div className="impact-photo"></div>
              <div className="impact-stats">
                <div><strong>12.4t</strong><span>waste diverted</span></div>
                <div><strong>2.8k</strong><span>trees protected</span></div>
                <div><strong>41%</strong><span>carbon drop</span></div>
              </div>
            </section>

            <section className="dashboard-panel category-panel">
              <div className="panel-heading">
                <div>
                  <span>Resolution health</span>
                  <h3>By category</h3>
                </div>
              </div>
              <div className="category-progress-list">
                {categoryProgress.map((item) => (
                  <div key={item.label} className="category-row">
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}%</strong>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${item.className}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel contractor-panel">
              <div className="panel-heading">
                <div>
                  <span>Accountability</span>
                  <h3>Contractor scorecards</h3>
                </div>
              </div>
              <div className="contractor-row">
                <div className="contractor-grade grade-a">A+</div>
                <div><strong>GreenBuild Pvt Ltd</strong><span>2 delays | Rs 12L sanctioned</span></div>
                <b>94</b>
              </div>
              <div className="contractor-row">
                <div className="contractor-grade grade-b">B</div>
                <div><strong>UrbanFix Corp</strong><span>7 delays | Rs 48L sanctioned</span></div>
                <b>71</b>
              </div>
              <div className="contractor-row">
                <div className="contractor-grade grade-d">D</div>
                <div><strong>Metro Roads Ltd</strong><span>19 delays | Rs 2.3Cr sanctioned</span></div>
                <b>38</b>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
