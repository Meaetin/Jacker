// Skills are collected in four different shapes across application forms, and
// the same profile list has to satisfy all of them:
//
//   1. one text box, comma separated ("separate each skill with a comma")
//   2. a token input — type a skill, press Enter, a chip appears, repeat
//   3. a combobox backed by the employer's own fixed list of skills
//   4. rows added one at a time behind an "Add" button
//
// Shapes 2 and 3 are the same loop: type, and take an option if the form
// offers one. The difference only shows up in whether a menu appears.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.skills) return;

  const engine = ns.engine;

  const SKILL_PATTERN = /skill|technolog|competenc|expertise|proficien|tool.?s\b/i;
  const MAX_SKILLS = 15;

  function looksLikeSkillsField(desc) {
    return [desc.label, desc.aria, desc.name, desc.id, desc.placeholder, desc.automationId]
      .filter(Boolean)
      .some((text) => SKILL_PATTERN.test(text));
  }

  // A label saying "separate with a comma" is the form telling us outright that
  // it wants one string rather than one entry per skill.
  function wantsCommaList(desc) {
    return /comma|separated|semicolon|,\s*$/i.test(`${desc.label} ${desc.placeholder} ${desc.aria}`);
  }

  function findSkillControls(root = document) {
    return ns.matcher
      .collectControls(root)
      .map((el) => ns.matcher.describe(el))
      .filter(looksLikeSkillsField);
  }

  /**
   * Types skills one at a time, taking a menu option when the form offers one
   * and committing with Enter when it does not.
   *
   * Employers with their own skill list will not have every skill on the CV, so
   * an unmatched skill is skipped rather than forced in as free text.
   */
  async function fillTokenInput(input, skills) {
    const accepted = [];
    const rejected = [];

    for (const skill of skills) {
      input.focus();
      engine.setValue(input, skill);
      await engine.sleep(220);

      const options = engine.visibleOptions();

      if (options.length) {
        const hit = engine.bestMatch(skill, options, { textOf: (el) => el.textContent });
        if (hit) {
          engine.pointerClick(hit.match);
          accepted.push(skill);
        } else {
          // The employer's list does not have this one; leave it out.
          engine.pressKey(input, "Escape");
          rejected.push(skill);
          engine.setValue(input, "");
        }
      } else {
        engine.pressKey(input, "Enter");
        // A token input clears itself once it has accepted the value.
        accepted.push(skill);
      }

      await engine.sleep(150);
    }

    // Never leave a half-typed skill sitting in the box.
    if (String(input.value ?? "").trim()) engine.setValue(input, "");

    return { accepted, rejected };
  }

  /**
   * Fills whatever skills control this page uses.
   *
   * Returns filler-shaped results so the run's counts and the overlay treat
   * skills the same as any other field.
   */
  async function fillSkills(profile, { report } = {}) {
    const skills = (profile.skills ?? []).filter(Boolean).slice(0, MAX_SKILLS);
    if (!skills.length) return [];

    const controls = findSkillControls();
    if (!controls.length) return [];

    const results = [];

    for (const desc of controls) {
      const { el, kind } = desc;

      if (!el.isConnected) continue;
      if (engine.isFilled(el) && kind !== "combobox") {
        results.push({ key: "skills", ok: false, reason: "already-filled", skipped: true });
        continue;
      }

      // One box asking for a comma separated list: give it the whole list.
      if ((kind === "textarea" || kind === "text") && (wantsCommaList(desc) || kind === "textarea")) {
        report?.(`Filling ${skills.length} skills as a comma separated list`);
        const outcome = await engine.fillText(el, skills.join(", "));
        results.push({ key: "skills", ...outcome });
        continue;
      }

      if (kind === "combobox" || kind === "text") {
        report?.(`Adding ${skills.length} skills one at a time`);
        const { accepted, rejected } = await fillTokenInput(el, skills);
        results.push({
          key: "skills",
          ok: accepted.length > 0,
          reason: accepted.length ? undefined : "no-matching-option",
          accepted: accepted.length,
          rejected: rejected.length,
        });
        continue;
      }

      if (kind === "select") {
        // A single-choice list cannot hold a whole skill set; take the best one.
        const outcome = await engine.selectNativeOption(el, skills[0], skills.slice(1));
        results.push({ key: "skills", ...outcome });
      }
    }

    return results;
  }

  // Some forms put each skill on its own row behind an Add button. The repeater
  // already knows how to grow a section; it just needs one "entry" per skill.
  async function fillSkillRows(profile, { report } = {}) {
    const skills = (profile.skills ?? []).filter(Boolean).slice(0, MAX_SKILLS);
    if (!skills.length) return [];

    const section = ns.repeater.findSection(/skills|technical skills|competenc/i, ["skillsSection"]);
    if (!section || !ns.repeater.addButtonIn(section)) return [];

    report?.(`Adding ${Math.min(skills.length, 10)} skills as separate rows`);

    return ns.repeater.fillSection({
      section,
      entries: skills.map((skill) => ({ skill })),
      group: "skills",
      limit: 10,
      report,
    });
  }

  ns.skills = { fillSkills, fillSkillRows, findSkillControls, MAX_SKILLS };
})();
