import { loadJSON, saveJSON } from "./storage";

export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

/** PINs globais do gestor */
const ADMIN_KEY = "ccr-admin-pins"; // { adminHash }
export type AdminPins = { adminHash: string|null };
export function getAdminPins(): AdminPins {
  return loadJSON<AdminPins>(ADMIN_KEY, { adminHash: null });
}
export function adminConfigured(): boolean {
  return !!getAdminPins().adminHash;
}
export async function setupAdminPin(adminPin: string) {
  const adminHash = await sha256(adminPin.trim());
  saveJSON(ADMIN_KEY, { adminHash });
}

/** PINs por evento */
export type EventPins = { judgeHash: string|null; coordHash: string|null };
export function getEventPins(eventId: string): EventPins {
  return loadJSON<EventPins>(`ccr-evt:${eventId}:pins`, { judgeHash: null, coordHash: null });
}
export async function setEventPins(eventId: string, judgePin: string, coordPin: string) {
  const judgeHash = await sha256(judgePin.trim());
  const coordHash = await sha256(coordPin.trim());
  saveJSON(`ccr-evt:${eventId}:pins`, { judgeHash, coordHash });
  // Guardar também em texto para mostrar no modal (somente no dispositivo atual)
  saveJSON(`ccr-evt:${eventId}:pins-plain`, { judgePin, coordPin });
}

/** Somente para ler os PINs em texto (UI do gestor) */
export function getEventPinsPlain(eventId: string): { judgePin?: string; coordPin?: string } {
  return loadJSON<{judgePin?:string; coordPin?:string}>(`ccr-evt:${eventId}:pins-plain`, {});
}
