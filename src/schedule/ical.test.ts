import { describe, expect, it } from "vitest";
import { detectSessionType, extractMeetingName, parseICal, parseICalDate } from "./ical.ts";

describe("detectSessionType", () => {
  it("detects race from emoji", () => {
    expect(detectSessionType("\u{1F3C1} FORMULA 1 GRAND PRIX - Race")).toBe("race");
  });

  it("detects practice from emoji", () => {
    expect(detectSessionType("\u{1F3CE} Practice 1")).toBe("practice");
  });

  it("detects qualifying from emoji", () => {
    expect(detectSessionType("\u{23F0}\u{FE0F} Qualifying")).toBe("qualifying");
  });

  it("detects sprint from text", () => {
    expect(detectSessionType("Sprint Race")).toBe("sprint");
  });

  it("defaults to other", () => {
    expect(detectSessionType("Some Event")).toBe("other");
  });
});

describe("extractMeetingName", () => {
  it("extracts meeting name before dash", () => {
    expect(extractMeetingName("FORMULA 1 GRAND PRIX - Race")).toBe("FORMULA 1 GRAND PRIX");
  });

  it("strips emoji prefix", () => {
    expect(extractMeetingName("\u{1F3C1} FORMULA 1 GRAND PRIX - Race")).toBe(
      "FORMULA 1 GRAND PRIX",
    );
  });
});

describe("parseICalDate", () => {
  it("parses UTC datetime", () => {
    const result = parseICalDate("20260524T160000Z");
    expect(result).toBe("2026-05-24T16:00:00.000Z");
  });

  it("parses date only", () => {
    const result = parseICalDate("20260524");
    expect(result).toBe("2026-05-24T00:00:00.000Z");
  });

  it("returns null for empty", () => {
    expect(parseICalDate("")).toBeNull();
  });
});

describe("parseICal", () => {
  const sampleICal = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:123
DTSTART:20260522T123000Z
DTEND:20260524T180000Z
SUMMARY:\u{1F3C1} GRAND PRIX - Race
LOCATION:Canada
END:VEVENT
BEGIN:VEVENT
UID:456
DTSTART:20260522T100000Z
DTEND:20260522T110000Z
SUMMARY:\u{1F3CE} Practice 1
LOCATION:Canada
END:VEVENT`;
  it("parses events from iCal text", () => {
    const events = parseICal(sampleICal);
    expect(events).toHaveLength(2);
    expect(events[0].uid).toBe("123");
    expect(events[0].summary).toContain("GRAND PRIX");
    expect(events[1].uid).toBe("456");
    expect(events[1].summary).toContain("Practice");
  });
});
