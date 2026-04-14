const LEGAL_SUFFIXES = [
  // Must be ordered longest-first so compound suffixes match before their parts
  "pte. ltd.",
  "pte.ltd.",
  "pte ltd",
  "sdn. bhd.",
  "sdn.bhd.",
  "sdn bhd",
  "pty. ltd.",
  "pty.ltd.",
  "pty ltd",
  "co., ltd.",
  "co. ltd.",
  "co.,ltd.",
  "co.ltd.",
  "pvt. ltd.",
  "pvt.ltd.",
  "pvt ltd",
  "ltd.",
  "ltd",
  "inc.",
  "inc",
  "llc",
  "llp",
  "corp.",
  "corp",
  "corporation",
  "gmbh",
  "b.v.",
  "n.v.",
  "s.a.",
  "s.a",
  "pte.",
  "pte",
  "co.",
];

export function normalizeCompany(name: string | null): string | null {
  if (!name) return null;

  let normalized = name.trim();

  const lower = normalized.toLowerCase();
  for (const suffix of LEGAL_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      normalized = normalized.slice(0, normalized.length - suffix.length);
      break;
    }
  }

  // Strip trailing punctuation and whitespace left after suffix removal
  normalized = normalized.replace(/[,.\s]+$/, "").trim();

  return normalized || null;
}
