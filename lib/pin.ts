/**
 * Normaliza PIN: remove espaços/traços, uppercase e trim.
 * Ex.: "CCR-ADM-9073" => "CCRADM9073"
 */
export function normalizePin(s: string) {
  return String(s || "").replace(/[\s-]+/g, "").toUpperCase().trim();
}

/* =========================
 * Tipos compartilhados
 * =======================*/
export type ApiOk<T=unknown> = T & { ok: true };
export type ApiErr = { ok: false; error?: string };

export type AdminConfiguredResp = ApiOk<{ configured: boolean; source: "env" | "db" | undefined }> | ApiErr;
export type SetupAdminPinResp = ApiOk<{ adminPin: string }> | ApiErr;
export type LoginResp = ApiOk<{ role: "admin" | "judge" | "coord"; eventId: string | null }> | ApiErr;

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

/* =========================
 * Admin PIN helpers (login)
 * =======================*/

/** GET /api/admin-pin — verifica se há PIN admin configurado (env ou db) */
export async function adminConfigured(): Promise<AdminConfiguredResp> {
  const res = await fetch("/api/admin-pin", { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` };
  // data: { ok:true, configured:boolean, source:"env"|"db" }
  return { ok: true, configured: !!data?.configured, source: data?.source };
}

/** POST /api/admin-pin — define/rotaciona PIN admin no banco (se não houver ENV) */
export async function setupAdminPin(pin?: string, rotate?: boolean): Promise<SetupAdminPinResp> {
  const body: any = {};
  if (rotate) body.rotate = true;
  if (pin) body.adminPin = normalizePin(pin);

  const res = await fetch("/api/admin-pin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` };

  // API retorna { ok:true, adminPin: <normalizado> }
  return { ok: true, adminPin: data?.adminPin };
}

/** POST /api/pin-login — tenta login por PIN (admin/juiz/coord) */
export async function loginByPin(pin: string): Promise<LoginResp> {
  const res = await fetch("/api/pin-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ pin: normalizePin(pin) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data?.error || `http_${res.status}` };
  return { ok: true, role: data?.role, eventId: data?.eventId ?? null };
}

/** Verifica se um PIN é de admin (não altera sessão) */
export async function checkAdminPin(pin: string): Promise<ApiOk<{}> | ApiErr> {
  const r = await loginByPin(pin);
  if (!r.ok) return r;
  return r.role === "admin" ? { ok: true } : { ok: false, error: "not_admin" };
}

/* =========================
 * Event PINs helpers (gestor)
 * =======================*/

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
 * Uso 1: setEventPins(eventId, { rotate:true })
 * Uso 2: setEventPins(eventId, { judgePin, coordPin })
 * Uso 3: setEventPins(eventId, judgePin, coordPin)  // compatibilidade legado
 */
export async function setEventPins(eventId: string, body: SetEventPinsBody): Promise<SetEventPinsResp>;
export async function setEventPins(eventId: string, judgePin: string, coordPin: string): Promise<SetEventPinsResp>;
export async function setEventPins(
  eventId: string,
  arg2: SetEventPinsBody | string,
  arg3?: string
): Promise<SetEventPinsResp> {
  let payload: SetEventPinsBody;
  if (typeof arg2 === "string") {
    payload = { judgePin: normalizePin(arg2), coordPin: normalizePin(arg3 || "") };
  } else {
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
