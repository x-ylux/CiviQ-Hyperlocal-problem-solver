import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile } from "../types";
import { IMAGES } from "../constants/images";

interface CiviQLoginProps {
  onNavigate: (tab: string) => void;
  triggerToast: (icon: string, message: string) => void;
  onLoginSuccess?: () => void;
  userProfile?: UserProfile | null;
  credits?: number;
}

export function CiviQLogin({
  onNavigate,
  triggerToast,
  onLoginSuccess,
  userProfile,
  credits = 0,
}: CiviQLoginProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isLoggedIn = !!userProfile && !auth.currentUser?.isAnonymous;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      triggerToast("🌿", `Welcome back, ${user.displayName}! Your civic journey continues.`);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "New Citizen",
          role: "citizen",
          credits: 0,
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.removeItem("civiq_active_user");
      if (onLoginSuccess) onLoginSuccess();
      onNavigate("home");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked") {
        setErrorMsg("Google login popup was blocked. Please allow popups for this site.");
      } else if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in cancelled. Tap the button when you're ready.");
      } else {
        setErrorMsg("Authentication failed. Please use a verified Google account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("civiq_active_user");
      await signOut(auth);
      triggerToast("🍃", "Signed out. See you soon, eco-warrior!");
    } catch {
      triggerToast("❌", "Could not sign out. Please try again.");
    }
  };

  const initials = userProfile?.displayName
    ? userProfile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "C";

  const quickLinks = [
    { icon: "fa-chart-line", label: "Dashboard", tab: "dashboard" },
    { icon: "fa-camera", label: "Report Issue", tab: "report" },
    { icon: "fa-map", label: "Live Map", tab: "map" },
    { icon: "fa-star", label: "My Credits", tab: "gamify" },
  ];

  return (
    <div className="login-page">
      {/* Visual panel with real earth/plant imagery */}
      <div className="login-visual">
        <div
          className="login-visual-bg"
          style={{ backgroundImage: `url(${IMAGES.forest})` }}
        />
        <div className="login-visual-overlay">
          <div className="login-visual-quote">
            "The Earth is what we all have in common."
          </div>
          <div className="login-visual-sub">
            Join thousands of citizens making their neighborhoods greener, cleaner, and smarter with CivicAI.
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {["🌱 Report", "♻️ Recycle", "🌍 Track"].map((tag) => (
              <span
                key={tag}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="login-form-panel">
        <div
          className="login-earth-float e1"
          style={{ backgroundImage: `url(${IMAGES.earth})` }}
        />
        <div
          className="login-earth-float e2"
          style={{ backgroundImage: `url(${IMAGES.plantClose})` }}
        />

        <div className="login-form-inner">
          {!isLoggedIn ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div className="login-logo-ring">
                  <i className="fas fa-leaf" />
                </div>
                <h1
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 1.85rem)",
                    fontWeight: 800,
                    color: "var(--forest)",
                    marginBottom: "0.4rem",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  Welcome to CiviQ
                </h1>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  Sign in to report issues, earn XP, and help heal our planet — one ward at a time.
                </p>
              </div>

              <div className="login-card">
                {errorMsg && (
                  <div
                    style={{
                      background: "#FFEBEE",
                      color: "#C62828",
                      padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      marginBottom: "1.25rem",
                      border: "1px solid #FFCDD2",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      animation: "pageEnter 0.3s ease",
                    }}
                  >
                    <i className="fas fa-exclamation-circle" style={{ marginTop: "0.15rem" }} />
                    <div>{errorMsg}</div>
                  </div>
                )}

                <button
                  type="button"
                  className="login-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      Connecting to Google...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path fill="#4285F4" d="M23.74 12.27c0-.82-.07-1.64-.2-2.44H12.2v4.61h6.51c-.28 1.49-1.12 2.76-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.8z" />
                        <path fill="#34A853" d="M12.2 24c3.24 0 5.96-1.08 7.95-2.91l-3.87-3c-1.08.73-2.46 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.47v3.09C3.47 21.36 7.54 24 12.2 24z" />
                        <path fill="#FBBC05" d="M5.47 14.29a6.83 6.83 0 0 1 0-4.58V6.62H1.47a11.9 11.9 0 0 0 0 10.76l4-3.09z" />
                        <path fill="#EA4335" d="M12.2 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C18.15 1.19 15.44 0 12.2 0 7.54 0 3.47 2.64 1.47 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    marginTop: "1rem",
                    lineHeight: 1.5,
                  }}
                >
                  Secure authentication · Your data stays private · Earn XP from day one
                </p>
              </div>

              <div className="login-features">
                {[
                  { icon: "📷", label: "Report Issues" },
                  { icon: "🗺️", label: "Live Map" },
                  { icon: "🏆", label: "Earn XP" },
                ].map((f) => (
                  <div key={f.label} className="login-feature">
                    <div className="login-feature-icon">{f.icon}</div>
                    <div className="login-feature-label">{f.label}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "1rem",
                  fontSize: "0.82rem",
                }}
                onClick={() => onNavigate("home")}
              >
                <i className="fas fa-compass" /> Explore as guest
              </button>
            </>
          ) : (
            /* Logged-in profile view */
            <div className="login-card login-profile-card">
              <div
                className="login-avatar-large"
                style={
                  auth.currentUser?.photoURL
                    ? {
                        backgroundImage: `url(${auth.currentUser.photoURL})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!auth.currentUser?.photoURL && initials}
              </div>
              <h2
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "var(--forest)",
                  marginBottom: "0.25rem",
                }}
              >
                {userProfile?.displayName || "Citizen"}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                {userProfile?.email}
              </p>
              <div
                className="xp-badge"
                style={{ display: "inline-flex", marginBottom: "1rem" }}
              >
                <i className="fas fa-star" /> {credits.toLocaleString()} XP
              </div>

              {userProfile?.loginStreak && userProfile.loginStreak > 1 && (
                <div
                  style={{
                    background: "var(--bg2)",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.82rem",
                    marginBottom: "1rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  🔥 <strong>{userProfile.loginStreak}-day streak!</strong> Keep logging in daily for bonus XP.
                </div>
              )}

              <div className="login-quick-links">
                {quickLinks.map((link) => (
                  <button
                    key={link.tab}
                    type="button"
                    className="login-quick-link"
                    onClick={() => onNavigate(link.tab)}
                  >
                    <i className={`fas ${link.icon}`} style={{ color: "var(--leaf)" }} />
                    {link.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center", marginTop: "1.25rem" }}
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
