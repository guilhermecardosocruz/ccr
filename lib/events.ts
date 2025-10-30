import { loadJSON, saveJSON } from "./storage";
import { sha256 } from "./pin";

export type Event = { id: string; name: string; createdAt: number; archived?: boolean };

const EVENTS_KEY = "ccr-events"; // Event[]
export function listEvents(): Event[] {
  return loadJSON<Event[]>(EVENTS_KEY, []);
}
export function saveEvents(list: Event[]) {
  saveJSON(EVENTS_KEY, list);
}
export function createEvent(name: string): Event {
  const e: Event = { id: crypto.randomUUID(), name, createdAt: Date.now() };
  const list = listEvents(); list.push(e); saveEvents(list); return e;
}
export function findEvent(eventId: string): Event|undefined {
  return listEvents().find(e=>e.id===eventId);
}

/** Procura o evento pelo PIN (juiz/coord): retorna {eventId, role} se bater */
export async function matchPinAcrossEvents(pin: string): Promise<{eventId:string, role:"judge"|"coord"}|null> {
  const h = await sha256(pin.trim());
  const events = listEvents();
  for (const e of events) {
    const pins = loadJSON<{judgeHash:string|null;coordHash:string|null}>(`ccr-evt:${e.id}:pins`, {judgeHash:null,coordHash:null});
    if (pins.judgeHash === h) return { eventId: e.id, role: "judge" };
    if (pins.coordHash  === h) return { eventId: e.id, role: "coord"  };
  }
  return null;
}

/** Helpers de chaves por evento */
export function keyTeams(eventId:string){ return `ccr-evt:${eventId}:teams`; }
export function keyResults(eventId:string){ return `ccr-evt:${eventId}:results`; }
