import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
import type { SeriesSchedule, ScheduleEvent } from "../lib/api.ts";
import { seriesLabel, SESSION_LABELS } from "../lib/api.ts";
import { SessionCard } from "./SessionCard.tsx";

interface ScheduleViewProps {
  data: SeriesSchedule;
}

interface MeetingGroup {
  name: string;
  events: ScheduleEvent[];
  dates: string[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function extractSessionName(summary: string, meetingName: string): string {
  let cleaned = summary.replace(
    /^[\u{1F300}-\u{1F9FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2600}-\u{26FF}]+/u,
    "",
  );
  cleaned = cleaned.replace(
    new RegExp(`^${meetingName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-\\s*`),
    "",
  );
  return cleaned.trim();
}

function NextEventHero(props: { event: ScheduleEvent }) {
  const [now, setNow] = createSignal(Date.now());

  onMount(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    onCleanup(() => clearInterval(interval));
  });

  const countdown = () => {
    const diff = new Date(props.event.startTime).getTime() - now();
    return diff > 0 ? formatDuration(diff) : "Started";
  };

  const startLocal = () => {
    const d = new Date(props.event.startTime);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sessionName = () => extractSessionName(props.event.summary, props.event.meetingName);

  return (
    <div class="next-event-hero">
      <div class="hero-label">Next Up</div>
      <div class="hero-meeting">{props.event.meetingName}</div>
      <div class="hero-session">
        {sessionName() || SESSION_LABELS[props.event.sessionType]}
        {props.event.location ? ` \u2022 ${props.event.location}` : ""}
      </div>
      <div class="hero-time">{startLocal()}</div>
      <div class="hero-countdown" classList={{ started: countdown() === "Started" }}>
        {countdown() === "Started" ? "Session underway" : countdown()}
      </div>
    </div>
  );
}

export function ScheduleView(props: ScheduleViewProps) {
  const now = () => Date.now();

  const upcoming = () =>
    props.data.events
      .filter((e) => new Date(e.startTime).getTime() > now())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextEvent = () => upcoming()[0];
  const nextUid = () => nextEvent()?.uid;

  const groups = () => {
    const map = new Map<string, MeetingGroup>();
    for (const e of props.data.events) {
      let g = map.get(e.meetingName);
      if (!g) {
        g = { name: e.meetingName, events: [], dates: [] };
        map.set(e.meetingName, g);
      }
      g.events.push(e);
      g.dates.push(e.startTime);
    }
    return [...map.values()]
      .filter((g) => g.events.some((e) => new Date(e.startTime).getTime() > now()))
      .sort((a, b) => {
        const aMin = Math.min(...a.dates.map((d) => new Date(d).getTime()));
        const bMin = Math.min(...b.dates.map((d) => new Date(d).getTime()));
        return aMin - bMin;
      });
  };

  return (
    <div>
      <div class="series-label">
        {seriesLabel(props.data.series)} &bull; {props.data.events.length} sessions
      </div>

      <Show when={nextEvent()}>{(e) => <NextEventHero event={e()} />}</Show>

      <For each={groups()}>
        {(g) => {
          const dates = g.dates.map((d) => formatDate(d));
          const range =
            dates.length > 1 ? dates[0] + " \u2192 " + dates[dates.length - 1] : dates[0];
          return (
            <div class="meeting-group">
              <div class="meeting-header">
                <div class="meeting-name">{g.name}</div>
                <div class="meeting-date">{range}</div>
              </div>
              <div class="session-list">
                <For each={g.events}>
                  {(e) => <SessionCard event={e} isNext={e.uid === nextUid()} />}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
