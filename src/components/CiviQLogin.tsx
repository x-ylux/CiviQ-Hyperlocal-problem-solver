import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface CiviQLoginProps {
  onNavigate: (tab: string) => void;
  triggerToast: (icon: string, message: string) => void;
  onLoginSuccess?: () => void;
}

export function CiviQLogin({ onNavigate, triggerToast, onLoginSuccess }: CiviQLoginProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Verify email existence and legitimacy via Google Sign-In
      triggerToast("🌐", `Successfully logged in with Google as ${user.displayName}!`);

      // Create / load profile
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

      // Clear any sandbox active user if we have a real session
      localStorage.removeItem("civiq_active_user");

      if (onLoginSuccess) onLoginSuccess();
      onNavigate("home");
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked") {
        setErrorMsg("The Google login popup was blocked by your browser. Please allow popups.");
      } else if (err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Google login popup closed before completion.");
      } else {
        setErrorMsg("Access denied: Unverified or fake email. Please use a registered, authenticated account (like Google Sign-In).");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
      <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(165,214,167,0.15) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>
      <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, background: "radial-gradient(circle, rgba(41,182,246,0.1) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0 }}></div>

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, var(--leaf), var(--lime))", color: "var(--on-primary)", fontSize: "32px", marginBottom: "1rem", boxShadow: "0 8px 32px rgba(76,175,80,0.3)" }}>
            <i className="fas fa-leaf"></i>
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--forest)", marginBottom: "0.5rem" }}>
            Welcome to CiviQ
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Authenticate with your registered account to continue.
          </p>
        </div>

        <div className="card card-body" style={{ padding: "2.5rem" }}>
          
          {errorMsg && (
            <div style={{ background: "#FFEBEE", color: "#C62828", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 500, marginBottom: "1.25rem", border: "1px solid #FFCDD2", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <i className="fas fa-exclamation-circle" style={{ marginTop: "0.15rem" }}></i>
              <div>{errorMsg}</div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text)", fontSize: "0.9rem", marginBottom: "1.5rem", fontWeight: 500 }}>
              Only verified and officially registered accounts are granted access.
            </p>
            <button
              type="button"
              className="btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                background: "var(--card)",
                border: "1.5px solid var(--border)",
                color: "var(--text)",
                fontWeight: 600,
                padding: "0.85rem",
                borderRadius: "12px",
                transition: "var(--transition)",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Authenticating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "0.5rem" }}>
                    <path fill="#4285F4" d="M23.74 12.27c0-.82-.07-1.64-.2-2.44H12.2v4.61h6.51c-.28 1.49-1.12 2.76-2.4 3.63v3h3.87c2.26-2.09 3.56-5.17 3.56-8.8z"/>
                    <path fill="#34A853" d="M12.2 24c3.24 0 5.96-1.08 7.95-2.91l-3.87-3c-1.08.73-2.46 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.47v3.09C3.47 21.36 7.54 24 12.2 24z"/>
                    <path fill="#FBBC05" d="M5.47 14.29a6.83 6.83 0 0 1 0-4.58V6.62H1.47a11.9 11.9 0 0 0 0 10.76l4-3.09z"/>
                    <path fill="#EA4335" d="M12.2 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C18.15 1.19 15.44 0 12.2 0 7.54 0 3.47 2.64 1.47 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                  </svg>
                  Google Authentication
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
