// Checks the autofill field dictionary without a browser.
//
// The dictionary decides what lands in which box on a real job application, and
// its failure mode is silent: a wrong-but-plausible match looks like success
// until an employer reads it. These cases pin the traps that matter.
//
//   node scripts/verify-autofill-matcher.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const load = (relativePath) => {
  const source = readFileSync(resolve(here, "..", relativePath), "utf8");
  // The extension files are plain scripts that attach themselves to globalThis.
  new Function(source)();
};

load("chrome-extension/autofill/engine.js");
load("chrome-extension/autofill/matcher.js");

const { engine, matcher } = globalThis.__jackerAutofill;

const field = (key) => matcher.FIELDS.find((f) => f.key === key);

// A descriptor is what matcher.describe() produces from a real control.
const control = (overrides) => ({
  autocomplete: "",
  name: "",
  id: "",
  automationId: "",
  label: "",
  aria: "",
  placeholder: "",
  type: "text",
  kind: "text",
  ...overrides,
});

// Returns the key the dictionary would pick for a control, or null.
function bestKey(desc) {
  let best = null;
  for (const candidate of matcher.FIELDS.filter((f) => !f.group)) {
    const score = matcher.scoreField(desc, candidate);
    if (score >= 0.55 && (!best || score > best.score)) best = { key: candidate.key, score };
  }
  return best?.key ?? null;
}

const results = [];
const check = (name, actual, expected) => {
  const pass = actual === expected;
  results.push({ name, pass, actual, expected });
};

// --- the mis-fills that matter ------------------------------------------

check("Email maps to email", bestKey(control({ label: "Email", name: "email" })), "email");
check(
  "Confirm email is refused",
  bestKey(control({ label: "Confirm email", name: "email_confirm" })),
  null,
);
check(
  "Re-enter email is refused",
  bestKey(control({ label: "Re-enter your email address" })),
  null,
);
check(
  "The employer's company name is not treated as the candidate's name",
  bestKey(control({ label: "Company you are applying to", name: "target_company" })),
  null,
);
check(
  "First name does not fall through to full name",
  bestKey(control({ label: "First name", name: "first_name" })),
  "first_name",
);
check("Last name maps to last name", bestKey(control({ label: "Last name" })), "last_name");
check("Full name maps to full name", bestKey(control({ label: "Full name" })), "full_name");
check(
  "Bare 'Name' maps to full name",
  bestKey(control({ label: "Name", name: "name" })),
  "full_name",
);
check(
  "Username is not a name field",
  bestKey(control({ label: "Username", name: "username" })),
  null,
);
check(
  "Emergency contact phone is refused",
  bestKey(control({ label: "Emergency contact phone" })),
  null,
);

// --- attribute precedence -------------------------------------------------

check(
  "autocomplete beats an unhelpful label",
  bestKey(control({ label: "Line one", autocomplete: "address-line1", name: "q7" })),
  "address",
);
check(
  "autocomplete postal-code wins",
  bestKey(control({ label: "Code", autocomplete: "postal-code", name: "q9" })),
  "postal_code",
);
check(
  "Workday's automation id is usable when there is no label",
  bestKey(control({ automationId: "legalNameSection_firstName" })),
  "first_name",
);
check(
  "Greenhouse's bracketed field name is usable",
  bestKey(control({ name: "job_application[last_name]" })),
  "last_name",
);
check(
  "A placeholder alone can still match",
  bestKey(control({ placeholder: "LinkedIn profile URL" })),
  "linkedin",
);

// --- the NTT Data / Workday form that prompted these ---------------------

check(
  "'Street Name' maps to address",
  bestKey(control({ label: "Street Name" })),
  "address",
);
check(
  "'Given Name(s) - Western Script' maps to first name",
  bestKey(control({ label: "Given Name(s) - Western Script" })),
  "first_name",
);
check(
  "'Family Name - Western Script' maps to last name",
  bestKey(control({ label: "Family Name - Western Script" })),
  "last_name",
);
check("'Device Type' maps to phone device type", bestKey(control({ label: "Device Type" })), "phone_device_type");
check(
  "'Country Phone Code' is not mistaken for the phone number",
  bestKey(control({ label: "Country Phone Code" })),
  "phone_country_code",
);
check(
  "'Country Phone Code' is not mistaken for the address country",
  bestKey(control({ label: "Country Phone Code" })) === "country",
  false,
);
check("'Phone number' still maps to phone", bestKey(control({ label: "Phone number" })), "phone");
check("'Country' still maps to country", bestKey(control({ label: "Country" })), "country");
check("'City' maps to city", bestKey(control({ label: "City" })), "city");
check("'Postal Code' maps to postal code", bestKey(control({ label: "Postal Code" })), "postal_code");
check("'Address Line 2' maps to line 2", bestKey(control({ label: "Address Line 2" })), "address_line_2");
check("'State' maps to state", bestKey(control({ label: "State / Province" })), "state");
check("'Preferred name' maps to preferred name", bestKey(control({ label: "Preferred name" })), "preferred_name");
check(
  "Preferred name does not swallow the legal name field",
  bestKey(control({ label: "Legal full name" })),
  "full_name",
);

