import React, { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface CiviQLoginProps {
  onNavigate: (tab: string) => void;
  triggerToast: (icon: string, message: string) => void;
  onLoginSuccess?: () => void;
}

type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function CiviQLogin({ onNavigate, triggerToast, onLoginSuccess }: CiviQLoginProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationLabel, setLocationLabel] = useState("Detect your ward");

  const requestLocation = (fromFirstVisit = false) => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      setLocationLabel("Location is not supported on this device");
      localStorage.setItem("civiq_location_permission_requested", "true");
      return;
    }

    setLocationStatus("requesting");
    setLocationLabel("Waiting for browser permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem("civiq_location_permission_requested", "true");
        localStorage.setItem(
          "civiq_last_location",
          JSON.stringify({ latitude, longitude, capturedAt: new Date().toISOString() })
        );
        setLocationStatus("granted");
        setLocationLabel(`Location enabled: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        triggerToast("LOC", fromFirstVisit ? "Location access enabled for local civic updates." : "Location refreshed.");
      },
      (error) => {
        localStorage.setItem("civiq_location_permission_requested", "true");
        setLocationStatus("denied");
        setLocationLabel(error.code === 1 ? "Permission denied. You can enable it later." : "Unable to read location.");
        triggerToast("LOC", "Location permission was not enabled. You can continue and add it later.");
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    const alreadyAsked = localStorage.getItem("civiq_location_permission_requested") === "true";
    if (!alreadyAsked) {
      const timer = window.setTimeout(() => requestLocation(true), 700);
      return () => window.clearTimeout(timer);
    }

    const lastLocation = localStorage.getItem("civiq_last_location");
    if (lastLocation) {
      try {
        const parsed = JSON.parse(lastLocation) as { latitude: number; longitude: number };
        setLocationStatus("granted");
        setLocationLabel(`Location enabled: ${parsed.latitude.toFixed(3)}, ${parsed.longitude.toFixed(3)}`);
      } catch {
        setLocationLabel("Detect your ward");
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      triggerToast("OK", `Successfully logged in with Google as ${user.displayName || user.email}!`);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const savedLocation = localStorage.getItem("civiq_last_location");
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "New Citizen",
          role: "citizen",
          credits: 0,
          mfaEnabled: false,
          location: savedLocation ? JSON.parse(savedLocation) : null,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.removeItem("civiq_active_user");

      if (onLoginSuccess) onLoginSuccess();
      onNavigate("home");
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        setErrorMsg("The Google login popup was blocked by your browser. Please allow popups.");
      } else if (err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Google login popup closed before completion.");
      } else {
        setErrorMsg("Access denied. Please sign in with a verified Google account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-shell">
      <div className="login-bg-photo login-bg-photo-earth" aria-hidden="true"></div>
      <div className="login-bg-photo login-bg-photo-forest" aria-hidden="true"></div>

      <section className="login-experience">
        <div className="login-story-panel">
          <div className="login-photo-stack" aria-hidden="true">
            <div className="login-photo-card photo-earth"></div>
            <div className="login-photo-card photo-plant"></div>
            <div className="login-photo-card photo-community"></div>
          </div>
          <div className="login-story-copy">
            <span className="login-kicker">
              <i className="fas fa-earth-asia"></i> Hyperlocal civic intelligence
            </span>
            <h1>CiviQ</h1>
            <p>
              Report local problems, track municipal action, and join verified environmental campaigns from one clean,
              secure citizen account.
            </p>
            <div className="login-trust-row">
              <div>
                <strong>8.3k</strong>
                <span>citizens</span>
              </div>
              <div>
                <strong>1.1k</strong>
                <span>resolved</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-brand-mark">
            <i className="fas fa-leaf"></i>
          </div>
          <h2>Sign in to continue</h2>
          <p className="login-card-subtitle">Use your verified Google account to access reports, dashboards, maps, and XP.</p>

          <div className={`location-permission-card ${locationStatus}`}>
            <div className="location-icon">
              <i className="fas fa-location-crosshairs"></i>
            </div>
            <div>
              <strong>Location access</strong>
              <span>{locationLabel}</span>
            </div>
            <button
              type="button"
              className="location-retry-btn"
              onClick={() => requestLocation(false)}
              disabled={locationStatus === "requesting"}
              title="Request location permission"
            >
              {locationStatus === "requesting" ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-rotate-right"></i>}
            </button>
          </div>

          {errorMsg && (
            <div className="login-error">
              <i className="fas fa-circle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <button type="button" className="google-auth-btn" onClick={handleGoogleSignIn} disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Authenticating...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#4285F4" d="M23.74 12.27c0-.82-.07-1.64-.2-2.44H12.2v4.61h6.51c-.28 1.49-1.12 2.76-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.8z" />
                  <path fill="#34A853" d="M12.2 24c3.24 0 5.96-1.08 7.95-2.91l-3.87-3c-1.08.73-2.46 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.47v3.09C3.47 21.36 7.54 24 12.2 24z" />
                  <path fill="#FBBC05" d="M5.47 14.29a6.83 6.83 0 0 1 0-4.58V6.62H1.47a11.9 11.9 0 0 0 0 10.76l4-3.09z" />
                  <path fill="#EA4335" d="M12.2 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C18.15 1.19 15.44 0 12.2 0 7.54 0 3.47 2.64 1.47 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="login-divider">
            <span></span>
            <small>secure civic access</small>
            <span></span>
          </div>

          <div className="login-feature-list">
            <span><i className="fas fa-shield-halved"></i> Verified identity</span>
            <span><i className="fas fa-map-location-dot"></i> Ward based updates</span>
            <span><i className="fas fa-seedling"></i> Environment campaigns</span>
          </div>
        </div>
      </section>
    </div>
  );
}
