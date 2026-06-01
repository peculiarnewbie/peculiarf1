import type { SessionType } from "./types.ts";

export interface RawICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location: string;
}

const EMOJI_MAP: Record<string, SessionType> = {
  "\u{1F3CE}": "practice",
  "\u{23F0}\u{FE0F}": "qualifying",
  "\u{1F3C1}": "race",
};

export function detectSessionType(summary: string): SessionType {
  for (const [emoji, type] of Object.entries(EMOJI_MAP)) {
    if (summary.startsWith(emoji)) return type;
  }
  if (summary.toLowerCase().includes("sprint")) return "sprint";
  return "other";
}

export function extractMeetingName(summary: string): string {
  let cleaned = summary.replace(
    /^[\u{1F300}-\u{1F9FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2600}-\u{26FF}]+\s*/u,
    "",
  );
  cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, "").trim();
  const dashIndex = cleaned.lastIndexOf(" - ");
  return dashIndex > 0 ? cleaned.slice(0, dashIndex).trim() : cleaned;
}

export function parseICalDate(dateStr: string): string | null {
  if (!dateStr) return null;

  if (dateStr.endsWith("Z")) {
    const m = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString();
  }

  const m = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d)).toISOString();
  }

  return null;
}

export function parseICal(icalText: string): RawICalEvent[] {
  const text = icalText.replace(/\r\n/g, "\n");
  const events: RawICalEvent[] = [];

  const blocks = text.split(/(?=\nBEGIN:VEVENT)/g);
  for (const block of blocks) {
    if (!block.includes("BEGIN:VEVENT")) continue;

    const lines: string[] = [];
    const rawLines = block.split("\n");
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (line.startsWith(" ") || line.startsWith("\t")) {
        if (lines.length > 0) lines[lines.length - 1] += line.trim();
      } else {
        lines.push(line);
      }
    }

    const fields: Record<string, string> = {};
    for (const line of lines) {
      const sep = line.indexOf(":");
      if (sep === -1) continue;
      const key = line.slice(0, sep).split(";")[0];
      fields[key] = line.slice(sep + 1);
    }

    if (fields.SUMMARY && fields.UID) {
      events.push({
        uid: fields.UID,
        summary: fields.SUMMARY,
        dtstart: fields.DTSTART ?? "",
        dtend: fields.DTEND ?? "",
        location: fields.LOCATION ?? "",
      });
    }
  }

  return events;
}
