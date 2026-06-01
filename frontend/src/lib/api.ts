export interface ScheduleEvent {
  uid: string;
  summary: string;
  startTime: string;
  endTime: string;
  location: string;
  sessionType: "practice" | "qualifying" | "sprint" | "race" | "other";
  meetingName: string;
}

export interface SeriesSchedule {
  series: "f1" | "f2" | "f3" | "academy";
  lastRefreshed: string;
  events: ScheduleEvent[];
}

const SERIES_LABELS: Record<string, string> = {
  f1: "F1",
  f2: "F2",
  f3: "F3",
  academy: "F1 Academy",
};

export function seriesLabel(id: string): string {
  return SERIES_LABELS[id] ?? id;
}

export const SESSION_LABELS: Record<string, string> = {
  practice: "Practice",
  qualifying: "Qualifying",
  sprint: "Sprint",
  race: "Race",
  other: "Other",
};

export async function fetchSchedules(): Promise<SeriesSchedule[]> {
  const r = await fetch("/api/schedules");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function refreshSchedules(): Promise<void> {
  const r = await fetch("/api/refresh", { method: "POST" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
}
