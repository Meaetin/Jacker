# Autofill research — how to interact with job application forms

Researched September 2026. Basis for the extension autofill feature: what exists,
what works, and the architecture every serious tool converges on.

## The two hard questions, answered

**How does the program interact with the site?** Through the Chrome extension, with a
content script in the user's real browser. Not a headless server browser. Job sites
run bot detection (Cloudflare Turnstile fingerprints automated browsers), and
applications need the user's real sessions plus their judgment before submit. A
content script in a logged-in Chrome is indistinguishable from the user.

**How do we handle wildly different forms?** A layered design, not one universal trick:

1. **Detect the platform** from URL + DOM. Most applications flow through a handful
   of ATS systems.
2. **Per-ATS adapters** — deterministic, hand-written logic for the big platforms.
   This is where most reliability comes from. In a crawl of 3,223 top (US/tech-skewed)
   employers: Greenhouse 49%, Workday 22%, Lever 8%, Ashby 7% — top three ≈ 79%.
3. **Generic heuristic engine** for everything else: match fields by `<label>`,
   `aria-label`, `name`, `placeholder`, `autocomplete` against the profile schema.
   Same approach as the browser's own autofill.
4. **LLM only as fallback** — classify fields the heuristics missed, draft answers to
   free-text screening questions. Feed it the accessibility tree, not screenshots
   (screenshots cost 6–10x the tokens and miss precise targets). Cache classifications
   per (domain, field signature) so each form costs tokens once.
5. **The user always clicks Submit.** Fill everything, stop at review.

Plus the highest-leverage feature nobody open-source has: **remember corrections**.
When the user manually fills a field the tool didn't recognize, store the answer keyed
on that field so it's automatic next time. That covers the long tail without code.

## Solved obstacles (the "101 things forms do differently")

