// Checks that re-reading a CV can only add to a profile, never empty it.
//
// This is the data-loss path: a CV states a subset of what a profile holds, so
// a careless merge silently deletes the address, gender and notice period the
// user typed in by hand.
//
//   node scripts/verify-profile-merge.mjs

import { normalizeProfileData } from "../src/lib/profile/defaults.ts";
import { mergeProfileData } from "../src/lib/profile/merge-profile.ts";

const results = [];
const check = (name, actual, expected) => {
  results.push({ name, pass: JSON.stringify(actual) === JSON.stringify(expected), actual, expected });
};

const profile = (overrides) => normalizeProfileData(overrides);

// What the user has on file: a CV's worth of contact details, plus the fields
// only a human could have supplied.
const existing = profile({
  candidate: { full_name: "Martin Teo", email: "martin@old.com", phone: "+6591479553" },
  personal_details: {
    address: "12 Example Road",
    city: "Singapore",
    postal_code: "123456",
    gender: "Male",
    notice_period: "1 month",
  },
  skills: ["Figma", "TypeScript"],
  education: [{ institution: "SIT", degree: "Bachelor of Science", field_of_study: "Applied Computing", start_date: "2026", end_date: "2029", grade: "" }],
  ai_summary: "An older summary.",
});

// What a fresh CV yields: no address, no gender, no notice period.
const incoming = profile({
  candidate: { full_name: "Martin Teo", email: "martin@new.com", phone: "" },
  personal_details: { city: "Singapore" },
  skills: ["TypeScript", "React"],
  education: [{ institution: "SIT", degree: "Bachelor of Science (Honours)", field_of_study: "Applied Computing", start_date: "2026", end_date: "2029", grade: "" }],
  ai_summary: "A newer summary.",
});

const { merged, changed } = mergeProfileData(existing, incoming);

// --- nothing hand-entered is lost ----------------------------------------

check("Address survives a CV that omits it", merged.personal_details.address, "12 Example Road");
check("Gender survives", merged.personal_details.gender, "Male");
check("Notice period survives", merged.personal_details.notice_period, "1 month");
check("Phone survives an empty incoming value", merged.candidate.phone, "+6591479553");

// --- genuinely new values do land ----------------------------------------

check("A changed email is taken", merged.candidate.email, "martin@new.com");
check("A newer summary is taken", merged.ai_summary, "A newer summary.");
check("Education is replaced when the CV has entries", merged.education[0].degree, "Bachelor of Science (Honours)");

// --- skills are additive --------------------------------------------------

check("Skills union keeps the hand-added one", merged.skills, ["TypeScript", "React", "Figma"]);

// --- the change report is accurate ---------------------------------------

check("Email is reported changed", changed.includes("candidate.email"), true);
check("Skills are reported changed", changed.includes("skills"), true);
check("Education is reported changed", changed.includes("education"), true);
check("Untouched address is not reported", changed.includes("personal_details.address"), false);
check("Unchanged name is not reported", changed.includes("candidate.full_name"), false);
check("City, which matched already, is not reported", changed.includes("personal_details.city"), false);

// --- an extraction that found nothing changes nothing ---------------------

const empty = mergeProfileData(existing, profile({}));
check("An empty extraction leaves the profile identical", empty.merged, existing);
check("An empty extraction reports no changes", empty.changed, []);

// --- a first upload onto a blank profile ----------------------------------

const first = mergeProfileData(profile({}), incoming);
check("A first upload takes the CV's values", first.merged.candidate.email, "martin@new.com");
check("A first upload keeps the CV's education", first.merged.education.length, 1);

// --- whitespace is not a value -------------------------------------------

const blanks = mergeProfileData(existing, profile({ personal_details: { address: "   " } }));
check("A whitespace-only value does not overwrite", blanks.merged.personal_details.address, "12 Example Road");

// --- report ---------------------------------------------------------------

const failed = results.filter((r) => !r.pass);

for (const result of results) {
  console.log(`${result.pass ? "  ok  " : "FAIL  "}${result.name}`);
  if (!result.pass) {
    console.log(`        expected ${JSON.stringify(result.expected)}, got ${JSON.stringify(result.actual)}`);
  }
}

console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
