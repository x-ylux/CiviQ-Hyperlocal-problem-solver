import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { CivicReport } from "../types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface CiviQMapProps {
  triggerToast: (icon: string, message: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Issues", icon: "fas fa-layer-group" },
  { id: "waste", label: "Waste", icon: "fas fa-trash" },
  { id: "potholes", label: "Potholes (Roads)", icon: "fas fa-road" },
  { id: "water", label: "Water Leak", icon: "fas fa-tint" },
  { id: "lights", label: "Streetlights", icon: "fas fa-lightbulb" },
];

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export function CiviQMap({ triggerToast }: CiviQMapProps) {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [userLocation, setUserLocation] = useState<[number, number]>([26.9124, 75.7873]); // Default Jaipur

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
      const data: CivicReport[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CivicReport);
      });
      setReports(data);
    });
    
    // Get user's actual location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation error", error);
        }
      );
    }

    return () => unsub();
  }, []);

  const getFilteredReports = () => {
    if (activeFilter === "all") return reports;
    if (activeFilter === "potholes") return reports.filter((r) => r.category === "roads");
    return reports.filter((r) => r.category === activeFilter);
  };

  const getMarkerIcon = (category: string) => {
    let color = "#1B5E20"; // forest
    if (category === "roads") color = "#E53935";
    else if (category === "water") color = "#0288D1";
    else if (category === "waste") color = "#F59E0B";

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>`;
    
    return L.divIcon({
      className: "custom-marker-transparent",
      html: `<div style="background:transparent;">${svgIcon}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="page active" id="page-map" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-map-location-dot"></i> Live Issue Map
        </h2>
        <p>{filteredReports.length} active issues in your area.</p>
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
              <span style={{ fontWeight: 600, fontSize: ".9rem" }}>Local Area — Live</span>
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
              <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`btn btn-sm ${activeFilter === cat.id ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setActiveFilter(cat.id);
                      triggerToast("🔍", `Filtering map by: ${cat.label}`);
                    }}
                    style={activeFilter === cat.id ? { background: "var(--leaf)", color: "var(--on-primary)" } : {}}
                  >
                    <i className={cat.icon}></i> {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            <style>{`
              .custom-marker-transparent {
                background: none !important;
                border: none !important;
              }
            `}</style>
            <div style={{ height: "450px", position: "relative", zIndex: 0 }}>
              <MapContainer center={userLocation} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
                {filteredReports.map((report) => (
                  <Marker 
                    key={report.id} 
                    position={[report.location.latitude, report.location.longitude]}
                    icon={getMarkerIcon(report.category)}
                  >
                    <Popup>
                      <strong>{report.title}</strong><br/>
                      {report.description}<br/>
                      <em>Status: {report.status}</em>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
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
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E53935", display: "inline-block" }}></span> Roads / Potholes
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0288D1", display: "inline-block" }}></span> Water
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}></span> Waste
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1B5E20", display: "inline-block" }}></span> Other
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
