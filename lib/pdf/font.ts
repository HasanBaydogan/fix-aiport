import type { jsPDF } from "jspdf";

let fontLoaded = false;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** Embed Roboto for Turkish characters in client-side PDF exports. */
export async function ensurePdfFont(doc: jsPDF): Promise<void> {
  if (fontLoaded) {
    doc.setFont("Roboto", "normal");
    return;
  }

  const res = await fetch("/fonts/Roboto-Regular.ttf");
  if (!res.ok) {
    doc.setFont("helvetica", "normal");
    return;
  }

  const buffer = await res.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  doc.addFileToVFS("Roboto-Regular.ttf", base64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");
  fontLoaded = true;
}

export function pdfFileName(prefix: string, siteLabel?: string | null): string {
  const date = new Date().toISOString().slice(0, 10);
  const site = siteLabel ? `-${siteLabel.replace(/\s+/g, "-")}` : "";
  return `${prefix}${site}-${date}.pdf`;
}
