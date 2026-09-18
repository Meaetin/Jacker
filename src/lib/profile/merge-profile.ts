import type { CandidateProfileData } from "@/types/profile";

export interface MergeResult {
  merged: CandidateProfileData;
  /** Dotted paths whose value the CV actually changed, e.g. "candidate.email". */
  changed: string[];
}

/**
 * Folds a freshly extracted CV into the profile already on file.
 *
 * A CV states a subset of what an application form asks for — it rarely carries
 * a home address and never a gender — so a straight replace silently destroys
 * everything the user typed in by hand. The rule here is that the CV may only
 * add or overwrite, never blank out: an empty incoming value leaves the stored
 * one alone.
 */
export function mergeProfileData(
  existing: CandidateProfileData,
  incoming: CandidateProfileData,
): MergeResult {
  const changed: string[] = [];

  const mergeGroup = <T extends Record<string, string>>(
    group: string,
    before: T,
    after: T,
  ): T => {
    const result = { ...before };

    for (const key of Object.keys(after) as (keyof T & string)[]) {
      const next = (after[key] ?? "").trim();
      if (!next || next === (before[key] ?? "").trim()) continue;
      result[key] = next as T[keyof T & string];
      changed.push(`${group}.${key}`);
    }

    return result;
  };

  // Skills are additive: a skill the user added by hand is still theirs even
  // when this CV does not mention it.
  const mergedSkills = unionSkills(incoming.skills ?? [], existing.skills ?? []);
  if (!sameList(mergedSkills, existing.skills ?? [])) changed.push("skills");

  // Education and work history come from the CV as a complete set, so a
  // non-empty extraction replaces them outright rather than interleaving
  // near-duplicate entries. An empty one keeps whatever is already stored.
  const education = incoming.education?.length ? incoming.education : existing.education;
  if (incoming.education?.length && !sameJson(education, existing.education)) {
    changed.push("education");
  }

  const workExperience = incoming.work_experience?.length
    ? incoming.work_experience
    : existing.work_experience;
  if (incoming.work_experience?.length && !sameJson(workExperience, existing.work_experience)) {
    changed.push("work_experience");
  }

  const summary = (incoming.ai_summary ?? "").trim() || existing.ai_summary;
  if (summary !== existing.ai_summary) changed.push("ai_summary");

  return {
    merged: {
      candidate: mergeGroup("candidate", existing.candidate, incoming.candidate),
      personal_details: mergeGroup(
        "personal_details",
        existing.personal_details,
        incoming.personal_details,
      ),
      education,
      work_experience: workExperience,
      skills: mergedSkills,
      ai_summary: summary,
    },
    changed,
  };
}

function unionSkills(first: string[], second: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const skill of [...first, ...second]) {
    const trimmed = (skill ?? "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
