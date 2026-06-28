import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface CiviQLoginProps {
  onNavigate: (tab: string) => void;
  triggerToast: (icon: string, message: string) => void;
  onLoginSuccess?: () => void;
}

export function CiviQLogin({ onNavigate, triggerToast, onLoginSuccess }: CiviQLoginProps) {
  const [tab, setTab] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfigTip, setShowConfigTip] = useState(false);

  // Local Sandbox helpers
  const getSandboxUsers = (): any[] => {
    try {
      const u = localStorage.getItem("civiq_sandbox_users");
      return u ? JSON.parse(u) : [];
    } catch {
      return [];
    }
  };

  const saveSandboxUsers = (users: any[]) => {
    localStorage.setItem("civiq_sandbox_users", JSON.stringify(users));
  };

  const handleSandboxSignIn = (eMail: string, pass: string) => {
    const users = getSandboxUsers();
    const found = users.find((u) => u.email.toLowerCase() === eMail.toLowerCase());
    if (!found) {
      // Auto-register in sandbox for instant friction-free access during testing
      const newSandboxUser = {
        uid: "sb_" + Math.random().toString(36).substring(2, 11),
        email: eMail,
        password: pass,
        displayName: eMail.split("@")[0].charAt(0).toUpperCase() + eMail.split("@")[0].slice(1),
        role: "citizen",
        credits: 0,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      users.push(newSandboxUser);
      saveSandboxUsers(users);
      localStorage.setItem("civiq_active_user", JSON.stringify(newSandboxUser));
      triggerToast("🔐", `Logged in via CiviQ Local Sandbox! Welcome, ${newSandboxUser.displayName}!`);
      if (onLoginSuccess) onLoginSuccess();
      onNavigate("home");
      return;
    }

    if (found.password !== pass) {
      setErrorMsg("Incorrect sandbox password. Please try again.");
      triggerToast("⚠️", "Incorrect password.");
      return;
    }

    localStorage.setItem("civiq_active_user", JSON.stringify(found));
    triggerToast("🔐", `Logged in via CiviQ Local Sandbox! Welcome, ${found.displayName}!`);
    if (onLoginSuccess) onLoginSuccess();
    onNavigate("home");
  };

  const handleSandboxSignUp = (eMail: string, pass: string, name: string) => {
    const users = getSandboxUsers();
    const found = users.find((u) => u.email.toLowerCase() === eMail.toLowerCase());
    if (found) {
      setErrorMsg("This email is already registered in CiviQ sandbox. Try signing in.");
      triggerToast("⚠️", "Email already registered.");
      return;
    }

    const newSandboxUser = {
      uid: "sb_" + Math.random().toString(36).substring(2, 11),
      email: eMail,
      password: pass,
      displayName: name,
      role: "citizen",
      credits: 0,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    };
    users.push(newSandboxUser);
    saveSandboxUsers(users);
    localStorage.setItem("civiq_active_user", JSON.stringify(newSandboxUser));
    triggerToast("🎉", "Sandbox account registered successfully! Enjoy +2500 XP bonus!");
    if (onLoginSuccess) onLoginSuccess();
    onNavigate("home");
  };

  // Helper to handle standard auth errors nicely and provide console setup tips if needed
  const handleError = (error: any, context?: "signin" | "signup") => {
    const code = error?.code || "";
    let message = "An unexpected authentication error occurred. Please try again.";

    if (code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (code === "auth/user-disabled") {
      message = "This user account has been disabled by administrators.";
    } else if (code === "auth/user-not-found") {
      message = "No account found with this email. Would you like to sign up?";
    } else if (code === "auth/wrong-password") {
      message = "Incorrect password. Please try again or reset your password.";
    } else if (code === "auth/email-already-in-use") {
      message = "This email address is already registered. Try signing in instead.";
    } else if (code === "auth/weak-password") {
      message = "Weak password! Please choose a password of at least 6 characters.";
    } else if (code === "auth/operation-not-allowed") {
      message = "Email/Password sign-in is disabled in Firebase Console. Using local Sandbox Authenticator instead.";
      // Trigger automatic sandbox fallback
      if (context === "signin") {
        handleSandboxSignIn(email, password);
        return;
      } else if (context === "signup") {
        handleSandboxSignUp(email, password, displayName || "Citizen Miner");
        return;
      }
    } else if (code === "auth/popup-blocked") {
      message = "The Google login popup was blocked by your browser. Please allow popups.";
    } else if (code === "auth/cancelled-popup-request") {
      message = "Google login popup closed before completion.";
    } else {
      message = error?.message || message;
      console.error("Firebase Auth System Error:", error);
    }

    console.warn("[CivicAI Auth Error handled]:", message);
    setErrorMsg(message);
    triggerToast("⚠️", message);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowConfigTip(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      triggerToast("🔐", `Welcome back, ${user.displayName || user.email}!`);
      
      // Load user details from firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Fallback profile creation if not exists
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
      if (err?.code === "auth/operation-not-allowed") {
        handleSandboxSignIn(email, password);
      } else {
        handleError(err, "signin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowConfigTip(false);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth user display name
      await updateProfile(user, { displayName });

      // Create profile record in firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email || "",
        displayName: displayName,
        role: "citizen",
        credits: 0,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      });

      // Clear any sandbox active user if we have a real session
      localStorage.removeItem("civiq_active_user");

      triggerToast("🎉", `Account created successfully! Enjoy +2500 XP bonus!`);
      if (onLoginSuccess) onLoginSuccess();
      onNavigate("home");
    } catch (err: any) {
      if (err?.code === "auth/operation-not-allowed") {
        handleSandboxSignUp(email, password, displayName);
      } else {
        handleError(err, "signup");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowConfigTip(false);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

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
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email to send reset instructions.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Reset link has been sent to your email address! Please check your inbox.");
      triggerToast("📧", "Password reset email sent.");
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    triggerToast("👤", "Continuing in Guest Mode. Your progress will be saved in sandbox.");
    onNavigate("home");
  };

  return (
    <div className="page active" id="page-login" style={{ display: "block" }}>
      <div className="hero" style={{ minHeight: "auto", padding: "3rem 1.5rem 2rem" }}>
        <div className="hero-bg-circles">
          <div className="hero-circle" style={{ width: "300px", height: "300px", top: "-100px", left: "-50px" }}></div>
          <div className="hero-circle" style={{ width: "200px", height: "200px", bottom: "-50px", right: "-50px" }}></div>
        </div>
        <div className="hero-content" style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
          <div className="hero-tag">
            <i className="fas fa-lock"></i> Secure Gateway
          </div>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
            {tab === "signin" && "Sign In to CivicAI"}
            {tab === "signup" && "Create Citizen Account"}
            {tab === "reset" && "Recover Account"}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.85)", marginBottom: "1.5rem" }}>
            Join Jaipur's premier AI-guided crowdsourcing civic network. Secure, robust, and community-driven.
          </p>
        </div>
      </div>

      <div className="section" style={{ display: "flex", justifyContent: "center", paddingTop: "0" }}>
        <div className="section-inner" style={{ maxWidth: "480px", width: "100%", margin: "-3rem auto 0", position: "relative", zIndex: 10 }}>
          <div className="card card-body" style={{ background: "white", padding: "2rem", boxShadow: "var(--shadow-lg)", borderRadius: "16px" }}>
            
            {/* Tab buttons */}
            {tab !== "reset" && (
              <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "1.5rem" }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    border: "none",
                    background: "none",
                    borderBottom: tab === "signin" ? "3px solid var(--leaf)" : "3px solid transparent",
                    color: tab === "signin" ? "var(--forest)" : "var(--muted)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTab("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    border: "none",
                    background: "none",
                    borderBottom: tab === "signup" ? "3px solid var(--leaf)" : "3px solid transparent",
                    color: tab === "signup" ? "var(--forest)" : "var(--muted)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTab("signup");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                >
                  Register
                </button>
              </div>
            )}

            {/* Error Message Display */}
            {errorMsg && (
              <div
                style={{
                  background: "#FFEBEE",
                  color: "#C62828",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  marginBottom: "1.25rem",
                  border: "1px solid #FFCDD2",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <i className="fas fa-exclamation-circle" style={{ marginTop: "0.15rem" }}></i>
                <div>
                  {errorMsg}
                  {showConfigTip && (
                    <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#FFE0E2", borderRadius: "6px", fontSize: "0.75rem" }}>
                      <strong>Admin Action Required:</strong> To enable email auth, go to the Firebase Console &rarr; Build &rarr; Authentication &rarr; Sign-in method &rarr; Enable Email/Password.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Message Display */}
            {successMsg && (
              <div
                style={{
                  background: "var(--bg2)",
                  color: "var(--forest)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "1.25rem",
                  border: "1px solid var(--lime)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <i className="fas fa-check-circle" style={{ marginTop: "0.15rem" }}></i>
                <div>{successMsg}</div>
              </div>
            )}

            {/* Form Fields based on state */}
            {tab === "signin" && (
              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Password</label>
                    <button
                      type="button"
                      style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--leaf)", border: "none", background: "none", cursor: "pointer" }}
                      onClick={() => setTab("reset")}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-green" style={{ justifyContent: "center", padding: "0.85rem", marginTop: "0.5rem" }}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt"></i> Sign In to Account
                    </>
                  )}
                </button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Malhotra"
                    className="form-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@civicai.org"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Password (Min. 6 characters)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-green" style={{ justifyContent: "center", padding: "0.85rem", marginTop: "0.5rem" }}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Registering...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i> Create Citizen Account
                    </>
                  )}
                </button>
              </form>
            )}

            {tab === "reset" && (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ textAlign: "left", marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--muted)",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: 0,
                    }}
                    onClick={() => {
                      setTab("signin");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i> Back to Sign In
                  </button>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-green" style={{ justifyContent: "center", padding: "0.85rem" }}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending link...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i> Send Password Reset Link
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Third Party Login / Google */}
            <div style={{ position: "relative", margin: "1.5rem 0", textAlign: "center" }}>
              <div style={{ borderTop: "1px solid var(--border)", position: "absolute", inset: "50% 0 0", zIndex: 1 }}></div>
              <span style={{ position: "relative", zIndex: 2, background: "white", padding: "0 0.75rem", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                OR CONTINUE WITH
              </span>
            </div>

            <button
              type="button"
              className="btn"
              onClick={handleGoogleSignIn}
              style={{
                width: "100%",
                justifyContent: "center",
                background: "white",
                border: "1.5px solid var(--border)",
                color: "#333333",
                fontWeight: 600,
                fontSize: "0.85rem",
                padding: "0.75rem",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.6z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.03-3.7H1.02v2.33A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.97 10.7a5.4 5.4 0 0 1 0-3.4V4.97H1.02a9 9 0 0 0 0 8.06l2.95-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.05A9 9 0 0 0 1.02 4.97l2.95 2.33C4.67 5.18 6.66 3.58 9 3.58z"
                />
              </svg>
              Google Authentication
            </button>

            {/* Guest Sandbox Mode */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={handleContinueAsGuest}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--muted)",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Skip & Continue as Guest
              </button>
            </div>

          </div>

          {/* Console Admin Tips Card */}
          <div className="card card-body" style={{ marginTop: "1rem", background: "#f9fafb", border: "1px dashed var(--border)", padding: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>💡</span>
              <div style={{ fontSize: "0.74rem", color: "var(--muted)", lineHeight: 1.5 }}>
                <strong>Testing credentials?</strong> Use any standard test email (e.g., <code>citizen@test.com</code>) and a 6-character password to register. If custom domain authentication is blocked by sandbox, Google Login and Skip as Guest remain fully operational at all times.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
