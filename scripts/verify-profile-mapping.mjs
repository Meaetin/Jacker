// Checks the profile → autofill mapping: degree levels, skills cleanup, and
// tolerance of rows saved before a field existed.
//
// Both modules import only types, so Node's type stripping loads the .ts files
// directly and no test runner is needed.
//
//   node scripts/verify-profile-mapping.mjs

import { normalizeProfileData } from "../src/lib/profile/defaults.ts";
import { toAutofillProfile } from "../src/lib/profile/autofill-profile.ts";

const results = [];
const check = (name, actual, expected) => {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ name, pass, actual, expected });
};

const NO_CV = { filename: null, markdown: null };

function levelOf(degree) {
  const profile = toAutofillProfile(
    normalizeProfileData({
      education: [{ degree, institution: "", field_of_study: "", start_date: "", end_date: "", grade: "" }],
    }),
    NO_CV,
  );
  return profile.education[0].degree_aliases[0] ?? null;
}

// --- degree levels --------------------------------------------------------
// A form offers these as a fixed dropdown, so the stored wording has to resolve
// to the right level or the field cannot be filled at all.

check("Verbose bachelor's resolves", levelOf("Bachelor of Science (Honours) in Applied Computing, Part-Time"), "Bachelor's Degree");
check("Diploma stays a diploma", levelOf("Diploma in Information Technology"), "Diploma");
check("Polytechnic diploma stays a diploma", levelOf("Nanyang Polytechnic Diploma"), "Diploma");
check("PhD resolves to doctorate", levelOf("PhD in Physics"), "Doctorate");
check("MBA resolves to master's", levelOf("MBA"), "Master's Degree");
check("MSc resolves to master's", levelOf("MSc Data Science"), "Master's Degree");
check("BEng resolves to bachelor's", levelOf("BEng Mechanical Engineering"), "Bachelor's Degree");
check("BA resolves to bachelor's", levelOf("BA Economics"), "Bachelor's Degree");
check("Certificate resolves", levelOf("Certificate in Accounting"), "Certificate");
check("A-Levels resolve to high school", levelOf("GCE A-Level"), "High School");
// The anchoring that stopped "Diploma" reading as an MA also stops a word that
// merely contains "master" from being read as a master's degree.
check("An unknown qualification resolves to nothing", levelOf("Grandmaster of Vibes"), null);
check("A blank degree resolves to nothing", levelOf(""), null);

// --- skills ---------------------------------------------------------------

const withSkills = toAutofillProfile(
  normalizeProfileData({ skills: ["TypeScript", "typescript ", " React", "", null, "PostgreSQL", 42] }),
  NO_CV,
);
check("Skills dedupe case-insensitively and drop junk", withSkills.skills, ["TypeScript", "React", "PostgreSQL"]);
check("Missing skills become an empty list", toAutofillProfile(normalizeProfileData({}), NO_CV).skills, []);

// --- tolerance of old rows -------------------------------------------------

for (const [name, input] of [
  ["a row with no personal_details", { candidate: { full_name: "Martin Teo" } }],
  ["an empty object", {}],
  ["null", null],
  ["undefined", undefined],
]) {
  let ok = true;
  try {
    toAutofillProfile(input, NO_CV);
  } catch {
    ok = false;
  }
  check(`${name} does not throw`, ok, true);
}

// The route normalises first, which is where the phone device default lands.
const normalised = toAutofillProfile(normalizeProfileData({ candidate: { full_name: "Martin Teo" } }), NO_CV);
check("Phone device type defaults to Mobile", normalised.identity.phone_device_type, "Mobile");
check("Name splits into first and last", [normalised.identity.first_name, normalised.identity.last_name], ["Martin", "Teo"]);
check("Preferred name falls back to the first name", normalised.identity.preferred_name, "Martin");

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
