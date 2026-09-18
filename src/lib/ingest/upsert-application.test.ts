import { describe, it, expect } from "vitest";
import { onlyProvided } from "./upsert-application";

describe("onlyProvided", () => {
  it("keeps fields the email actually carried", () => {
    expect(
      onlyProvided({ interview_date: "2026-03-01", interview_time: "10:00" })
    ).toEqual({ interview_date: "2026-03-01", interview_time: "10:00" });
  });

  it("drops nulls so a later email cannot erase an interview date", () => {
    // The case this exists for: a rejection carries no interview details, and
    // spreading its nulls would wipe the date an earlier email established.
    expect(
      onlyProvided({
        interview_date: null,
        interview_time: null,
        location: null,
        notes: "Rejected after final round",
      })
    ).toEqual({ notes: "Rejected after final round" });
  });

  it("drops undefined as well as null", () => {
    expect(onlyProvided({ a: undefined, b: 1 })).toEqual({ b: 1 });
  });

  it("returns nothing when the email carried no details", () => {
    expect(onlyProvided({ interview_date: null, location: null })).toEqual({});
  });

  it("keeps falsy values that are not null", () => {
    // An empty string is a real value the parser chose; only null means absent.
    expect(onlyProvided({ notes: "", count: 0, flag: false })).toEqual({
      notes: "",
      count: 0,
      flag: false,
    });
  });
});
