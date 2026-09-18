import { describe, it, expect } from "vitest";
import { ApplicationIndex, toMatchable, type MatchableApplication } from "./application-index";
import { findExistingApplication } from "./match-application";

function app(over: Partial<MatchableApplication> & { id: string }): MatchableApplication {
  return {
    company: null,
    role: null,
    status: "applied",
    gmail_thread_id: null,
    application_updated_at: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

/** Builds an index without touching the database. */
function indexOf(rows: MatchableApplication[]): ApplicationIndex {
  const index = Object.create(ApplicationIndex.prototype) as ApplicationIndex;
  (index as unknown as { rows: MatchableApplication[] }).rows = [...rows];
  return index;
}

describe("ApplicationIndex matching", () => {
  it("matches a stored company that contains the parsed one, like ilike('%x%')", () => {
    const index = indexOf([
      app({ id: "a", company: "Stripe Payments", role: "Backend Engineer" }),
    ]);

    expect(index.byCompanyRole("stripe", "backend")?.id).toBe("a");
  });

  it("strips the legal suffix before matching, as the SQL helper did", () => {
    const index = indexOf([app({ id: "a", company: "Edufied", role: "Developer" })]);

    expect(index.byCompanyRole("Edufied Pte Ltd", "Developer")?.id).toBe("a");
  });

  it("does not match a null company or role", () => {
    const index = indexOf([app({ id: "a", company: null, role: "Engineer" })]);

    expect(index.byCompanyRole("Stripe", "Engineer")).toBeNull();
  });

  it("breaks a tie on updated_at, picking the same row order-by-limit-1 did", () => {
    const index = indexOf([
      app({ id: "old", company: "Acme", role: "Engineer", updated_at: "2026-01-01T00:00:00Z" }),
      app({ id: "new", company: "Acme", role: "Engineer", updated_at: "2026-06-01T00:00:00Z" }),
    ]);

    expect(index.byCompanyRole("Acme", "Engineer")?.id).toBe("new");
  });

  it("treats a % in the parsed company as a literal, not a wildcard", () => {
    // `ilike('%100%%')` would have matched anything; a substring test does not.
    const index = indexOf([app({ id: "a", company: "Acme", role: "Engineer" })]);

    expect(index.byCompanyRole("100%", "Engineer")).toBeNull();
  });

  it("finds by thread id", () => {
    const index = indexOf([app({ id: "a", gmail_thread_id: "t1" })]);

    expect(index.byThread("t1")?.id).toBe("a");
    expect(index.byThread("t2")).toBeNull();
  });
});

describe("ApplicationIndex.record", () => {
  it("makes an inserted application visible to the next email in the run", () => {
    const index = indexOf([]);
    expect(index.byCompanyRole("Fuku", "Engineer")).toBeNull();

    index.record(app({ id: "new", company: "Fuku", role: "Engineer" }));

    expect(index.byCompanyRole("Fuku", "Engineer")?.id).toBe("new");
    expect(index.size).toBe(1);
  });

  it("replaces a row rather than duplicating it, so the status stays current", () => {
    const index = indexOf([app({ id: "a", company: "Acme", role: "Engineer", status: "applied" })]);

    index.record(app({ id: "a", company: "Acme", role: "Engineer", status: "interview" }));

    expect(index.size).toBe(1);
    expect(index.byCompanyRole("Acme", "Engineer")?.status).toBe("interview");
  });
});

describe("findExistingApplication tier order", () => {
  const thread = app({ id: "by-thread", gmail_thread_id: "t1", company: "Acme", role: "Engineer" });
  const subject = app({ id: "by-subject", company: "SubjectCo", role: "Engineer" });
  const body = app({ id: "by-body", company: "BodyCo", role: "Engineer" });
  const sender = app({ id: "by-sender", company: "SenderCo", role: "Engineer" });

  it("prefers the thread over every company signal", () => {
    const index = indexOf([thread, subject, body, sender]);
    const match = findExistingApplication(index, "t1", "SubjectCo", "BodyCo", "SenderCo", "Engineer");

    expect(match?.id).toBe("by-thread");
  });

  it("prefers the subject company over the body and the sender", () => {
    const index = indexOf([subject, body, sender]);
    const match = findExistingApplication(index, "t1", "SubjectCo", "BodyCo", "SenderCo", "Engineer");

    expect(match?.id).toBe("by-subject");
  });

  it("falls to the body company when the subject one matches nothing", () => {
    const index = indexOf([body, sender]);
    const match = findExistingApplication(index, null, "SubjectCo", "BodyCo", "SenderCo", "Engineer");

    expect(match?.id).toBe("by-body");
  });

  it("falls to the sender company last", () => {
    const index = indexOf([sender]);
    const match = findExistingApplication(index, null, "SubjectCo", "BodyCo", "SenderCo", "Engineer");

    expect(match?.id).toBe("by-sender");
  });

  it("returns null when nothing matches", () => {
    const index = indexOf([sender]);

    expect(findExistingApplication(index, null, "Nope", null, null, "Engineer")).toBeNull();
  });

  it("needs a role — a company on its own never matches", () => {
    const index = indexOf([sender]);

    expect(findExistingApplication(index, null, "SenderCo", null, null, null)).toBeNull();
  });
});

describe("toMatchable", () => {
  it("defaults a missing status rather than leaving it undefined", () => {
    const row = toMatchable({ id: "a" });

    expect(row.status).toBe("unknown");
    expect(row.company).toBeNull();
    expect(row.updated_at).toBeTruthy();
  });
});
