import { CivicReport, CarbonEntry } from "./types";

export interface AIReportAnalysis {
  predictedCategory: string;
  confidence: number;
  slaDeadlineDays: number;
  remediationTip: string;
  explainability: string;
}

export interface AICarbonTips {
  tips: string[];
  comparison: string;
  predictedImprovement: number;
}

export async function analyzeReport(
  title: string,
  description: string,
  category: string,
  imageBase64?: string
): Promise<AIReportAnalysis> {
  const res = await fetch("/api/gemini/analyze-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, category, imageBase64 }),
  });
  if (!res.ok) {
    throw new Error("Failed to analyze report using AI.");
  }
  return res.json();
}

export async function getCarbonTips(
  transportationKm: number,
  electricityKwh: number,
  wasteKg: number,
  totalCo2Kg: number
): Promise<AICarbonTips> {
  const res = await fetch("/api/gemini/carbon-tips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transportationKm, electricityKwh, wasteKg, totalCo2Kg }),
  });
  if (!res.ok) {
    throw new Error("Failed to get carbon tips.");
  }
  return res.json();
}

export async function encryptMfaSecret(secret: string): Promise<string> {
  const res = await fetch("/api/mfa/encrypt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  if (!res.ok) {
    throw new Error("Failed to encrypt MFA secret.");
  }
  const data = await res.json();
  return data.encryptedSecret;
}

export async function decryptMfaSecret(encryptedSecret: string): Promise<string> {
  const res = await fetch("/api/mfa/decrypt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encryptedSecret }),
  });
  if (!res.ok) {
    throw new Error("Failed to decrypt MFA secret.");
  }
  const data = await res.json();
  return data.secret;
}

export async function exportCSV(type: "reports" | "footprint", data: any[]) {
  const res = await fetch("/api/export/csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  });
  if (!res.ok) {
    throw new Error("Failed to export CSV.");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `civicai_${type}_export.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPDF(type: "reports" | "footprint", data: any[]) {
  const res = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  });
  if (!res.ok) {
    throw new Error("Failed to export PDF.");
  }
  return res.json();
}