| Obstacle | Working technique |
|---|---|
| React forms ignore `input.value = x` | Call the native setter from `HTMLInputElement.prototype` (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v)`), then dispatch `new InputEvent("input", { bubbles: true, inputType: "insertText", data: v })` and a bubbling `change`. Wrap in focus → set → blur so validation runs. Everything else depends on this. |
| Custom dropdowns (react-select) | Simulate the user: click the combobox, type the target text via the native-setter trick, wait for `role="listbox"`, click the matching `role="option"`. Fuzzy-match text ("United States" vs "USA"). |
| Multi-page wizards (Workday) | State machine: identify current step (Workday tags elements with `data-automation-id`), fill, click Next, wait for DOM to settle (MutationObserver + timeout), repeat. |
| "Add education/experience" repeaters | Click the add button once per entry, wait for the new fieldset to mount, fill scoped to that fieldset. Loop; no shortcut exists. |
| Greenhouse cross-origin iframe | `"all_frames": true` in the manifest with a match pattern for `boards.greenhouse.io` — Chrome injects the content script inside the iframe with full DOM access. Coordinate frames via the background service worker. |
| File upload (resume) | `new DataTransfer()`, add a `File`, assign `input.files`, dispatch bubbling `change`. For drop zones, dispatch a synthetic `drop` with the same DataTransfer. |
| Shadow DOM | Walk open roots recursively; for closed roots extensions get `chrome.dom.openOrClosedShadowRoot(element)`. |
| Hydration wiping values | Fill after the framework settles, verify each field kept its value, re-fill if wiped. Fill-only-if-empty throughout. |

## Landscape (verified Sept 2026)

The job-specific open-source space is a graveyard: AIHawk was abandoned and its repo
repurposed, most autofill extensions are <50 stars and stale. Nobody built the open
Simplify. Durable references:

- **[nanobrowser](https://github.com/nanobrowser/nanobrowser)** (14k★, Apache-2.0, active) —
  AI agent living *inside a Chrome extension*, user's own keys and sessions. Closest
  blueprint for Jacker.
- **[Auto-Apply-Helper](https://github.com/Kaitzz/Auto-Apply-Helper)** — compact working
  model: Greenhouse detection, react-select routine, fill-only-if-empty, safe mode
  during hydration, Claude for custom questions.
- **[ApplyPilot](https://github.com/Pickle-Pixel/ApplyPilot)** (1.6k★, AGPL — study only) —
  freshest end-to-end pipeline; LLM + Playwright MCP fills Workday. Read its prompts.
- **[Stagehand](https://github.com/browserbase/stagehand)** (24k★, MIT, TypeScript) —
  server-side option if ever needed: deterministic code, AI only where needed, cached.
- **[Playwright MCP](https://github.com/microsoft/playwright-mcp)** (Apache-2.0) — the
  a11y-snapshot-with-element-refs pattern to copy for LLM field matching.
- **[workday-autofill](https://github.com/jasonchen270/workday-autofill)** — reference
  for the Workday wizard state machine.
- Dead/skip: LaVague, lmnr-ai/index, Magnitude, the LinkedIn Easy Apply bots
  (selector arms race with LinkedIn).

Commercial pattern (Simplify Copilot, JobRight): content-script extension + hosted
profile + per-ATS mappings for the named platforms + heuristics elsewhere + LLM for
free text + remembered answers. No public teardown exists; inferred from docs and clones.

## Cautions

- **Workday is its own milestone**: per-company instances, separate accounts,
  `data-automation-id` drift between versions. Ship the easier adapters first.
- **Market-share data is US/tech-skewed.** See the Singapore section below — the local
  picture is completely different, and it changes the adapter order.
- **Maintenance is the real cost.** ATS DOMs change; selectors rot. Adapters should
  fail loudly and fall through to the heuristic layer.

## Singapore landscape (researched Sept 2026)

Two evidence sources: a survey of ~15 major SG employers' live careers URLs, and the
sender domains of 423 job emails in Jacker's own `raw_emails` table.

**Large employers split between two ATSes:**
- **Workday** — the entire public service (one tenant: `sggovterp.wd102.myworkdayjobs.com`,
  behind careers.gov.sg, incl. GovTech), Grab, OCBC, UOB, Deutsche Bank SG. Also the
  top employer ATS in the inbox data (11 emails).
- **SAP SuccessFactors** — Singtel, Singapore Airlines, Standard Chartered, Temasek,
  GIC (verified via `successfactors.com` assets / URL patterns). Absent from US-crawl
  top ranks; APAC is SAP/Workday territory.
- Greenhouse/Lever/Ashby appear mainly at foreign startups' SG offices (3 emails each
  in the inbox). Taleo is declining (DBS still on it; OCBC/UOB/StanChart migrated off).
- Shopee/Sea, TikTok, Google run bespoke in-house portals — no adapter possible.

**Boards matter more than in the US:**
- **MyCareersFuture** — government-run, board-native form (Singpass login, profile +
  resume, apply on-site). Near-universal posting coverage because Employment Pass
  fair-consideration rules require ads there. Cheapest adapter to build. Open question:
  whether Singpass-gated pages are reachable from a content script (they should be —
  the user logs in themselves; the extension only fills the form).
- **LinkedIn** (87 inbox emails) — Easy Apply is one native form; external postings
  redirect to the ATSes above. **Indeed** (57) and **JobStreet/JobsDB** (one SEEK
  platform) similar: native apply or redirect. **InternSG** (25) — links out to
  email/forms, SME-heavy.

**The SME long tail is real:** inbox shows Workable 10, SmartRecruiters 10, plus 2–4
each of Recruitee, hrPartner, X0PA, Teamtailor, Darwinbox, OmniHR. No adapter can chase
this tail — it's what the generic heuristic + LLM layers are for. Caveat: inbox counts
only capture completed applications; abandoned hostile forms (Workday, classically)
are undercounted.

**Adapter priority for Singapore:** 1) Workday, 2) SAP SuccessFactors,
3) MyCareersFuture native form — with the generic engine carrying the SME tail.

## What is built (phase 1)

The extension's popup has an "Autofill this application" button. It injects
`chrome-extension/autofill/` into every frame of the active tab, picks an adapter,
fills, and stops at the review step. Nothing is ever submitted, and existing values
are never overwritten.

- `engine.js` — the primitives: React-safe value writing, custom-dropdown handling,
  DOM waiting, shadow-DOM traversal, DataTransfer uploads, fuzzy option matching.
- `matcher.js` — the field dictionary and the label/aria/name/autocomplete scoring
  that maps controls onto profile fields. Also flags the questions we refuse to answer.
- `repeater.js` — "Add another education/experience": click, wait for the panel to
  mount, fill it scoped to that panel. Used by both the generic pass and Workday.
  A section with no grouping element counts as its own single panel.
- `skills.js` — the four shapes forms use for skills: one comma-joined box, a token
  input (type, Enter, chip), a combobox against the employer's own list, and rows
  behind an Add button.
- `detect.js` — platform fingerprinting by host and DOM.
- `adapters/workday.js` — the wizard state machine, stopping when a Submit button appears.
- `run.js` — orchestration plus the on-page status overlay (in a shadow root).

The profile comes from `GET /api/extension/profile`, fetched by the content script on
an open Job Tracker tab (the session cookie is SameSite=Lax, so the service worker
cannot fetch it directly) and cached in `chrome.storage.local` for a day.

Failures surface as a Chrome notification *and* on the page where possible. The run
lives in the background service worker (so the popup can close immediately), and a
service worker has no UI of its own — a page overlay alone cannot report the case
where injecting the overlay is what failed. Icons are generated by
`node scripts/generate-extension-icons.mjs`; notifications require one.

Testing: `npm run verify:autofill` checks the field dictionary against the known
mis-fills with no browser needed. `chrome-extension/autofill/fixtures.html` is a page
reproducing the hard cases — custom dropdown, Add-button repeater, shadow DOM,
confirm-email trap — for a real-browser check.

Not built yet: SuccessFactors and MyCareersFuture adapters, the LLM fallback for
unrecognised fields and free-text questions, the remembered-answers store, and
resume file attachment (the PDF bytes are not stored anywhere).

## Key sources

- React synthetic-event bypass: https://dev.to/umerheree/how-i-bypassed-reacts-synthetic-event-system-to-automate-form-filling-26fg
- ATS market share crawl: https://resumegeni.com/research/ats-market-share-2026
- A11y tree vs screenshots token math: https://dev.to/siropkin/accessibility-tree-vs-screenshots-the-token-math-behind-my-browser-agent-3fk9
- Chromium autofill design: https://www.chromium.org/developers/design-documents/form-autofill/
- File input via DataTransfer: https://pqina.nl/blog/set-value-to-file-input/
- Content scripts / all_frames: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Greenhouse embed: https://support.greenhouse.io/hc/en-us/articles/46365908766875
- openOrClosedShadowRoot: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/dom/openOrClosedShadowRoot
- Workday pain: https://blog.fastapply.co/how-to-beat-workday-applications-in-2026-the-ats-everyone-hates-and-how-to-autofill-it
- Simplify Copilot: https://simplify.jobs/copilot
