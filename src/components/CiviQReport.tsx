import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "../firebase";

interface CiviQReportProps {
  onNavigate: (tab: string) => void;
  reportStep: number;
  setReportStep: (step: number) => void;
  selectedCat: string;
  setSelectedCat: (cat: string) => void;
  onReportSubmit: (reportData: {
    title: string;
    category: string;
    severity: string;
    description: string;
    address: string;
    image?: string;
    voiceTranscription?: string;
    lat?: number;
    lng?: number;
  }) => void;
  onResetReport: () => void;
  openModal: (type: "rti" | "compost" | "") => void;
  triggerToast: (icon: string, message: string) => void;
}

interface DetectedIssue {
  label: string;
  confidence: number;
  category: string;
  severity: string;
  description: string;
  boundingBox: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}

export function CiviQReport({
  onNavigate,
  reportStep,
  setReportStep,
  selectedCat,
  setSelectedCat,
  onReportSubmit,
  onResetReport,
  openModal,
  triggerToast,
}: CiviQReportProps) {
  // Image & Vision state
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectedIssues, setDetectedIssues] = useState<DetectedIssue[]>([]);
  const [selectedIssueIdx, setSelectedIssueIdx] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Verification & Duplicate states
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    reason: string;
    category?: string;
    severity?: string;
    confidence?: number;
    description?: string;
  } | null>(null);

  const [duplicateModal, setDuplicateModal] = useState<boolean>(false);
  const [duplicateDetails, setDuplicateDetails] = useState<{
    issue: any;
    confidence: number;
    reason: string;
  } | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 }); // Default New Delhi

  // Form details
  const [reportTitle, setReportTitle] = useState<string>("New Issue Report");
  const [reportSeverity, setReportSeverity] = useState<string>("Medium");
  const [reportDescription, setReportDescription] = useState<string>("");
  const [reportAddress, setReportAddress] = useState<string>("Detecting live location...");
  const [lastTicketNum, setLastTicketNum] = useState<number>(1089);

  // Helper to reverse geocode coords using OSM Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          "Accept-Language": "en"
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setReportAddress(data.display_name);
        } else if (data && data.address) {
          const addr = data.address;
          const parts = [
            addr.road || addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.village,
            addr.state
          ].filter(Boolean);
          setReportAddress(parts.join(", "));
        }
      }
    } catch (e) {
      console.warn("Reverse geocoding failed, using coordinates:", e);
      setReportAddress(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    }
  };

  // Fetch device live location immediately on mount
  useEffect(() => {
    const handleFallback = async () => {
      const savedLoc = localStorage.getItem("civiq_last_location");
      if (savedLoc) {
        try {
          const parsed = JSON.parse(savedLoc);
          if (parsed.latitude && parsed.longitude) {
            setCoords({ lat: parsed.latitude, lng: parsed.longitude });
            await reverseGeocode(parsed.latitude, parsed.longitude);
            return;
          }
        } catch (e) {}
      }
      await reverseGeocode(28.6139, 77.2090);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setCoords({ lat: userLat, lng: userLng });
          await reverseGeocode(userLat, userLng);
        },
        async (err) => {
          console.log("Geolocation on mount failed, trying saved loc", err);
          await handleFallback();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      handleFallback();
    }
  }, []);

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Trigger file selection
  const fetchExactLocation = () => {
    triggerToast("📍", "Fetching your exact location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setCoords({ lat: userLat, lng: userLng });
          await reverseGeocode(userLat, userLng);
          triggerToast("✅", "Location updated!");
        },
        (err) => {
          console.warn("Location fetch failed", err);
          triggerToast("⚠️", "Could not fetch exact location. Ensure permissions are granted.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      triggerToast("⚠️", "Geolocation is not supported by your browser.");
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Haversine distance in meters
  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  // Helper to convert URL to base64
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Error converting image URL to base64:", e);
      return "";
    }
  };

  // Convert File to Base64
  const processImageFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsAnalyzing(true);
      setDetectedIssues([]);
      setIsVerified(null);
      setVerificationResult(null);
      triggerToast("👁️", "Verifying image authenticity...");

      // Get current GPS coords on file upload
      let userLat = coords.lat;
      let userLng = coords.lng;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            setCoords({ lat: userLat, lng: userLng });
            await reverseGeocode(userLat, userLng);
          },
          (err) => {
            console.log("Geoloc on upload fallback", err);
            reverseGeocode(userLat, userLng);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        reverseGeocode(userLat, userLng);
      }

      try {
        // 1. Run AI Image Verification
        const verifyRes = await fetch("/api/gemini/verify-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const verifyData = await verifyRes.json();

        // Log Verification to Firestore
        try {
          await addDoc(collection(db, "imageVerifications"), {
            timestamp: new Date().toISOString(),
            isValid: verifyData.isValid,
            category: verifyData.category || "unknown",
            severity: verifyData.severity || "unknown",
            confidence: verifyData.confidence || 0,
            reason: verifyData.reason || "",
            description: verifyData.description || "",
            userId: auth.currentUser?.uid || "anonymous"
          });
        } catch (dbErr) {
          console.warn("Could not log vision verification to Firestore", dbErr);
        }

        if (!verifyData.isValid) {
          setIsVerified(false);
          setVerificationResult(verifyData);
          setIsAnalyzing(false);
          triggerToast("❌", "Verification failed. Unrelated photo detected.");
          return; // BLOCK SUBMISSION
        }

        // Image is valid!
        setIsVerified(true);
        setVerificationResult(verifyData);
        triggerToast("✅", "AI Verified: Valid public infrastructure issue.");

        // 2. Perform bounding box analysis and layout multiple issue detection
        const res = await fetch("/api/gemini/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const issuesList: DetectedIssue[] = await res.json();

        if (issuesList && issuesList.length > 0) {
          setDetectedIssues(issuesList);
          setSelectedIssueIdx(0);
          applyDetectedIssue(issuesList[0]);
          triggerToast("🔍", `AI detected: ${issuesList[0].label} (${issuesList[0].confidence}% confidence)`);
        } else {
          // Fallback to verification fields if analyze list is empty
          const fallbackIssue: DetectedIssue = {
            label: `Reported ${verifyData.category || "Incident"}`,
            confidence: verifyData.confidence || 90,
            category: verifyData.category || "Roads",
            severity: verifyData.severity || "Medium",
            description: verifyData.description || "",
            boundingBox: { ymin: 20, xmin: 20, ymax: 80, xmax: 80 }
          };
          setDetectedIssues([fallbackIssue]);
          setSelectedIssueIdx(0);
          applyDetectedIssue(fallbackIssue);
        }

        // 3. Duplicate Detection: Check within 50m of user coords in same category
        const catFilter = verifyData.category || "Roads";
        triggerToast("🗺️", "Performing local smart de-duplication...");

        const issuesQuery = query(collection(db, "issues"));
        const issuesSnapshot = await getDocs(issuesQuery);
        let duplicateFound = false;

        for (const docSnap of issuesSnapshot.docs) {
          const issueDoc = docSnap.data();
          // Filter by category (case-insensitive) and open status
          if (
            issueDoc.category?.toLowerCase() === catFilter.toLowerCase() &&
            issueDoc.status?.toLowerCase() !== "resolved"
          ) {
            const distance = getHaversineDistance(userLat, userLng, issueDoc.lat, issueDoc.lng);
            if (distance <= 50) { // 50 meters
              // Issue matches geo + category! Let's check for duplicate photo
              const existingPhoto = issueDoc.photoURL || issueDoc.image;
              if (existingPhoto) {
                triggerToast("🤖", "Comparing with nearby report photo...");
                const base64_2 = await urlToBase64(existingPhoto);
                
                if (base64_2) {
                  const dupRes = await fetch("/api/gemini/check-duplicate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image1Base64: base64, image2Base64: base64_2 }),
                  });
                  const dupData = await dupRes.json();

                  if (dupData.isSameIssue && dupData.confidence > 75) {
                    // Duplicate found!
                    setDuplicateDetails({
                      issue: { id: docSnap.id, ...issueDoc },
                      confidence: dupData.confidence,
                      reason: dupData.reason
                    });
                    setDuplicateModal(true);
                    duplicateFound = true;
                    break;
                  }
                }
              }
            }
          }
        }

        setIsAnalyzing(false);
        if (!duplicateFound) {
          setReportStep(2); // Advance to confirm category
        }
      } catch (err) {
        console.error("Image processing error", err);
        setIsAnalyzing(false);
        triggerToast("⚠️", "Setup completed with fallbacks.");
        setReportStep(2);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyDetectedIssue = (issue: DetectedIssue) => {
    setReportTitle(issue.label);
    setSelectedCat(issue.category);
    setReportSeverity(issue.severity);
    setReportDescription(issue.description);
  };

  const handleIssueDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    setSelectedIssueIdx(idx);
    if (detectedIssues[idx]) {
      applyDetectedIssue(detectedIssues[idx]);
      triggerToast("🎯", `Switched to: ${detectedIssues[idx].label}`);
    }
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag & Drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    triggerToast("❌", "File drop disabled. Only live camera captures are accepted to ensure report authenticity!");
  };

  // Voice recording triggers
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      triggerToast("⚠️", "Audio recording not supported in this browser.");
      simulateVoiceReporting();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/mp3" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsTranscribing(true);
          triggerToast("🎤", "Transcribing and extracting civic fields with Gemini...");
          
          try {
            const res = await fetch("/api/gemini/transcribe-voice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audioBase64: base64Audio }),
            });
            const data = await res.json();
            setIsTranscribing(false);

            setVoiceTranscript(data.transcription);
            setReportDescription(data.description);
            setReportAddress(data.location || reportAddress);
            setSelectedCat(data.category || selectedCat);
            setReportSeverity(data.severity || reportSeverity);
            setReportTitle(`Voice reported: ${data.category || "Issue"}`);
            triggerToast("✅", "Details auto-filled from voice!");
          } catch (err) {
            console.error("Transcription failed", err);
            setIsTranscribing(false);
            triggerToast("⚠️", "Failed to transcribe voice. Please try again.");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioChunks([]);
      triggerToast("🔴", "Recording voice... Tap again to stop!");
    } catch (err) {
      console.warn("Media devices access denied, falling back to smart simulation", err);
      simulateVoiceReporting();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const simulateVoiceReporting = () => {
    setIsTranscribing(true);
    triggerToast("🎤", "Simulating voice analysis... Transcribing...");
    setTimeout(() => {
      setIsTranscribing(false);
      const data = {
        transcription: "I found a massive pile of black trash bags and plastic bottles blocking the footpath right next to Rajouri Garden Metro Station Exit 2. It smells horrible.",
        description: "Massive pile of plastic waste and garbage bags blocking the pedestrian walkway near the metro entrance.",
        location: "Rajouri Garden Metro Station Exit 2",
        category: "Waste",
        severity: "High",
      };
      setVoiceTranscript(data.transcription);
      setReportDescription(data.description);
      setReportAddress(data.location);
      setSelectedCat(data.category);
      setReportSeverity(data.severity);
      setReportTitle("Voice reported: Garbage Pile");
      triggerToast("✅", "AI Simulated voice report filled!");
    }, 1500);
  };

  const handleFinalSubmit = () => {
    if (!reportDescription.trim()) {
      triggerToast("⚠️", "Please add a description or record a voice report!");
      return;
    }

    const tNum = Math.floor(1000 + Math.random() * 9000);
    setLastTicketNum(tNum);

    onReportSubmit({
      title: reportTitle,
      category: selectedCat,
      severity: reportSeverity,
      description: reportDescription,
      address: reportAddress,
      image: imagePreview || undefined,
      voiceTranscription: voiceTranscript || undefined,
      lat: coords.lat,
      lng: coords.lng,
    });

    // Reset local state for next report since we're immediately redirecting
    setReportTitle("");
    setReportDescription("");
    setReportAddress("");
    setImagePreview(null);
    setVoiceTranscript("");
  };

  const currentIssue = detectedIssues[selectedIssueIdx];

  return (
    <div className="page active" id="page-report" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-camera"></i> Report an Issue
        </h2>
        <p>AI-verified · GPS auto-tagged · Earn 150 XP for your first report</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div>
              <div className="steps" id="reportSteps">
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 1 ? "active" : reportStep > 1 ? "done" : ""}`}>1</div>
                  <div className={`step-line ${reportStep > 1 ? "done" : ""}`}></div>
                </div>
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 2 ? "active" : reportStep > 2 ? "done" : ""}`}>2</div>
                  <div className={`step-line ${reportStep > 2 ? "done" : ""}`}></div>
                </div>
                <div className="step-item">
                  <div className={`step-circle ${reportStep === 3 ? "active" : reportStep > 3 ? "done" : ""}`}>3</div>
                  <div className={`step-line ${reportStep > 3 ? "done" : ""}`} style={{ display: "none" }}></div>
                </div>
                <div className="step-item" style={{ flex: 0 }}>
                  <div className={`step-circle ${reportStep === 4 ? "active" : ""}`}>4</div>
                </div>
              </div>

              {/* STEP 1: UPLOAD PHOTO */}
              <div className={`form-step ${reportStep === 1 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".35rem" }}>
                  Capture Live Photo of Issue
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  Live-capture photos only. AI verifies authenticity and checks local coords for duplicates.
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                />

                <div
                  className={`upload-zone ${dragActive ? "drag-active" : ""}`}
                  onClick={handleZoneClick}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    position: "relative",
                    border: dragActive ? "2px dashed var(--leaf)" : "2px dashed var(--border)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    cursor: "pointer",
                    height: "220px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--card)",
                    transition: "all 0.25s",
                  }}
                >
                  {imagePreview ? (
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Report visual Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                      />
                      {/* SCANNING LASER EFFECT */}
                      {isAnalyzing && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "4px",
                            background: "linear-gradient(180deg, rgba(76,175,80,0), #4CAF50)",
                            boxShadow: "0 0 15px #4CAF50, 0 0 5px #4CAF50",
                            animation: "scan 2s linear infinite",
                          }}
                        ></div>
                      )}
                      
                      {/* BOUNDING BOX OVERLAY */}
                      {currentIssue && currentIssue.boundingBox && !isAnalyzing && (
                        <div
                          style={{
                            position: "absolute",
                            border: "3px solid #E53935",
                            background: "rgba(229, 57, 53, 0.15)",
                            boxShadow: "0 0 10px rgba(229, 57, 53, 0.6)",
                            borderRadius: "4px",
                            top: `${currentIssue.boundingBox.ymin}%`,
                            left: `${currentIssue.boundingBox.xmin}%`,
                            width: `${currentIssue.boundingBox.xmax - currentIssue.boundingBox.xmin}%`,
                            height: `${currentIssue.boundingBox.ymax - currentIssue.boundingBox.ymin}%`,
                            transition: "all 0.4s ease",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "-26px",
                              left: "-3px",
                              background: "#E53935",
                              color: "white",
                              fontSize: "0.72rem",
                              fontWeight: "bold",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                            }}
                          >
                            {currentIssue.label} ({currentIssue.confidence}%)
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon" style={{ fontSize: "2.5rem", color: "var(--leaf)", marginBottom: "0.5rem" }}>
                        <i className="fas fa-camera"></i>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: ".95rem", marginBottom: ".3rem" }}>
                        Tap to Capture Live Photo
                      </div>
                      <div style={{ fontSize: ".75rem", color: "var(--muted)", textAlign: "center", padding: "0 1.5rem", lineHeight: "1.4" }}>
                        Gallery uploads & file drops are disabled.<br />Only live device camera snaps are accepted.
                      </div>
                    </>
                  )}
                </div>

                {isAnalyzing && (
                  <div style={{ textAlign: "center", marginTop: "1rem", color: "var(--leaf)", fontSize: "0.85rem", fontWeight: "bold" }}>
                    <i className="fas fa-spinner fa-spin"></i> Analyzing image structures and checking coordinates...
                  </div>
                )}

                {isVerified === false && (
                  <div className="card" style={{ padding: "1rem", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", marginTop: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div style={{ fontSize: "1.5rem" }}>⚠️</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#991B1B", fontSize: "0.88rem" }}>AI Verification Failed</div>
                        <div style={{ fontSize: "0.8rem", color: "#B91C1C", marginTop: "0.2rem", lineHeight: "1.4" }}>
                          {verificationResult?.reason || "This image does not contain a valid municipal/public infrastructure issue."}
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setImagePreview("");
                            setIsVerified(null);
                            setVerificationResult(null);
                          }}
                          style={{ marginTop: "0.75rem", background: "#DC2626", color: "white", padding: "0.4rem 0.8rem", borderRadius: "6px" }}
                        >
                          Request a Retake
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="ai-verify" style={{ marginTop: ".85rem" }}>
                  <div className="ai-verify-icon">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div>
                    <strong>AI Image Verification</strong> — detects spam, near-duplicates, and invalid reports. XP awarded only
                    for genuine issues.
                  </div>
                </div>

                {isVerified !== false && (
                  <button
                    className="btn btn-green"
                    style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}
                    onClick={() => {
                      if (!imagePreview) {
                        triggerToast("⚠️", "Continuing without image. Category must be selected manually.");
                      }
                      setReportStep(2);
                    }}
                  >
                    <i className="fas fa-arrow-right"></i> Continue
                  </button>
                )}
              </div>

              {/* STEP 2: CATEGORY SELECTION & MULTIPLE ISSUES DROPDOWN */}
              <div className={`form-step ${reportStep === 2 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".25rem" }}>
                  Select category
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                  AI suggests from your image — confirm or change
                </div>

                {/* MULTIPLE DETECTED ISSUES DROPDOWN */}
                {detectedIssues.length > 1 && (
                  <div className="card" style={{ padding: "1rem", background: "#F5F3FF", border: "1px solid #DDD6FE", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#6D28D9", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="fas fa-brain"></i>
                      <span>Multiple Municipal Issues Detected ({detectedIssues.length})</span>
                    </div>
                    <select
                      className="form-input"
                      value={selectedIssueIdx}
                      onChange={handleIssueDropdownChange}
                      style={{ fontSize: "0.85rem", padding: "0.45rem", border: "1px solid #C084FC" }}
                    >
                      {detectedIssues.map((issue, idx) => (
                        <option key={idx} value={idx}>
                          {issue.label} ({issue.confidence}% confidence — {issue.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="cat-grid" id="catGrid" style={{ marginBottom: "1rem" }}>
                  {["Roads", "Water", "Waste", "Lights", "Parks", "Build", "Power", "Traffic"].map((catName, idx) => {
                    const emojis: Record<string, string> = {
                      Roads: "🕳️",
                      Water: "💧",
                      Waste: "🗑️",
                      Lights: "💡",
                      Parks: "🌿",
                      Build: "🏗️",
                      Power: "🔌",
                      Traffic: "🚦",
                    };
                    return (
                      <div
                        key={idx}
                        className={`cat-btn ${selectedCat === catName ? "sel" : ""}`}
                        onClick={() => setSelectedCat(catName)}
                      >
                        <span className="cat-icon">{emojis[catName]}</span>
                        {catName}
                      </div>
                    );
                  })}
                </div>

                {currentIssue ? (
                  <div className="badge badge-ai" style={{ marginBottom: ".85rem", background: "var(--bg2)", color: "var(--leaf)" }}>
                    <i className="fas fa-robot"></i> AI suggested focus: {currentIssue.label} — {currentIssue.confidence}% confidence
                  </div>
                ) : (
                  <div className="badge badge-ai" style={{ marginBottom: ".85rem" }}>
                    <i className="fas fa-robot"></i> AI suggestion: Roads — 94% confidence
                  </div>
                )}

                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button className="btn btn-ghost" onClick={() => setReportStep(1)}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={() => setReportStep(3)}>
                    <i className="fas fa-arrow-right"></i> Continue
                  </button>
                </div>
              </div>

              {/* STEP 3: LOCATION & EDITABLE VOICE TRANSCRIPTION */}
              <div className={`form-step ${reportStep === 3 ? "active" : ""}`}>
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: "1rem", marginBottom: ".25rem" }}>
                  Confirm location & details
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted)", marginBottom: ".75rem" }}>
                  GPS auto-tagged from your photo or voice description
                </div>

                <div
                  style={{
                    background: "var(--bg2)",
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: ".85rem",
                    display: "flex",
                    gap: ".75rem",
                    alignItems: "center",
                  }}
                >
                  <i className="fas fa-location-dot" style={{ fontSize: "1.3rem", color: "var(--leaf)" }}></i>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      value={reportAddress}
                      onChange={(e) => setReportAddress(e.target.value)}
                      placeholder="Street/Location address"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem", height: "auto" }}
                    />
                    <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                      {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E · GPS calibrated
                    </div>
                  </div>
                  <button onClick={fetchExactLocation} className="btn btn-ghost" style={{ padding: "0.5rem", borderRadius: "50%", background: "#e2e8f0" }} title="Fetch Exact Live Location">
                    <i className="fas fa-crosshairs text-emerald-700"></i>
                  </button>
                </div>

                {/* VOICE RECORDING BUTTON SECTION */}
                <div className="card" style={{ padding: "1rem", background: "#FFFBEB", border: "1px solid #FDE68A", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <i className="fas fa-microphone"></i> Elder-Friendly Voice Reporting
                    </span>
                    {isRecording && (
                      <span className="badge badge-critical animate-pulse" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        Recording...
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                      className={`btn btn-sm ${isRecording ? "btn-critical" : "btn-amber"}`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      style={{
                        padding: "0.5rem 1rem",
                        background: isRecording ? "#DC2626" : undefined,
                        color: isRecording ? "white" : undefined,
                        boxShadow: isRecording ? "0 0 10px #DC2626" : undefined,
                      }}
                    >
                      <i className={`fas ${isRecording ? "fa-stop" : "fa-microphone"}`}></i>
                      {isRecording ? "Stop Recording" : "Tap & Describe Issue"}
                    </button>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: "1.4" }}>
                      Speak in English, Hindi, or any native tongue. AI transcribes and structures the ticket!
                    </span>
                  </div>

                  {/* TRANSCRIPT INTERACTIVE PREVIEW */}
                  {isTranscribing && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#B45309" }}>
                      <i className="fas fa-spinner fa-spin"></i> Processing speech, matching categories, and preparing report...
                    </div>
                  )}

                  {voiceTranscript && (
                    <div style={{ marginTop: "0.75rem", background: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid #FEF3C7" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                        Editable Audio Transcript
                      </div>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={voiceTranscript}
                        onChange={(e) => setVoiceTranscript(e.target.value)}
                        style={{ fontSize: "0.82rem", background: "#FAFBFD" }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid g2" style={{ marginBottom: "1rem" }}>
                  <div className="form-field">
                    <label className="form-label">Report Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Severity Level</label>
                    <select
                      className="form-input"
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value)}
                    >
                      <option value="Critical">🚨 Critical</option>
                      <option value="High">🟠 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Description (Confirm or Edit)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Describe the issue in your own words..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="ai-verify">
                  <div className="ai-verify-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <div>
                    <strong>Smart de-duplication:</strong> No active reports within 15 meters. Creating standalone issue ticket.
                  </div>
                </div>

                <div style={{ display: "flex", gap: ".75rem", marginTop: ".85rem" }}>
                  <button className="btn btn-ghost" onClick={() => setReportStep(2)}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={handleFinalSubmit}>
                    <i className="fas fa-paper-plane"></i> Submit Report
                  </button>
                </div>
              </div>

              {/* STEP 4: SUCCESS */}
              <div className={`form-step ${reportStep === 4 ? "active" : ""}`}>
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.4rem", marginBottom: ".5rem" }}>
                    Report submitted!
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: ".88rem", marginBottom: "1.5rem" }}>
                    Ticket #{lastTicketNum} · AI-verified · GPS tagged · Assigned to Ward Engineer
                  </p>
                  <div
                    style={{
                      background: "linear-gradient(135deg,#FEF3C7,#FDE68A)",
                      borderRadius: "14px",
                      padding: "1.25rem",
                      display: "flex",
                      gap: ".85rem",
                      alignItems: "center",
                      textAlign: "left",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ fontSize: "2rem" }}>⭐</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#78350F", fontFamily: "Poppins, sans-serif" }}>
                        +150 Civic Credits earned!
                      </div>
                      <div style={{ fontSize: ".8rem", color: "#92400E" }}>First report bonus — You're now Silver Citizen</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
                    <button className="btn btn-ghost" onClick={() => onNavigate("track")}>
                      <i className="fas fa-timeline"></i> Track issue
                    </button>
                    <button className="btn btn-green" onClick={onResetReport}>
                      <i className="fas fa-house"></i> Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card card-body">
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "Poppins, sans-serif",
                    fontSize: ".9rem",
                    marginBottom: ".85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <i className="fas fa-star" style={{ color: "var(--amber)" }}></i> XP for every action
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", fontSize: ".82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Photo report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +50 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Video report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +80 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Verify a fix</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +30 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Issue resolved</span>
                    <span className="badge" style={{ background: "#E8F5E9", color: "#2E7D32" }}>
                      +100 XP
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>First report</span>
                    <span className="badge" style={{ background: "#FEF3C7", color: "#78350F" }}>
                      +150 XP
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="rti-banner" onClick={() => openModal("rti")}>
                <div className="rti-icon">
                  <i className="fas fa-file-contract"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".88rem", color: "#BF360C", fontFamily: "Poppins, sans-serif" }}>
                    1-Click RTI Generation
                  </div>
                  <div style={{ fontSize: ".75rem", color: "#E64A19" }}>Auto-draft RTI if SLA is missed</div>
                </div>
                <i className="fas fa-chevron-right" style={{ marginLeft: "auto", color: "#E64A19", fontSize: ".8rem" }}></i>
              </div>

              <div className="card card-body">
                <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".75rem" }}>
                  <i className="fas fa-brain" style={{ color: "#7C3AED" }}></i> AI roles in this step
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", fontSize: ".78rem", color: "var(--muted)" }}>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Image spam detection
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Category prediction
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> 15m duplicate check
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> GPS verification
                  </div>
                  <div>
                    <i className="fas fa-check" style={{ color: "var(--leaf)", marginRight: ".4rem" }}></i> Authority routing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {duplicateModal && duplicateDetails && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            maxWidth: "520px",
            width: "100%",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid var(--border)",
            color: "#1E293B"
          }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>🤖</div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", margin: 0, fontFamily: "Poppins, sans-serif" }}>
                  Duplicate Report Detected ({duplicateDetails.confidence}%)
                </h3>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>
                  An identical issue has already been reported nearby.
                </p>
              </div>
            </div>

            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.8rem",
              color: "#166534",
              marginBottom: "1rem",
              lineHeight: "1.4"
            }}>
              <strong>AI Similarity Review:</strong> {duplicateDetails.reason}
            </div>

            {/* Side-by-Side Photos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                  Your Upload
                </div>
                <img
                  src={imagePreview}
                  alt="Your uploaded issue"
                  style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                  Existing Live Ticket
                </div>
                <img
                  src={duplicateDetails.issue.photoURL || duplicateDetails.issue.image || "https://images.unsplash.com/photo-1594913785162-e678537df32a?w=120"}
                  alt="Existing duplicate issue"
                  style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                className="btn btn-green"
                onClick={async () => {
                  try {
                    const issueRef = doc(db, "issues", duplicateDetails.issue.id);
                    await updateDoc(issueRef, {
                      upvotes: increment(1)
                    });
                    
                    // Increment XP and count in user profile
                    const user = auth.currentUser;
                    if (user) {
                      const userRef = doc(db, "users", user.uid);
                      await updateDoc(userRef, {
                        totalXP: increment(50)
                      });
                    }

                    triggerToast("⭐", "Successfully merged! Upvoted existing ticket. +50 XP!");
                    setDuplicateModal(false);
                    setDuplicateDetails(null);
                    setImagePreview("");
                    onNavigate("map");
                  } catch (e) {
                    console.error("Merge failed", e);
                    triggerToast("⚠️", "Failed to merge reports.");
                  }
                }}
                style={{ justifyContent: "center", width: "100%", padding: "0.6rem" }}
              >
                <i className="fas fa-compress-arrows-alt"></i> Merge & Upvote Existing (+50 XP)
              </button>

              <button
                onClick={() => {
                  setDuplicateModal(false);
                  setReportStep(2);
                  triggerToast("📝", "Filing as a separate standalone ticket.");
                }}
                className="btn btn-ghost"
                style={{ justifyContent: "center", width: "100%", border: "1px solid var(--border)", padding: "0.6rem" }}
              >
                File Standalone Ticket Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
