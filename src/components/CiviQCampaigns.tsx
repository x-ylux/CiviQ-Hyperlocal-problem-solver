import React from "react";
import { CAMPAIGN_IMAGES, IMAGES } from "../constants/images";

interface CiviQCampaignsProps {
  campaignFilter: string;
  setCampaignFilter: (filter: string) => void;
  joinedCampaigns: string[];
  onJoinCampaign: (title: string, xp: number) => void;
}

export function CiviQCampaigns({
  campaignFilter,
  setCampaignFilter,
  joinedCampaigns,
  onJoinCampaign,
}: CiviQCampaignsProps) {
  const campaigns = [
    { id: "c1", tag: "clean", emoji: "🧹", title: "Swachh Ward Drive — Ward 7", date: "July 5, 2026", location: "Rajouri Garden", progress: "48%", volunteers: "238 / 500", width: "48%", aiRec: true, xp: 100 },
    { id: "c2", tag: "tree", emoji: "🌳", title: "Plant 1000 Trees — Pitampura", date: "July 12, 2026", location: "Pitampura", progress: "41%", volunteers: "412 / 1000", width: "41%", color: "#AB47BC", greenAct: true, xp: 80 },
    { id: "c3", tag: "water", emoji: "💧", title: "Fix the Leaks — City-wide", date: "Ongoing", location: "All wards", progress: "45%", volunteers: "89 / 200", width: "45%", sky: true, urgent: true, xp: 60 },
    { id: "c4", tag: "recycle", emoji: "♻️", title: "Segregation Champion Month", date: "July 2026", location: "Dwarka", progress: "41%", volunteers: "1,240 / 3000", width: "41%", amber: true, aiMatch: true, xp: 120 },
    { id: "c5", tag: "clean", emoji: "🏫", title: "Green Schools Initiative", date: "Aug 2026", location: "City-wide", progress: "28%", volunteers: "14 / 50", width: "28%", pink: true, school: true, xp: 90 },
    { id: "c6", tag: "tree", emoji: "🌿", title: "Rooftop Garden Week", date: "July 20, 2026", location: "All wards", progress: "34%", volunteers: "67 / 200", width: "34%", limeGrad: true, eco: true, xp: 75 },
  ];

  return (
    <div className="page active" id="page-campaigns" style={{ display: "block" }}>
      <div
        className="page-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(27,94,32,0.92), rgba(46,125,50,0.85)), url(${IMAGES.forest})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h2>
          <i className="fas fa-bullhorn"></i> Active Campaigns
        </h2>
        <p>Join community drives, earn bonus XP, and make real impact</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
            {["all", "clean", "tree", "water", "recycle"].map((tag) => {
              const labels: Record<string, string> = {
                all: "All",
                clean: "Cleanliness",
                tree: "Tree planting",
                water: "Water",
                recycle: "Recycling",
              };
              return (
                <button
                  key={tag}
                  className={`btn btn-sm ${campaignFilter === tag ? "btn-green" : "btn-ghost"}`}
                  onClick={() => setCampaignFilter(tag)}
                >
                  {labels[tag]}
                </button>
              );
            })}
          </div>
          <div className="grid g3" id="campaignGrid">
            {campaigns.map((camp) => {
              const isFilterMatched = campaignFilter === "all" || camp.tag === campaignFilter;
              if (!isFilterMatched) return null;

              const joined = joinedCampaigns.includes(camp.title);

              return (
                <div key={camp.id} className="campaign-card">
                  <div
                    className="campaign-img-photo"
                    style={{
                      backgroundImage: `url(${CAMPAIGN_IMAGES[camp.tag] || IMAGES.garden})`,
                    }}
                  >
                    <span className="campaign-img-emoji">{camp.emoji}</span>
                  </div>
                  <div className="campaign-body">
                    <div className="campaign-title">{camp.title}</div>
                    <div className="campaign-meta">
                      <span>
                        <i className="fas fa-calendar"></i> {camp.date}
                      </span>
                      <span>
                        <i className="fas fa-location-dot"></i> {camp.location}
                      </span>
                    </div>
                    <div className="campaign-progress">
                      <div className="progress-label">
                        <span>{camp.volunteers} volunteers</span>
                        <span>{camp.progress}</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: camp.width,
                            background: camp.color
                              ? `linear-gradient(90deg,#7B1FA2,${camp.color})`
                              : camp.sky
                              ? "linear-gradient(90deg,var(--sky),#29B6F6)"
                              : camp.amber
                              ? "linear-gradient(90deg,var(--amber),#FB923C)"
                              : camp.pink
                              ? "linear-gradient(90deg,#E91E63,#F06292)"
                              : camp.limeGrad
                              ? "linear-gradient(90deg,#558B2F,#8BC34A)"
                              : undefined,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: ".5rem", justifyContent: "space-between", alignItems: "center" }}>
                      {camp.aiRec && (
                        <span className="badge badge-ai">
                          <i className="fas fa-robot"></i> AI recommended
                        </span>
                      )}
                      {camp.greenAct && (
                        <span className="badge" style={{ background: "#F3E5F5", color: "#6A1B9A" }}>
                          <i className="fas fa-leaf"></i> Green action
                        </span>
                      )}
                      {camp.urgent && <span className="badge badge-progress">Urgent</span>}
                      {camp.aiMatch && (
                        <span className="badge badge-ai">
                          <i className="fas fa-robot"></i> AI matched
                        </span>
                      )}
                      {camp.school && (
                        <span className="badge" style={{ background: "#FCE4EC", color: "#880E4F" }}>
                          School
                        </span>
                      )}
                      {camp.eco && <span className="badge badge-resolved">Eco</span>}

                      <button
                        className="btn btn-green btn-sm"
                        style={joined ? { background: "#E8F5E9", color: "#1B5E20", border: "1px solid #A5D6A7", cursor: "default" } : undefined}
                        onClick={() => {
                          if (joined) return;
                          onJoinCampaign(camp.title, camp.xp);
                        }}
                      >
                        {joined ? "✓ Joined!" : `Join (+${camp.xp} XP)`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
