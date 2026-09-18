// Maps arbitrary form controls onto profile fields using the same signals the
// browser's own autofill uses: the autocomplete attribute first, then the
// label, then name/id patterns, then the placeholder.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.matcher) return;

  const { deepQueryAll, isVisible, isFilled, normalize } = ns.engine;

  const CONTROL_SELECTOR = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])",
    "select",
    "textarea",
    '[role="combobox"]',
    '[contenteditable="true"]',
  ].join(",");

  // --- reading a control's human-visible identity --------------------------

  function textOf(el) {
    return el ? normalize(el.textContent) : "";
  }

  function labelText(el) {
    const doc = el.ownerDocument;

    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const joined = labelledBy
        .split(/\s+/)
        .map((id) => textOf(doc.getElementById(id)))
        .filter(Boolean)
        .join(" ");
      if (joined) return joined;
    }

    if (el.id) {
      const explicit = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (explicit) return textOf(explicit);
    }

    const wrapping = el.closest("label");
    if (wrapping) return textOf(wrapping);

    // Many form libraries render the label as a sibling inside a field wrapper
    // rather than associating it, so walk up looking for one. The wrapper must
    // hold exactly this one control, otherwise the label found could belong to
    // the field next door.
    let node = el.parentElement;
    for (let depth = 0; node && depth < 4; depth += 1, node = node.parentElement) {
      if (node.querySelectorAll(CONTROL_SELECTOR).length !== 1) break;

      const candidate = node.querySelector(
        "label, legend, [class*='label'], [data-automation-id*='label']",
      );
      if (candidate && !candidate.contains(el)) {
        const text = textOf(candidate);
        if (text) return text;
      }
    }

    return "";
  }

  function describe(el) {
    return {
      el,
      autocomplete: normalize(el.getAttribute("autocomplete")),
      name: el.getAttribute("name") ?? "",
      id: el.id ?? "",
      automationId: el.getAttribute("data-automation-id") ?? "",
      label: labelText(el),
      aria: normalize(el.getAttribute("aria-label")),
      placeholder: el.getAttribute("placeholder") ?? "",
      type: normalize(el.getAttribute("type") || el.tagName),
      kind: kindOf(el),
    };
  }

  function kindOf(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "select") return "select";
    if (tag === "textarea") return "textarea";
    if (el.isContentEditable) return "contenteditable";
    if (el.getAttribute("role") === "combobox") return "combobox";
    const type = normalize(el.getAttribute("type"));
    if (type === "checkbox" || type === "radio") return type;
    if (type === "file") return "file";
    // A readonly text input that opens a menu is a combobox in disguise.
    if (el.readOnly && el.getAttribute("aria-haspopup")) return "combobox";
    return "text";
  }

  // --- the field dictionary ------------------------------------------------

  // `value` reads from the autofill profile the API returns. `avoid` kills a
  // match outright, which is what keeps "Confirm email" from being filled as
  // "Email" and a company's name from landing in the candidate's name field.
  const FIELDS = [
    {
      key: "first_name",
      value: (p) => p.identity.first_name,
      autocomplete: ["given-name"],
      pattern: /first.?name|given.?name|\bfname\b/i,
      avoid: /last|family|sur.?name|middle|company|school|parent/i,
    },
    {
      key: "last_name",
      value: (p) => p.identity.last_name,
      autocomplete: ["family-name"],
      pattern: /last.?name|sur.?name|family.?name|\blname\b/i,
      avoid: /first|given|middle|company|school/i,
    },
    {
      key: "full_name",
      value: (p) => p.identity.full_name,
      autocomplete: ["name"],
      pattern: /^\s*(full.?|legal.?|your.?)?name\s*$|full.?name|legal.?name/i,
      avoid: /first|last|given|family|middle|sur|user|company|employer|school|university|file|display|parent|referr/i,
    },
    {
      key: "email",
      value: (p) => p.identity.email,
      autocomplete: ["email"],
      pattern: /e-?mail/i,
      avoid: /confirm|verify|re-?enter|repeat|recovery|alternate|referr/i,
    },
    {
      key: "preferred_name",
      value: (p) => p.identity.preferred_name,
      autocomplete: ["nickname"],
      pattern: /preferred.?name|nick.?name|goes.?by|known.?as/i,
      avoid: /legal|full|first|last|family/i,
    },
    {
      key: "phone",
      value: (p) => p.identity.phone,
      autocomplete: ["tel", "tel-national"],
      pattern: /phone|mobile|\btel\b|contact.?number/i,
      // "Country phone code" and "Device type" sit right beside the number on
      // Workday forms and would otherwise both read as the phone field.
      avoid: /country|\bcode\b|device|type|extension|\bext\b|emergency|referr/i,
    },
    {
      key: "phone_country_code",
      value: (p) => p.identity.phone_country_code,
      autocomplete: ["tel-country-code"],
      pattern: /country.?phone.?code|phone.?country.?code|country.?code|dial(ling)?.?code/i,
    },
    {
      // Workday makes this mandatory beside the phone number: is it a mobile,
      // home or work line.
      key: "phone_device_type",
      value: (p) => p.identity.phone_device_type,
      pattern: /device.?type|phone.?type|number.?type/i,
    },
    {
      key: "address",
      value: (p) => p.location.address,
      autocomplete: ["address-line1", "street-address"],
      pattern: /address.?(line)?.?1|street.?(address|name|line)?|^address$/i,
      avoid: /line.?2|email|ip\b|apartment|unit|suite/i,
    },
    {
      key: "address_line_2",
      value: (p) => p.location.address_line_2,
      autocomplete: ["address-line2"],
      pattern: /address.?(line)?.?2|apartment|unit.?(no|number)?|suite|\bblock\b/i,
    },
    {
      key: "city",
      value: (p) => p.location.city,
      autocomplete: ["address-level2"],
      pattern: /^city$|city|town|suburb/i,
      avoid: /state|province|country/i,
    },
    {
      key: "state",
      value: (p) => p.location.state,
      autocomplete: ["address-level1"],
      pattern: /^state$|state|province|region|prefecture/i,
      avoid: /country|united.?states|city|statement/i,
    },
    {
      key: "postal_code",
      value: (p) => p.location.postal_code,
      autocomplete: ["postal-code"],
      pattern: /postal.?code|post.?code|\bzip\b/i,
    },
    {
      key: "country",
      value: (p) => p.location.country,
      autocomplete: ["country", "country-name"],
      pattern: /^country$|country(?!.?code)/i,
      avoid: /code|phone|dial|citizenship|nationality/i,
    },
    {
      key: "linkedin",
      value: (p) => p.links.linkedin,
      pattern: /linked.?in/i,
    },
    {
      key: "github",
      value: (p) => p.links.github,
      pattern: /git.?hub/i,
    },
    {
      key: "portfolio",
      value: (p) => p.links.portfolio,
      pattern: /portfolio|personal.?(web)?site|^website$|web.?site.?url/i,
      avoid: /linked.?in|git.?hub|twitter|company|employer/i,
    },
    {
      key: "twitter",
      value: (p) => p.links.twitter,
      pattern: /twitter|^x\.com$/i,
    },
    {
      key: "current_title",
      value: (p) => p.professional.current_occupation,
      pattern: /current.?(job.?)?(title|role|position)|occupation|^job.?title$/i,
      avoid: /desired|preferred|apply|company/i,
    },
    {
      key: "notice_period",
      value: (p) => p.professional.notice_period,
      pattern: /notice.?period|availability|available.?(to.?start|from)|earliest.?start/i,
    },
    {
      // Nationality is a fact the user has already recorded, unlike the
      // sponsorship question below it, which is a legal judgement we refuse.
      key: "citizenship",
      value: (p) => p.professional.citizenship,
      pattern: /nationality|citizenship/i,
      avoid: /sponsor|visa|require|dual|are you|do you/i,
    },
    // Scoped groups: only matched when the caller narrows to one repeated
    // section, because a page has several of each.
    {
      key: "school",
      group: "education",
      value: (e) => e.institution,
      pattern: /school|university|institution|college|academy/i,
      avoid: /high.?school.?diploma/i,
    },
    {
      key: "degree",
      group: "education",
      value: (e) => e.degree,
      // The stored wording is verbose; the dropdown-friendly level comes from
      // the API alongside it.
      aliases: (e) => e.degree_aliases ?? [],
      pattern: /degree|qualification|education.?level/i,
    },
    {
      key: "field_of_study",
      group: "education",
      value: (e) => e.field_of_study,
      pattern: /field.?of.?study|major|discipline|course|specialis|specializ/i,
    },
    { key: "grade", group: "education", value: (e) => e.grade, pattern: /gpa|grade|cgpa|result|score/i },
    {
      key: "edu_start",
      group: "education",
      value: (e) => e.start_date,
      pattern: /(from|start).?(date|year)?|year.?(from|started)/i,
      avoid: /end|to\b|graduat/i,
    },
    {
      key: "edu_end",
      group: "education",
      value: (e) => e.end_date,
      pattern: /(to|end|graduat).?(date|year)?/i,
      avoid: /start|from/i,
    },
    { key: "job_title", group: "work", value: (w) => w.job_title, pattern: /job.?title|position|role/i },
    { key: "company", group: "work", value: (w) => w.company, pattern: /company|employer|organisation|organization/i },
    { key: "work_location", group: "work", value: (w) => w.location, pattern: /location|city/i },
    {
      key: "work_start",
      group: "work",
      value: (w) => w.start_date,
      pattern: /(from|start).?(date|year)?/i,
      avoid: /end|to\b/i,
    },
    {
      key: "work_end",
      group: "work",
      value: (w) => w.end_date,
      pattern: /(to|end).?(date|year)?/i,
      avoid: /start|from/i,
    },
    {
      // Used only when a form gives each skill its own repeated row.
      key: "skill",
      group: "skills",
      value: (e) => e.skill,
      pattern: /skill|technolog|competenc|expertise/i,
    },
    {
      key: "work_description",
      group: "work",
      value: (w) => w.description,
      pattern: /description|responsibilit|duties|achievement/i,
    },
  ];

  // Questions we deliberately refuse to answer. Getting a sponsorship or EEO
  // answer wrong carries legal weight, and salary is a negotiation, so these
  // get reported to the user instead of filled.
  const SENSITIVE = [
    { key: "sponsorship", pattern: /sponsor|visa|work.?(permit|pass|authoris|authoriz)|right.?to.?work|employment.?pass/i },
    { key: "demographics", pattern: /gender|\bsex\b|race|ethnic|hispanic|disab|veteran|lgbt|orientation|religio/i },
    { key: "date_of_birth", pattern: /date.?of.?birth|\bdob\b|birth.?date|\bage\b/i },
    { key: "criminal_record", pattern: /convict|criminal|felony|background.?check/i },
    { key: "salary", pattern: /salary|compensation|expected.?pay|remuneration|\bctc\b|wage/i },
    { key: "references", pattern: /reference.?(name|contact|email|phone)/i },
  ];

  function haystack(desc) {
    return [desc.label, desc.aria, desc.name, desc.id, desc.automationId, desc.placeholder];
  }

  function scoreField(desc, field) {
    const hay = haystack(desc);
    if (field.avoid && hay.some((text) => text && field.avoid.test(text))) return 0;

    if (field.autocomplete?.includes(desc.autocomplete)) return 1;
    if (!field.pattern) return 0;

    // Human-visible text is the most trustworthy signal after autocomplete,
    // because ATS field names follow no shared convention.
    if (field.pattern.test(desc.label)) return 0.85;
    if (field.pattern.test(desc.aria)) return 0.8;
    if (field.pattern.test(desc.name) || field.pattern.test(desc.automationId)) return 0.7;
    if (field.pattern.test(desc.id)) return 0.65;
    if (field.pattern.test(desc.placeholder)) return 0.55;
    return 0;
  }

  function sensitiveHit(desc) {
    const hay = haystack(desc).filter(Boolean);
    return SENSITIVE.find((rule) => hay.some((text) => rule.pattern.test(text))) ?? null;
  }

  function collectControls(root = document) {
    return deepQueryAll(CONTROL_SELECTOR, root).filter((el) => {
      // File inputs are routinely hidden behind a styled button.
      if (el.type === "file") return true;
      if (!isVisible(el)) return false;
      // A readonly input is usually uneditable — unless it is the display half
      // of a custom dropdown, which is how most of them are built.
      if (el.readOnly && kindOf(el) !== "combobox") return false;
      return true;
    });
  }

  /**
   * Matches every control under `root` against the dictionary.
   *
   * `group` selects the scoped dictionary ("education" / "work") for repeated
   * sections; omit it for the page-level single-valued fields. A field only
   * wins one control — the highest-scoring one — so a stray "Name" box later
   * in the form cannot overwrite the real one.
   */
  function matchControls(source, { root = document, group = null, threshold = 0.55 } = {}) {
    const fields = FIELDS.filter((f) => (group ? f.group === group : !f.group));
    const controls = collectControls(root);

    const matches = [];
    const sensitive = [];
    const unmatched = [];

    for (const el of controls) {
      const desc = describe(el);

      const flagged = sensitiveHit(desc);
      if (flagged) {
        sensitive.push({ ...desc, sensitive: flagged.key });
        continue;
      }

      let best = null;
      for (const field of fields) {
        const score = scoreField(desc, field);
        if (score >= threshold && (!best || score > best.score)) {
          best = { field, score };
        }
      }

      if (!best) {
        unmatched.push(desc);
        continue;
      }

      const value = best.field.value(source);
      if (!value) {
        unmatched.push({ ...desc, wanted: best.field.key, reason: "no-profile-value" });
        continue;
      }

      matches.push({
        ...desc,
        key: best.field.key,
        value,
        aliases: best.field.aliases?.(source) ?? [],
        score: best.score,
      });
    }

    // Two controls can both look like "email"; keep the more confident one.
    const claimed = new Map();
    for (const match of matches) {
      const held = claimed.get(match.key);
      if (!held || match.score > held.score) claimed.set(match.key, match);
    }

    return { matches: [...claimed.values()], sensitive, unmatched };
  }

  // A field is required if the form says so, or if its label carries the
  // asterisk convention that most application forms use instead.
  function isRequired(el, label) {
    if (el.required || el.getAttribute("aria-required") === "true") return true;
    if (label.includes("*")) return true;
    return Boolean(el.closest("[data-required='true'], [class*='required']"));
  }

  /**
   * Lists the controls still sitting empty after a fill.
   *
   * This is what turns a silent miss into something actionable: a field the
   * dictionary never recognised, or one with no value in the profile, otherwise
   * leaves no trace in the report at all.
   */
  function findUnfilled(root = document) {
    const seen = new Set();

    return collectControls(root)
      .filter((el) => el.type !== "file" && !isFilled(el))
      .map((el) => {
        const raw = labelText(el) || normalize(el.getAttribute("aria-label")) || el.getAttribute("name") || "";
        const label = raw.replace(/\*/g, "").replace(/\s+/g, " ").trim();
        return { el, label, required: isRequired(el, raw) };
      })
      .filter((item) => {
        if (!item.label) return false;
        // An unticked optional checkbox is not an outstanding task.
        if ((item.el.type === "checkbox" || item.el.type === "radio") && !item.required) return false;
        // Radio groups and repeated labels should count once.
        const dedupe = `${item.label}|${item.required}`;
        if (seen.has(dedupe)) return false;
        seen.add(dedupe);
        return true;
      });
  }

  ns.matcher = {
    matchControls,
    findUnfilled,
    isRequired,
    collectControls,
    describe,
    labelText,
    // Exported so scripts/verify-autofill-matcher.mjs can exercise the
    // dictionary without a browser.
    scoreField,
    sensitiveHit,
    FIELDS,
    SENSITIVE,
  };
})();
