import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Test Connection as commanded in rules
export async function validateConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[CivicAI] Firestore connection validated successfully.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("[CivicAI] Firestore is offline or config is invalid.");
    }
  }
}

// validateConnection();
