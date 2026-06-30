import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import MarkerCluster dependencies safely
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Import Heatmap dependencies safely
import "leaflet.heat";

interface CiviQMapProps {
  triggerToast: (icon: string, message: string) => void;
}

interface IssueData {
  id: string;
  lat: number;
  lng: number;
  address: string;
  category: string;
  severity: string;
  description: string;
  photoURL?: string;
  reporterUID?: string;
  reporterName?: string;
  status: string;
  upvotes: number;
  voters?: string[];
  createdAt: string;
  wardId?: string;
}

export function CiviQMap({ triggerToast }: CiviQMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const singleMarkersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const userLocationCircleRef = useRef<L.Circle | null>(null);
  const hasCenteredOnInitRef = useRef<boolean>(false);

  // States for user settings & layers
  const [mapView, setMapView] = useState<"standard" | "satellite">("standard");
  const [layerView, setLayerView] = useState<"pins" | "cluster" | "heatmap">(() => {
    return (localStorage.getItem("civiq_map_layer") as any) || "cluster";
  });
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [userCoords, setUserCoords] = useState<[number, number]>(() => {
    const savedLoc = localStorage.getItem("civiq_last_location");
    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc);
        if (parsed.latitude && parsed.longitude) {
          return [parsed.latitude, parsed.longitude];
        }
      } catch (e) {}
    }
    return [28.6139, 77.2090];
  });
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [showLocationInfo, setShowLocationInfo] = useState<boolean>(false);
  const [autoOpenIssueId, setAutoOpenIssueId] = useState<string | null>(null);

  // Tile layers refs
  const standardTileRef = useRef<L.TileLayer | null>(null);
  const satelliteTileRef = useRef<L.TileLayer | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("civiq_map_layer", layerView);
    updateMapLayers();
  }, [layerView]);

  useEffect(() => {
    updateBaseTile();
  }, [mapView]);

  // Query location permissions if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setPermissionState(result.state as any);
        result.onchange = () => {
          setPermissionState(result.state as any);
        };
      }).catch((err) => {
        console.warn("Permissions API not supported for geolocation", err);
      });
    }
  }, []);

  const handleSetManualLocation = (lat: number, lng: number, label: string) => {
    const latlng: [number, number] = [lat, lng];
    setUserCoords(latlng);
    if (mapRef.current) {
      mapRef.current.flyTo(latlng, 16);
      triggerToast("📍", `Centered on ${label}`);
    }
  };

  // Handle Geolocation centering
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(latlng);
          setPermissionState("granted");
          if (mapRef.current) {
            mapRef.current.flyTo(latlng, 16);
            triggerToast("🎯", "Centered on your live location.");
          }
        },
        (err) => {
          console.warn("Geolocation denied, checking saved location...", err);
          const savedLoc = localStorage.getItem("civiq_last_location");
          if (savedLoc) {
            try {
              const parsed = JSON.parse(savedLoc);
              if (parsed.latitude && parsed.longitude) {
                const latlng: [number, number] = [parsed.latitude, parsed.longitude];
                setUserCoords(latlng);
                setPermissionState("granted");
                if (mapRef.current) {
                  mapRef.current.flyTo(latlng, 16);
                  triggerToast("🎯", "Centered on your saved location.");
                }
                return;
              }
            } catch (e) {}
          }
          triggerToast("⚠️", "Location access denied. Centered on city center.");
          if (err.code === 1) {
            setPermissionState("denied");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      triggerToast("⚠️", "Geolocation is not supported by your browser.");
    }
  };

  // Verify Fix action from within popup
  const handleVerifyFix = async (issueId: string) => {
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        verifiedCount: increment(1),
        upvotes: increment(1)
      });
      triggerToast("✅", "Fix verification recorded! +15 XP earned.");
    } catch (err) {
      console.error("Error verifying fix in Firestore:", err);
      triggerToast("⚠️", "Failed to record verification.");
    }
  };

  // Listen to Firestore issues collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "issues"), (snapshot) => {
      const docs: IssueData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          lat: data.lat || 28.6139,
          lng: data.lng || 77.2090,
          address: data.address || "",
          category: data.category || "Roads",
          severity: data.severity || "Medium",
          description: data.description || "",
          photoURL: data.photoURL || data.image || "",
          reporterUID: data.reporterUID || "",
          reporterName: data.reporterName || "Anonymous",
          status: data.status || "Open",
          upvotes: data.upvotes || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          wardId: data.wardId || ""
        } as IssueData);
      });
      setIssues(docs);
    }, (error) => {
      console.warn("Firestore snapshot listener failed gracefully:", error);
    });

    // Try to get user coordinates
    let watchId: number | null = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setPermissionState("granted");
        },
        (err) => {
          console.log("Init geolocation fallback", err);
          const savedLoc = localStorage.getItem("civiq_last_location");
          if (savedLoc) {
             try {
                const parsed = JSON.parse(savedLoc);
                if (parsed.latitude && parsed.longitude) {
                   setUserCoords([parsed.latitude, parsed.longitude]);
                   setPermissionState("granted");
                }
             } catch(e) {}
          }
          if (err.code === 1) {
            setPermissionState("denied");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setPermissionState("granted");
        },
        (err) => {
          console.log("Watch position fallback", err);
          const savedLoc = localStorage.getItem("civiq_last_location");
          if (savedLoc) {
             try {
                const parsed = JSON.parse(savedLoc);
                if (parsed.latitude && parsed.longitude) {
                   setUserCoords([parsed.latitude, parsed.longitude]);
                   setPermissionState("granted");
                }
             } catch(e) {}
          }
          if (err.code === 1) {
            setPermissionState("denied");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    return () => {
      unsub();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: userCoords,
      zoom: 14,
      zoomControl: false // Custom controls
    });
    mapRef.current = map;

    // Standard OSM layer
    standardTileRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    // Esri Satellite view
    satelliteTileRef.current = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      }
    );

    // Add standard tile as default
    standardTileRef.current.addTo(map);

    // Initialize clusters and overlays
    markerClusterRef.current = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50
    });
    map.addLayer(markerClusterRef.current);

    // Check if redirect has submitted coordinates to flyTo
    const redirectCoordsStr = localStorage.getItem("civiq_submitted_issue_coords");
    if (redirectCoordsStr) {
      try {
        const { lat, lng, id } = JSON.parse(redirectCoordsStr);
        if (lat && lng) {
          map.flyTo([lat, lng], 16);
          hasCenteredOnInitRef.current = true;
          if (id) {
            setAutoOpenIssueId(id);
          }
          localStorage.removeItem("civiq_submitted_issue_coords");
          triggerToast("🚀", "Navigated to your new report!");
        }
      } catch (e) {
        console.warn(e);
      }
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Track user location with a marker and circle on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Check if user location is different from default city center
    const isDefault = userCoords[0] === 28.6139 && userCoords[1] === 77.2090;

    // Remove existing layers if any
    if (userLocationMarkerRef.current) {
      map.removeLayer(userLocationMarkerRef.current);
      userLocationMarkerRef.current = null;
    }
    if (userLocationCircleRef.current) {
      map.removeLayer(userLocationCircleRef.current);
      userLocationCircleRef.current = null;
    }

    if (!isDefault) {
      // Define a custom divIcon for a pulsing blue dot
      const pulsingDotIcon = L.divIcon({
        className: "custom-user-location-marker",
        html: `
          <div style="position: relative; width: 22px; height: 22px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #3B82F6; border-radius: 50%; opacity: 0.4; transform: scale(1); animation: userPulse 2s infinite ease-in-out;"></div>
            <div style="position: absolute; top: 5px; left: 5px; width: 12px; height: 12px; background: #1D4ED8; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.45);"></div>
          </div>
          <style>
            @keyframes userPulse {
              0% { transform: scale(0.8); opacity: 0.6; }
              50% { transform: scale(2.0); opacity: 0.15; }
              100% { transform: scale(0.8); opacity: 0.6; }
            }
          </style>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      // Add accuracy circle
      userLocationCircleRef.current = L.circle(userCoords, {
        radius: 100, // 100 meters
        fillColor: "#3B82F6",
        fillOpacity: 0.1,
        color: "#2563EB",
        weight: 1,
        interactive: false
      }).addTo(map);

      // Add user location marker
      userLocationMarkerRef.current = L.marker(userCoords, {
        icon: pulsingDotIcon,
        zIndexOffset: 1000
      })
      .bindPopup(`<div style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #1E293B; text-align: center; padding: 2px 0;">🎯 Your Current Location</div>`)
      .addTo(map);

      // Auto-center once
      if (!hasCenteredOnInitRef.current) {
        map.setView(userCoords, 16);
        hasCenteredOnInitRef.current = true;
        triggerToast("🎯", "Centered map on your actual location.");
      }
    }
  }, [userCoords]);

  // Render markers and refresh layer selections when issues/viewType change
  useEffect(() => {
    renderMapData();
  }, [issues, userCoords]);

  const updateBaseTile = () => {
    const map = mapRef.current;
    if (!map) return;

    if (mapView === "satellite") {
      if (standardTileRef.current) map.removeLayer(standardTileRef.current);
      if (satelliteTileRef.current) satelliteTileRef.current.addTo(map);
    } else {
      if (satelliteTileRef.current) map.removeLayer(satelliteTileRef.current);
      if (standardTileRef.current) standardTileRef.current.addTo(map);
    }
  };

  const updateMapLayers = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear everything
    if (markerClusterRef.current) map.removeLayer(markerClusterRef.current);
    if (heatmapLayerRef.current) map.removeLayer(heatmapLayerRef.current);
    singleMarkersRef.current.forEach((marker) => map.removeLayer(marker));

    if (layerView === "cluster") {
      map.addLayer(markerClusterRef.current);
    } else if (layerView === "heatmap") {
      if (heatmapLayerRef.current) map.addLayer(heatmapLayerRef.current);
    } else {
      singleMarkersRef.current.forEach((marker) => marker.addTo(map));
    }
  };

  const getMarkerIcon = (category: string, severity: string, status: string) => {
    let color = "#3B82F6"; // default blue

    if (status.toLowerCase() === "resolved") {
      color = "#9CA3AF"; // Gray for Resolved
    } else if (severity.toLowerCase() === "critical") {
      color = "#EF4444"; // Red for Critical
    } else {
      const cat = category.toLowerCase();
      if (cat === "water") {
        color = "#F97316"; // Orange for water
      } else if (cat === "waste") {
        color = "#10B981"; // Green for waste
      } else if (cat === "lights") {
        color = "#FBBF24"; // Yellow for lights
      }
    }

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      </svg>`;

    return L.divIcon({
      className: "custom-marker-transparent",
      html: `<div>${svgIcon}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  const renderMapData = () => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Clear existing cluster layers
    if (markerClusterRef.current) markerClusterRef.current.clearLayers();

    // 2. Clear single markers
    singleMarkersRef.current.forEach((m) => map.removeLayer(m));
    singleMarkersRef.current = [];

    // 3. Clear Heatmap
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    const heatPoints: [number, number, number][] = [];
    const newSingleMarkers: L.Marker[] = [];

    issues.forEach((issue) => {
      const marker = L.marker([issue.lat, issue.lng], {
        icon: getMarkerIcon(issue.category, issue.severity, issue.status)
      });

      // HTML content for Popup
      const popupHtml = `
        <div class="popup-card text-emerald-800" style="min-width: 180px; font-family: 'Inter', sans-serif;">
          <h4 class="font-bold text-[13px] text-emerald-900 mb-1" style="margin: 0 0 4px 0;">${issue.title}</h4>
          ${issue.photoURL ? `<img src="${issue.photoURL}" alt="issue thumbnail" class="w-full h-20 object-cover rounded mb-2" style="display: block; width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ""}
          <div class="text-[11px] leading-relaxed text-emerald-600 mb-2" style="margin-bottom: 8px;">
            <p style="margin: 2px 0;"><strong>Reporter:</strong> ${issue.reporterName}</p>
            <p style="margin: 2px 0;"><strong>Upvotes:</strong> ${issue.upvotes}</p>
            <p style="margin: 2px 0;"><strong>Category:</strong> ${issue.category}</p>
            <div style="margin: 6px 0 2px 0; display: flex; gap: 4px;">
              <span style="background: ${issue.severity.toLowerCase() === "critical" ? "#FEE2E2" : "#FEF3C7"}; color: ${issue.severity.toLowerCase() === "critical" ? "#EF4444" : "#D97706"}; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 9px;">${issue.severity}</span>
              <span style="background: ${issue.status.toLowerCase() === "resolved" ? "#D1FAE5" : "#DBEAFE"}; color: ${issue.status.toLowerCase() === "resolved" ? "#10B981" : "#2563EB"}; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 9px;">${issue.status}</span>
            </div>
          </div>
          ${issue.status.toLowerCase() !== "resolved" ? `
            <button 
              class="verify-fix-btn w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1 px-2 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
              data-issue-id="${issue.id}"
              style="width: 100%; background: #059669; color: white; border: none; padding: 6px; border-radius: 4px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
            >
              Verify Fix
            </button>
          ` : `
            <div style="background: #D1FAE5; color: #065F46; font-size: 10px; font-weight: 700; text-align: center; padding: 4px; border-radius: 4px;">
              ✓ Resolved & Verified
            </div>
          `}
        </div>
      `;

      marker.bindPopup(popupHtml);
      (marker as any).issueId = issue.id;
      
      // Save for clustering and single marker views
      if (markerClusterRef.current) {
        markerClusterRef.current.addLayer(marker);
      }
      newSingleMarkers.push(marker);

      // Save for heatmap
      heatPoints.push([issue.lat, issue.lng, 1]);
    });

    singleMarkersRef.current = newSingleMarkers;

    // Create heat layer
    heatmapLayerRef.current = (L as any).heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: { 0.4: "blue", 0.6: "cyan", 0.7: "lime", 0.8: "yellow", 1.0: "red" }
    });

    // Enforce selected active layers
    updateMapLayers();
    
    // Auto-open popup if requested
    if (autoOpenIssueId) {
      setTimeout(() => {
        const markerToOpen = newSingleMarkers.find(m => (m as any).issueId === autoOpenIssueId);
        if (markerToOpen && map) {
          markerToOpen.openPopup();
          setAutoOpenIssueId(null); // Reset after opening once
        }
      }, 500);
    }
  };

  // Bind click delegated listener for verify-fix-btn inside map container
  useEffect(() => {
    const mapDiv = mapContainerRef.current;
    if (!mapDiv) return;

    const handlePopupClicks = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(".verify-fix-btn");
      if (btn) {
        const id = btn.getAttribute("data-issue-id");
        if (id) {
          handleVerifyFix(id);
          // Close active popups
          if (mapRef.current) {
            mapRef.current.closePopup();
          }
        }
      }
    };

    mapDiv.addEventListener("click", handlePopupClicks);
    return () => {
      mapDiv.removeEventListener("click", handlePopupClicks);
    };
  }, [issues]);

  return (
    <div className="page active" id="page-map" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-map-location-dot"></i> Live Issue Map
        </h2>
        <p>Interactive crowd-sourced heatmap & verified clusters.</p>
      </div>
      
      <div className="section" style={{ padding: "0" }}>
        <div className="section-inner" style={{ maxWidth: "100%", padding: "0 1rem" }}>
          <div className="card relative overflow-hidden" style={{ borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
            
            {/* Map Header Overlay / Controls */}
            <div className="absolute top-4 left-4 z-[1000] bg-white/95  backdrop-blur-md p-3 rounded-xl shadow-lg border border-emerald-100  max-w-[280px] md:max-w-[400px]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 ">Live Sync Engaged</span>
                  </div>
                  <button 
                    onClick={() => setShowLocationInfo(!showLocationInfo)}
                    className="text-emerald-400 hover:text-emerald-600 :text-emerald-400 transition-colors"
                    title="Why location is requested"
                  >
                    <i className="fas fa-info-circle text-xs"></i>
                  </button>
                </div>

                {showLocationInfo && (
                  <div className="bg-emerald-50  p-2 rounded-lg text-[10px] text-emerald-600  border border-emerald-100  leading-normal">
                    <strong>Why location is needed:</strong> Location access allows us to auto-locate reported civic issues, display active incidents in your immediate ward, and enable physical fix verification within a 2km radius to earn XP!
                  </div>
                )}

                <p className="text-[11px] text-emerald-500 ">
                  Showing {issues.length} community complaints in actual coords.
                </p>

                {/* Geolocation Status Indicator */}
                <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50  px-2 py-1.5 rounded-lg border border-emerald-100 ">
                  <span className="font-semibold text-emerald-500 ">Location:</span>
                  {permissionState === "granted" ? (
                    <span className="text-emerald-600  font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active (GPS)
                    </span>
                  ) : permissionState === "denied" ? (
                    <span className="text-rose-600  font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Denied / Blocked
                    </span>
                  ) : (
                    <span className="text-amber-600  font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Checking...
                    </span>
                  )}
                </div>

                {/* Fallback Manual Picker */}
                <div className="border-t border-emerald-100  pt-2">
                  <div className="mb-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                      {permissionState === "denied" ? "⚠️ Set Location Manually" : "Set Location Manually"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    {/* Predefined Areas */}
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => handleSetManualLocation(28.6139, 77.2090, "New Delhi")}
                        className="text-[9px] bg-emerald-100  hover:bg-emerald-200 :bg-emerald-700 py-1 rounded font-medium text-emerald-700  transition-colors"
                      >
                        New Delhi
                      </button>
                      <button
                        onClick={() => handleSetManualLocation(19.0760, 72.8777, "Mumbai")}
                        className="text-[9px] bg-emerald-100  hover:bg-emerald-200 :bg-emerald-700 py-1 rounded font-medium text-emerald-700  transition-colors"
                      >
                        Mumbai
                      </button>
                      <button
                        onClick={() => handleSetManualLocation(12.9716, 77.5946, "Bengaluru")}
                        className="text-[9px] bg-emerald-100  hover:bg-emerald-200 :bg-emerald-700 py-1 rounded font-medium text-emerald-700  transition-colors"
                      >
                        Bengaluru
                      </button>
                      <button
                        onClick={() => handleSetManualLocation(22.5726, 88.3639, "Kolkata")}
                        className="text-[9px] bg-emerald-100  hover:bg-emerald-200 :bg-emerald-700 py-1 rounded font-medium text-emerald-700  transition-colors"
                      >
                        Kolkata
                      </button>
                    </div>

                    {/* Custom Coordinates Inputs Form */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const latVal = parseFloat(formData.get("lat") as string);
                        const lngVal = parseFloat(formData.get("lng") as string);
                        if (!isNaN(latVal) && !isNaN(lngVal)) {
                          handleSetManualLocation(latVal, lngVal, "Custom Pin");
                        } else {
                          triggerToast("⚠️", "Please enter valid coordinates.");
                        }
                      }}
                      className="flex gap-1 items-center"
                    >
                      <input
                        type="number"
                        name="lat"
                        step="0.0001"
                        placeholder="Lat"
                        className="w-5/12 text-[9px] px-1.5 py-1 border rounded   "
                        required
                      />
                      <input
                        type="number"
                        name="lng"
                        step="0.0001"
                        placeholder="Lng"
                        className="w-5/12 text-[9px] px-1.5 py-1 border rounded   "
                        required
                      />
                      <button
                        type="submit"
                        className="w-2/12 bg-emerald-600 hover:bg-emerald-700 text-white py-1 rounded transition-colors text-[9px] font-bold text-center"
                        title="Apply coordinates"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* View Toggles */}
                <div className="flex gap-1.5 mt-1 border-t border-emerald-100  pt-2 flex-wrap">
                  <button
                    onClick={() => setLayerView("pins")}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                      layerView === "pins"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    Pins
                  </button>
                  <button
                    onClick={() => setLayerView("cluster")}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                      layerView === "cluster"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    Cluster
                  </button>
                  <button
                    onClick={() => setLayerView("heatmap")}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                      layerView === "heatmap"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    🔥 Heatmap
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions (Map Satellite & Locate Buttons) */}
            <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
              {/* Locate Me */}
              <button
                onClick={handleLocateMe}
                className="w-10 h-10 bg-white/95 hover:bg-white  :bg-emerald-900 text-emerald-700  rounded-full shadow-md flex items-center justify-center border border-emerald-100  transition-all hover:scale-105 active:scale-95"
                title="Locate Me"
              >
                <i className="fas fa-crosshairs text-base"></i>
              </button>

              {/* Satellite Toggle */}
              <button
                onClick={() => setMapView(mapView === "standard" ? "satellite" : "standard")}
                className="w-10 h-10 bg-white/95 hover:bg-white  :bg-emerald-900 text-emerald-700  rounded-full shadow-md flex items-center justify-center border border-emerald-100  transition-all hover:scale-105 active:scale-95"
                title="Toggle Satellite Imagery"
              >
                <i className={`fas ${mapView === "standard" ? "fa-globe" : "fa-map"} text-base`}></i>
              </button>
            </div>

            {/* Map Container Element */}
            <style>{`
              .custom-marker-transparent {
                background: none !important;
                border: none !important;
              }
              .leaflet-popup-content-wrapper {
                border-radius: 12px;
                padding: 4px;
              }
              .leaflet-popup-tip {
                background: white;
              }
            `}</style>
            <div 
              ref={mapContainerRef} 
              className="w-full h-[500px] md:h-[500px] h-[calc(100vh-140px)]"
              style={{ zIndex: 0 }}
            />

            {/* Legend / Info Bar */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-emerald-50  border-t border-emerald-100  text-[11px] font-medium text-emerald-600 ">
              <span className="font-bold text-emerald-700 ">LEGEND:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Critical Severity
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> Water Leak
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Waste Issue
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]"></span> Streetlight dark
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span> Roads & Other
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9CA3AF]"></span> Resolved Issues
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
