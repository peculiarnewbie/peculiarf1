import { Effect } from "effect";
import { parseICal, parseICalDate, detectSessionType, extractMeetingName } from "./ical.ts";
import { ScheduleEvent, SeriesSchedule, type SeriesId, type SessionType } from "./types.ts";

const ICAL_FEEDS: Record<string, string> = {
  f1: "https://ics.ecal.com/ecal-sub/6a11618363b03e000225fce2/Formula%201.ics",
  f2: "https://ics.ecal.com/ecal-sub/6a11618363b03e000225fce2/Formula%202.ics",
  f3: "https://ics.ecal.com/ecal-sub/6a11618363b03e000225fce2/Formula%203.ics",
  academy: "https://ics.ecal.com/ecal-sub/6a118a3d556ecf0002c12d81/F1%20Academy.ics",
};

export const SeriesList: string[] = ["f1", "f2", "f3", "academy"];

function fetchText(url: string): Effect.Effect<string, Error> {
  return Effect.tryPromise({
    try: () =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
        return r.text();
      }),
    catch: (e) => (e instanceof Error ? e : new Error(String(e))),
  });
}

function parseSeriesICal(series: string, icalText: string): Effect.Effect<SeriesSchedule, Error> {
  return Effect.try({
    try: () => {
      const raw = parseICal(icalText);
      const junkPattern = /in your calendar|subscribe|reminder/i;
      const events = raw
        .filter((e) => !junkPattern.test(e.summary))
        .map((e) => {
          const startTime = parseICalDate(e.dtstart);
          const endTime = parseICalDate(e.dtend);
          if (!startTime || !endTime) return null;
          return new ScheduleEvent({
            uid: e.uid,
            summary: e.summary,
            startTime,
            endTime,
            location: e.location,
            sessionType: detectSessionType(e.summary) as SessionType,
            meetingName: extractMeetingName(e.summary),
          });
        })
        .filter((e): e is ScheduleEvent => e !== null)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return new SeriesSchedule({
        series: series as SeriesId,
        lastRefreshed: new Date().toISOString(),
        events,
      });
    },
    catch: (e) => new Error(`Failed to parse iCal for ${series}: ${e}`),
  });
}

export function refreshSeries(series: string): Effect.Effect<SeriesSchedule, Error> {
  const url = ICAL_FEEDS[series];
  if (!url) return Effect.fail(new Error(`Unknown series: ${series}`));
  return fetchText(url).pipe(Effect.flatMap((text) => parseSeriesICal(series, text)));
}

export function refreshAllSchedules(): Effect.Effect<SeriesSchedule[], Error> {
  return Effect.all(
    SeriesList.map((series) => refreshSeries(series)),
    { concurrency: 4 },
  );
}
