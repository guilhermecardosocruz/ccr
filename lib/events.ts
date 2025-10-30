export type Event = { id: string; name: string; createdAt: string; archived: boolean };

export async function listEvents(): Promise<Event[]> {
  const r = await fetch("/api/events", { cache: "no-store" });
  return r.json();
}

export async function createEvent(name: string): Promise<Event> {
  const r = await fetch("/api/events", {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ name })
  });
  const j = await r.json();
  if (!r.ok || !j?.ok) throw new Error(j?.error || "create_event_failed");
  return j.event as Event;
}

export async function listTeams(eventId: string): Promise<{id:string; name:string}[]> {
  const r = await fetch(`/api/events/${eventId}/teams`, { cache: "no-store" });
  return r.json();
}

export async function addTeam(eventId: string, name: string) {
  const r = await fetch(`/api/events/${eventId}/teams`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ name })
  });
  if (!r.ok) throw new Error("add_team_failed");
}

export async function renameTeam(eventId: string, oldName: string, newName: string) {
  const r = await fetch(`/api/events/${eventId}/teams`, {
    method: "PUT",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ oldName, newName })
  });
  if (!r.ok) throw new Error("rename_team_failed");
}

export async function deleteTeam(eventId: string, name: string) {
  const r = await fetch(`/api/events/${eventId}/teams`, {
    method: "DELETE",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ name })
  });
  if (!r.ok) throw new Error("delete_team_failed");
}

export async function clearTeamsAndRuns(eventId: string) {
  const r = await fetch(`/api/events/${eventId}/teams`, {
    method: "DELETE",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({})
  });
  if (!r.ok) throw new Error("clear_event_failed");
}

export type Run = { team: string; score: number; timeSec: number; at: number };

export async function listRuns(eventId: string): Promise<Run[]> {
  const r = await fetch(`/api/events/${eventId}/runs`, { cache: "no-store" });
  return r.json();
}

export async function addRun(eventId: string, teamName: string, score: number, timeSec: number, notes?: string) {
  const r = await fetch(`/api/events/${eventId}/runs`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ teamName, score, timeSec, notes })
  });
  const j = await r.json().catch(()=> ({}));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || "add_run_failed");
}

export async function clearRuns(eventId: string) {
  const r = await fetch(`/api/events/${eventId}/runs`, { method: "DELETE" });
  if (!r.ok) throw new Error("clear_runs_failed");
}
