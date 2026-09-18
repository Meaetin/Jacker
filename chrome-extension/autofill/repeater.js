// Repeated sections — the "Add another education / work experience" pattern.
//
// These sections are the reason a form cannot be filled in one pass: the fields
// for entry two do not exist until the Add button has been clicked and the
// framework has mounted them. So the loop is always click, wait, fill.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.repeater) return;

  const engine = ns.engine;

  const CONTROL = "input, select, textarea, [role='combobox']";

  function hasControl(el) {
    return Boolean(el.querySelector(CONTROL));
  }

  // Drops any candidate that contains another candidate, so nested groups
  // collapse to the panels that actually represent one entry.
  function outermost(elements) {
    return elements.filter((el) => !elements.some((other) => other !== el && el.contains(other)));
  }

  /**
   * Finds the container for a repeated section.
   *
   * Prefers an explicit hook (Workday's data-automation-id), then falls back to
   * the heading whose text names the section, climbing until the ancestor
   * actually holds the section's controls.
   */
  function findSection(titlePattern, automationIds = []) {
    for (const id of automationIds) {
      const direct = document.querySelector(`[data-automation-id="${id}"]`);
      if (direct) return direct;
    }

    // Plenty of forms style a div as a section title rather than using a real
    // heading element. The length guard keeps a whole paragraph that happens to
    // mention "education" from being mistaken for the heading.
    const candidates = [
      ...document.querySelectorAll(
        "h1, h2, h3, h4, legend, [role='heading'], [class*='title'], [class*='heading'], [class*='section-label']",
      ),
    ];

    const heading = candidates.find((el) => {
      const text = el.textContent.trim();
      return text.length <= 60 && titlePattern.test(text);
    });
    if (!heading) return null;

    let node = heading.parentElement;
    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      if (hasControl(node) || addButtonIn(node)) return node;
    }
    return null;
  }

  function panelsIn(section) {
    const tagged = [
      ...section.querySelectorAll(
        "[data-automation-id^='workExperience'], [data-automation-id^='education']",
      ),
    ].filter(hasControl);
    if (tagged.length) return outermost(tagged);

    const generic = [...section.querySelectorAll("fieldset, [role='group']")].filter(hasControl);
    if (generic.length) return outermost(generic);

    // Most forms group nothing: the education fields sit in plain divs, already
    // on screen, with no Add button until you want a second entry. Treating the
    // section as its own single panel is what lets that first entry be filled
    // at all — requiring a fieldset meant filling nothing.
    return hasControl(section) ? [section] : [];
  }

  function addButtonIn(section) {
    return [...section.querySelectorAll("button, a[role='button']")]
      .filter(engine.isVisible)
      .find((el) => /\badd\b/i.test(el.textContent));
  }

  /**
   * Fills up to `limit` entries into a repeated section.
   *
   * Each panel is filled scoped to itself, which is what stops entry two from
   * overwriting entry one — every panel's fields look identical to the matcher.
   */
  async function fillSection({ section, entries, group, limit = 3, report }) {
    if (!section || !entries?.length) return [];

    const results = [];
    const wanted = Math.min(entries.length, limit);

    for (let index = 0; index < wanted; index += 1) {
      let panels = panelsIn(section);

      if (index >= panels.length) {
        const add = addButtonIn(section);
        if (!add) {
          report?.(`No Add button for ${group}; stopped after ${index}.`);
          break;
        }

        const before = panels.length;
        engine.pointerClick(add);

        // The new panel is mounted by the framework, often a tick or two later.
        const grew = await engine.waitFor(() => panelsIn(section).length > before, {
          timeout: 4000,
        });
        if (!grew) {
          // A section with no grouping element always reports one panel, so a
          // second entry has nowhere to go that can be told apart from the first.
          report?.(
            `Filled ${index} ${group} ${index === 1 ? "entry" : "entries"}; this form does not separate the rest.`,
          );
          break;
        }
        panels = panelsIn(section);
      }

      const panel = panels[index];
      if (!panel) break;

      const { matches } = ns.matcher.matchControls(entries[index], { root: panel, group });
      results.push(...(await ns.filler.applyAll(matches)));
    }

    return results;
  }

  // The two repeated sections every application form has, with Workday's hooks
  // first and a heading match as the fallback for everyone else.
  async function fillAllSections(profile, report) {
    const results = [];

    const work = findSection(/work experience|employment history|work history/i, [
      "workExperienceSection",
    ]);
    results.push(
      ...(await fillSection({
        section: work,
        entries: profile.work_experience,
        group: "work",
        report,
      })),
    );

    const education = findSection(/education|academic/i, ["educationSection"]);
    results.push(
      ...(await fillSection({
        section: education,
        entries: profile.education,
        group: "education",
        report,
      })),
    );

    return results;
  }

  ns.repeater = { findSection, panelsIn, addButtonIn, fillSection, fillAllSections };
})();