// --- link fields separate cleanly ----------------------------------------

check("LinkedIn maps to linkedin", bestKey(control({ label: "LinkedIn profile" })), "linkedin");
check("GitHub maps to github", bestKey(control({ label: "GitHub profile" })), "github");
check(
  "Personal website maps to portfolio, not linkedin",
  bestKey(control({ label: "Personal website" })),
  "portfolio",
);
check(
  "A field accepting either link gets the LinkedIn one",
  bestKey(control({ label: "LinkedIn or personal website" })),
  "linkedin",
);

// --- nationality is answerable, sponsorship is not ------------------------

check("Nationality maps to citizenship", bestKey(control({ label: "Nationality" })), "citizenship");
check(
  "Sponsorship is flagged sensitive",
  matcher.sensitiveHit(control({ label: "Will you require visa sponsorship?" }))?.key,
  "sponsorship",
);
check(
  "Employment Pass questions are flagged sensitive",
  matcher.sensitiveHit(control({ label: "Do you hold a valid Employment Pass?" }))?.key,
  "sponsorship",
);
check(
  "Gender is flagged sensitive",
  matcher.sensitiveHit(control({ label: "Gender" }))?.key,
  "demographics",
);
check(
  "Expected salary is flagged sensitive",
  matcher.sensitiveHit(control({ label: "Expected salary" }))?.key,
  "salary",
);
check(
  "Date of birth is flagged sensitive",
  matcher.sensitiveHit(control({ label: "Date of birth" }))?.key,
  "date_of_birth",
);
check(
  "An ordinary field is not flagged sensitive",
  matcher.sensitiveHit(control({ label: "Email" })),
  null,
);

// --- scoped groups --------------------------------------------------------

check(
  "School only matches inside the education group",
  matcher.scoreField(control({ label: "School" }), field("school")) >= 0.55,
  true,
);
check(
  "Education fields stay out of the page-level pass",
  bestKey(control({ label: "School" })),
  null,
);

// --- education labels from the reported form ------------------------------

for (const [label, key] of [
  ["Degree", "degree"],
  ["Field of study", "field_of_study"],
  ["Overall result (GPA)", "grade"],
  ["School", "school"],
]) {
  const field = matcher.FIELDS.find((f) => f.key === key);
  check(
    `'${label}' matches the ${key} field inside an education section`,
    matcher.scoreField(control({ label }), field) >= 0.55,
    true,
  );
}

check(
  "'Separate each skill with a comma' is recognised as a skills field",
  /skill|technolog|competenc|expertise|proficien/i.test("Separate each skill with a comma"),
  true,
);

// --- degree aliases reach a dropdown of levels ----------------------------

// What the profile stores versus what a form's dropdown actually offers.
const DEGREE_OPTIONS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate"];

check(
  "A verbose degree matches nothing on its own",
  engine.bestMatch("Bachelor of Science (Honours) in Applied Computing, Part-Time", DEGREE_OPTIONS),
  null,
);
check(
  "With its alias the same degree finds the right option",
  engine.bestMatch(
    ["Bachelor of Science (Honours) in Applied Computing, Part-Time", "Bachelor's Degree"],
    DEGREE_OPTIONS,
  )?.match,
  "Bachelor's Degree",
);
check(
  "A diploma does not get promoted to a bachelor's",
  engine.bestMatch(["Diploma in Information Technology", "Diploma"], DEGREE_OPTIONS)?.match,
  "Diploma",
);
check(
  "A master's alias picks the master's option",
  engine.bestMatch(["MSc Data Science", "Master's Degree"], DEGREE_OPTIONS)?.match,
  "Master's Degree",
);

// --- option matching ------------------------------------------------------

check("Exact option text scores 1", engine.similarity("Singapore", "Singapore"), 1);
check(
  "Country synonyms match",
  engine.similarity("United States", "USA") > 0.9,
  true,
);
check(
  "A decorated option still matches",
  engine.similarity("Singapore", "Singapore (SG)") > 0.7,
  true,
);
check(
  "Unrelated options do not match",
  engine.similarity("Singapore", "Malaysia") < 0.3,
  true,
);
check(
  "bestMatch picks the closest option",
  engine.bestMatch("Bachelor", ["Master's Degree", "Bachelor's Degree", "Diploma"])?.match,
  "Bachelor's Degree",
);
check(
  "bestMatch returns nothing when nothing is close",
  engine.bestMatch("Bachelor", ["Red", "Green", "Blue"]),
  null,
);

// --- report ---------------------------------------------------------------

const failed = results.filter((r) => !r.pass);

for (const result of results) {
  const mark = result.pass ? "  ok  " : "FAIL  ";
  console.log(`${mark}${result.name}`);
  if (!result.pass) {
    console.log(`        expected ${JSON.stringify(result.expected)}, got ${JSON.stringify(result.actual)}`);
  }
}

console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
