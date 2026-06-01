import { Schema } from "effect";

export const SeriesId = Schema.Literals(["f1", "f2", "f3", "academy"]);
export type SeriesId = typeof SeriesId.Type;

export const SessionType = Schema.Literals(["practice", "qualifying", "sprint", "race", "other"]);
export type SessionType = typeof SessionType.Type;

export class ScheduleEvent extends Schema.Class<ScheduleEvent>("ScheduleEvent")({
  uid: Schema.String,
  summary: Schema.String,
  startTime: Schema.String,
  endTime: Schema.String,
  location: Schema.String,
  sessionType: SessionType,
  meetingName: Schema.String,
}) {}

export class SeriesSchedule extends Schema.Class<SeriesSchedule>("SeriesSchedule")({
  series: SeriesId,
  lastRefreshed: Schema.String,
  events: Schema.Array(ScheduleEvent),
}) {}
