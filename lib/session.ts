import { loadJSON, saveJSON, removeKey } from "./storage";

export type Role = "admin"|"judge"|"coord";
export type Session = {
  authed: boolean;
  role: Role|null;
  pin: string|null;       // PIN digitado (admin ou do evento)
  eventId: string|null;   // evento ativo (admin pode alternar)
};
const KEY = "ccr-session";

export function getSession(): Session {
  return loadJSON<Session>(KEY, { authed:false, role:null, pin:null, eventId:null });
}

export function setSession(s: Session) { 
  saveJSON(KEY, s); 
}

export function clearSession() { 
  removeKey(KEY); 
}

export function requireEventId(): string|null {
  const s = getSession(); 
  return s.eventId;
}
