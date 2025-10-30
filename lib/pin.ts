/** Utilidades de PIN consumindo a API */
export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

// Admin PIN
export async function adminConfigured(): Promise<boolean> {
  const res = await fetch("/api/admin-pin", { cache: "no-store" });
  const j = await res.json();
  return !!j?.configured;
}

export async function setupAdminPin(pin: string): Promise<void> {
  await fetch("/api/admin-pin", { method: "POST", headers: { "content-type":"application/json" }, body: JSON.stringify({ pin }) });
}

export async function checkAdminPin(pin: string): Promise<boolean> {
  const r = await fetch("/api/admin-pin", { method: "PUT", headers: { "content-type":"application/json" }, body: JSON.stringify({ pin }) });
  const j = await r.json();
  return !!j?.match;
}

// Event PINs
export async function setEventPins(eventId: string, judgePin: string, coordPin: string) {
  await fetch(`/api/events/${eventId}/pins`, {
    method: "PUT",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ judgePin, coordPin })
  });
}

export async function getEventPins(eventId: string): Promise<{ hasJudge: boolean; hasCoord: boolean }> {
  const r = await fetch(`/api/events/${eventId}/pins`, { cache: "no-store" });
  return r.json();
}

// Login por PIN (juiz/coord)
export async function loginByPin(pin: string): Promise<{ ok: boolean; role?: "judge"|"coord"; eventId?: string }> {
  const r = await fetch("/api/pin-login", {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ pin })
  });
  return r.json();
}
