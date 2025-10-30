/**
 * Normaliza PIN: remove espaços/traços, uppercase e trim.
 * Ex.: "CCR-ADM-9073" => "CCRADM9073"
 */
export function normalizePin(s: string) {
  return String(s || "").replace(/[\s-]+/g, "").toUpperCase().trim();
}

export type EventPinsInfo = {
  ok: boolean;
  hasJudge?: boolean;
  hasCoord?: boolean;
  rotatedAt?: string | null;
  error?: string;
};

export type SetEventPinsBody = {
  rotate?: boolean;
  judgePin?: string;
  coordPin?: string;
};

export type SetEventPinsResp = {
  ok: boolean;
  pins?: { judgePin?: string; coordPin?: string };
  error?: string;
};

/** GET /api/events/[id]/pins */
export async function getEventPins(eventId: string): Promise<EventPinsInfo> {
  const url = `/api/events/${eventId}/pins`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as EventPinsInfo;
  if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` };
  return { ok: true, hasJudge: data.hasJudge, hasCoord: data.hasCoord, rotatedAt: data.rotatedAt ?? null };
}

/**
 * POST /api/events/[id]/pins
 * Uso 1: setEventPins(eventId, { rotate:true })       // rotaciona
 * Uso 2: setEventPins(eventId, { judgePin, coordPin })// define manual
 * Uso 3: setEventPins(eventId, judgePin, coordPin)    // compatibilidade legado
 */
export async function setEventPins(eventId: string, body: SetEventPinsBody): Promise<SetEventPinsResp>;
export async function setEventPins(eventId: string, judgePin: string, coordPin: string): Promise<SetEventPinsResp>;
export async function setEventPins(
  eventId: string,
  arg2: SetEventPinsBody | string,
  arg3?: string
): Promise<SetEventPinsResp> {
  // Monta o body aceitando 2 ou 3 argumentos
  let payload: SetEventPinsBody;
  if (typeof arg2 === "string") {
    // forma legacy: (eventId, judgePin, coordPin)
    payload = {
      judgePin: normalizePin(arg2),
      coordPin: normalizePin(arg3 || ""),
    };
  } else {
    // forma nova: (eventId, body)
    payload = { ...arg2 };
    if (payload.judgePin) payload.judgePin = normalizePin(payload.judgePin);
    if (payload.coordPin) payload.coordPin = normalizePin(payload.coordPin);
  }

  const url = `/api/events/${eventId}/pins`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as SetEventPinsResp;
  if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` };
  return { ok: true, pins: data?.pins };
}
