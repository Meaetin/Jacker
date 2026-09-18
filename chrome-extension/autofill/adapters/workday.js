// Workday adapter.
//
// Workday is the platform behind the whole Singapore public service, Grab, OCBC
// and UOB, and it is the hardest of the common ones: a multi-page wizard,
// custom dropdowns, and education/experience sections that only exist after you
// click "Add".
//
// Workday tags most controls with data-automation-id, which is the closest
// thing it offers to a stable hook. Those ids drift between tenant versions,
// so every lookup here falls back to the generic matcher rather than failing.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.adapters?.workday) return;

  const engine = ns.engine;
  const { matchControls } = ns.matcher;
  const { applyAll } = ns.filler;

  const auto = (value) => `[data-automation-id="${value}"]`;

  const NEXT_BUTTON = [
    auto("bottom-navigation-next-button"),
    auto("wd-CompositeHeader"),
    "button[data-automation-id*='next']",
  ].join(",");

  // Workday reuses its navigation button for the final submit, so the label is
  // the only thing separating "continue" from "send the application".
  const SUBMIT_TEXT = /^(submit|submit application)$/i;

  function currentStepName() {
    const active = document.querySelector(
      [auto("progressBarActiveStep"), auto("activeStep"), "[aria-current='step']"].join(","),
    );
    if (active) return engine.normalize(active.textContent);

    const heading = document.querySelector("h1, h2, [data-automation-id='pageHeader']");
    return heading ? engine.normalize(heading.textContent) : "";
  }

  function needsAccount() {
    return Boolean(
      document.querySelector(
        [auto("createAccountLink"), auto("signInLink"), "input[type=password]"].join(","),
      ),
    );
  }

  function nextButton() {
    const buttons = [...document.querySelectorAll(`${NEXT_BUTTON}, button`)].filter(engine.isVisible);
    return buttons.find((b) => /next|continue|save and continue/i.test(b.textContent)) ?? null;
  }

  function submitButton() {
    return [...document.querySelectorAll("button")]
      .filter(engine.isVisible)
      .find((b) => SUBMIT_TEXT.test(b.textContent.trim()));
  }

  // --- the wizard ----------------------------------------------------------

  async function fillStep(profile, report) {
    const step = currentStepName();
    report?.(`Filling "${step || "this step"}"`);

    const results = [];

    // The page-level fields (name, email, phone, address) are handled by the
    // generic matcher — Workday's labels are ordinary enough for it.
    const { matches, sensitive } = matchControls(profile);
    results.push(...(await applyAll(matches)));

    // Not gated on the step's name: these all no-op when the section is absent,
    // and Workday tenants label their steps inconsistently enough that matching
    // on the title skipped the education section entirely.
    results.push(...(await ns.repeater.fillAllSections(profile, report)));
    results.push(...(await ns.skills.fillSkillRows(profile, { report })));
    results.push(...(await ns.skills.fillSkills(profile, { report })));

    return { step, results, sensitive };
  }

  /**
   * Walks the wizard, filling each step and clicking Next, and stops as soon as
   * it reaches a page carrying a Submit button. Sending the application stays
   * the user's decision.
   */
  async function run(profile, { report, maxSteps = 6 } = {}) {
    if (needsAccount()) {
      return {
        ok: false,
        reason: "sign-in-required",
        message: "Workday wants you signed in to this employer's site first. Sign in, then run autofill again.",
      };
    }

    const all = [];
    const sensitive = [];
    const seenSteps = [];

    for (let i = 0; i < maxSteps; i += 1) {
      await engine.waitForIdle({ quietMs: 400, timeout: 6000 });

      if (submitButton()) {
        report?.("Reached the review step — stopping so you can check and submit.");
        break;
      }

      const outcome = await fillStep(profile, report);
      all.push(...outcome.results);
      sensitive.push(...outcome.sensitive);
      seenSteps.push(outcome.step);

      const next = nextButton();
      if (!next) {
        report?.("No Next button here, so this looks like the last step.");
        break;
      }

      engine.pointerClick(next);

      // A step only counts as advanced once the heading changes; otherwise the
      // page is most likely showing a validation error we should leave alone.
      const moved = await engine.waitFor(
        () => currentStepName() !== outcome.step || Boolean(submitButton()),
        { timeout: 6000 },
      );

      if (!moved) {
        report?.("The form did not move to the next step — it probably needs something from you.");
        break;
      }
    }

    return { ok: true, results: all, sensitive, steps: seenSteps };
  }

  (ns.adapters ??= {}).workday = { run, fillStep, currentStepName };
})();
