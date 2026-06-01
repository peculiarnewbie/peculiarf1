import type { ScheduleEvent } from "../lib/api.ts";

interface SessionCardProps {
  event: ScheduleEvent;
  isNext?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isPast(end: string): boolean {
  return new Date(end).getTime() <= Date.now();
}

export function SessionCard(props: SessionCardProps) {
  const e = props.event;
  const past = isPast(e.endTime);

  return (
    <div class="session-card" classList={{ "is-past": past, "is-next": props.isNext }}>
      <div class="session-info">
        <div class="session-summary">{e.summary}</div>
        <div class="session-location">{e.location}</div>
      </div>
      <div class="session-time">
        <span class="date">{formatDate(e.startTime)}</span>
        {formatTime(e.startTime)}–{formatTime(e.endTime)}
      </div>
    </div>
  );
}
