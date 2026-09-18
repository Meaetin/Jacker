// Low-level primitives for filling arbitrary web forms.
//
// The central problem: assigning `input.value = x` on a React/Vue form updates
// the DOM but not the framework's state, so the field submits empty. Everything
// here goes through the native prototype setter and dispatches the real events
// frameworks listen for.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.engine) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- text normalisation and fuzzy matching -------------------------------

  function normalize(text) {
    return String(text ?? "")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Option labels rarely match a profile value character for character
  // ("Singapore" vs "Singapore (SG)"), so callers score candidates instead of
  // demanding equality.
  const SYNONYMS = [
    ["united states", "usa", "us", "united states of america"],
    ["united kingdom", "uk", "great britain", "england"],
    ["singapore", "sg", "singapore (sg)", "republic of singapore"],
    ["male", "m"],
    ["female", "f"],
    ["yes", "y", "true"],
    ["no", "n", "false"],
  ];

  function synonymsOf(value) {
    const n = normalize(value);
    const group = SYNONYMS.find((g) => g.includes(n));
    return group ? group : [n];
  }

  function similarity(target, candidate) {
    const a = normalize(target);
    const b = normalize(candidate);
    if (!a || !b) return 0;
    if (a === b) return 1;

    const aliases = synonymsOf(a);
    if (aliases.includes(b)) return 0.98;

    if (b.startsWith(a) || a.startsWith(b)) return 0.85;
    if (b.includes(a) || a.includes(b)) return 0.72;

    const aTokens = new Set(a.split(" "));
    const bTokens = new Set(b.split(" "));
    const shared = [...aTokens].filter((t) => bTokens.has(t)).length;
    if (!shared) return 0;
    return 0.6 * (shared / Math.max(aTokens.size, bTokens.size));
  }

  // `target` may be a single string or several acceptable spellings. A stored
  // degree of "Bachelor of Science (Honours)" has to find the option labelled
  // "Bachelor's Degree", and only an alias makes that reachable.
  function bestMatch(target, candidates, { threshold = 0.55, textOf = String } = {}) {
    const targets = (Array.isArray(target) ? target : [target]).filter(Boolean);

    let best = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const text = textOf(candidate);
      for (const one of targets) {
        const score = similarity(one, text);
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
    }

    return bestScore >= threshold ? { match: best, score: bestScore } : null;
  }

  // --- DOM traversal -------------------------------------------------------

  function shadowRootOf(el) {
    if (el.shadowRoot) return el.shadowRoot;
    try {
      return chrome?.dom?.openOrClosedShadowRoot?.(el) ?? null;
    } catch {
      return null;
    }
  }

  // Shadow roots hide form controls from an ordinary querySelectorAll, and
  // extensions are allowed to pierce even closed ones.
  function deepQueryAll(selector, root = document) {
    const found = [];
    const visit = (node) => {
      found.push(...node.querySelectorAll(selector));
      for (const el of node.querySelectorAll("*")) {
        const shadow = shadowRootOf(el);
        if (shadow) visit(shadow);
      }
    };
    visit(root);
    return found;
  }

  function isVisible(el) {
    if (!el?.isConnected) return false;
    if (el.disabled) return false;
    if (el.type === "hidden") return false;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isFilled(el) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked;
    if (el.isContentEditable) return Boolean(el.textContent.trim());
    return Boolean(String(el.value ?? "").trim());
  }

  // --- waiting -------------------------------------------------------------

  // Resolves with the first truthy return from `check`, or null on timeout.
  // A MutationObserver catches framework re-renders; the interval is a backstop
  // for changes that never touch the DOM tree (attribute-only, canvas, etc).
  function waitFor(check, { timeout = 5000, interval = 100 } = {}) {
    return new Promise((resolve) => {
      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        clearInterval(timer);
        clearTimeout(deadline);
        resolve(value);
      };

      const run = () => {
        try {
          const value = check();
          if (value) finish(value);
        } catch {
          // A check that throws mid-render is expected; try again next tick.
        }
      };

      const observer = new MutationObserver(run);
      const timer = setInterval(run, interval);
      const deadline = setTimeout(() => finish(null), timeout);

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      run();
    });
  }

  // Resolves once the DOM has stopped changing for `quietMs`. Used after a page
  // transition so we fill a settled form rather than one mid-hydration.
  function waitForIdle({ quietMs = 400, timeout = 8000 } = {}) {
    return new Promise((resolve) => {
      let quietTimer;
      const observer = new MutationObserver(() => {
        clearTimeout(quietTimer);
        quietTimer = setTimeout(done, quietMs);
      });

      const done = () => {
        observer.disconnect();
        clearTimeout(quietTimer);
        clearTimeout(deadline);
        resolve();
      };

      const deadline = setTimeout(done, timeout);
      quietTimer = setTimeout(done, quietMs);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  // --- writing values ------------------------------------------------------

  // React installs its own `value` setter on the element instance to track
  // changes. Walking up to the prototype descriptor bypasses that tracker so
  // the framework sees a genuine user edit when the input event fires.
  function nativeValueSetter(el) {
    let proto = Object.getPrototypeOf(el);
    while (proto) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (descriptor?.set) return descriptor.set;
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  function dispatchInput(el, value) {
    el.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }),
    );
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setValue(el, value) {
    const setter = nativeValueSetter(el);
    if (setter) setter.call(el, value);
    else el.value = value;
    dispatchInput(el, value);
  }

  // Validation on most forms only runs for fields the user has "touched", so
  // the focus/blur wrapper matters as much as the value itself.
  async function fillText(el, value) {
    if (!value) return { ok: false, reason: "empty-value" };

    el.focus();
    el.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    setValue(el, value);
    await sleep(20);
    el.blur();
    el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));

    // Some frameworks reset the field on blur if they rejected the write.
    await sleep(30);
    const written = el.isContentEditable ? el.textContent : el.value;
    if (normalize(written) !== normalize(value)) {
      return { ok: false, reason: "value-rejected", written };
    }
    return { ok: true };
  }

  async function fillContentEditable(el, value) {
    el.focus();
    el.textContent = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value }));
    el.blur();
    return { ok: Boolean(el.textContent.trim()) };
  }

  function setCheckbox(el, checked) {
    if (el.checked === checked) return { ok: true };
    el.focus();
    el.click();
    return { ok: el.checked === checked };
  }

  async function selectNativeOption(el, value, aliases = []) {
    const options = [...el.options];
    const hit = bestMatch([value, ...aliases], options, {
      textOf: (o) => o.label || o.text || o.value,
    });
    if (!hit) return { ok: false, reason: "no-matching-option" };

    const setter = nativeValueSetter(el);
    if (setter) setter.call(el, hit.match.value);
    else el.value = hit.match.value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: el.value === hit.match.value, matched: hit.match.text };
  }

  // --- custom comboboxes ---------------------------------------------------

  const OPTION_SELECTOR = [
    '[role="option"]',
    '[class*="option"]:not([class*="options"])',
    '[data-automation-id="promptOption"]',
    'li[id*="option"]',
  ].join(",");

  function pointerClick(el) {
    const opts = { bubbles: true, cancelable: true, view: window };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      const Ctor = type.startsWith("pointer") && window.PointerEvent ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, opts));
    }
  }

  function pressKey(el, key) {
    for (const type of ["keydown", "keyup"]) {
      el.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
    }
  }

  function visibleOptions() {
    return deepQueryAll(OPTION_SELECTOR).filter((el) => {
      if (!isVisible(el)) return false;
      return Boolean(el.textContent.trim());
    });
  }

  // Custom dropdowns (react-select and friends) hold their value in framework
  // state, so there is nothing to assign. The only reliable route is the one a
  // person takes: open it, type to filter, click the option that matches.
  async function fillCombobox(control, value, { timeout = 4000, aliases = [] } = {}) {
    if (!value) return { ok: false, reason: "empty-value" };

    const typeable =
      control.matches?.("input, textarea") ? control : control.querySelector?.("input, textarea");

    control.scrollIntoView({ block: "center", behavior: "instant" });
    pointerClick(typeable ?? control);
    await sleep(80);

    // Typing narrows long option lists, and some comboboxes only render their
    // menu once there is query text.
    if (typeable && !typeable.readOnly) {
      typeable.focus();
      setValue(typeable, value);
      await sleep(150);
    }

    const options = await waitFor(() => {
      const found = visibleOptions();
      return found.length ? found : null;
    }, { timeout });

    if (!options) {
      // Listbox never appeared. Enter sometimes commits a free-text combobox.
      if (typeable) {
        pressKey(typeable, "Enter");
        await sleep(100);
        if (isFilled(typeable)) return { ok: true, via: "enter" };
      }
      return { ok: false, reason: "no-listbox" };
    }

    let hit = bestMatch([value, ...aliases], options, { textOf: (el) => el.textContent });

    // Typing filters the menu, so a verbose value can leave it empty of the
    // option an alias would have found. Clear the query and look again.
    if (!hit && aliases.length && typeable && !typeable.readOnly) {
      setValue(typeable, aliases[0]);
      await sleep(200);
      const refreshed = visibleOptions();
      if (refreshed.length) {
        hit = bestMatch([value, ...aliases], refreshed, { textOf: (el) => el.textContent });
      }
    }

    if (!hit) {
      if (typeable) pressKey(typeable, "Escape");
      return { ok: false, reason: "no-matching-option", sawOptions: options.length };
    }

    const chosen = hit.match.textContent.trim();
    hit.match.scrollIntoView({ block: "nearest", behavior: "instant" });
    pointerClick(hit.match);
    await sleep(150);

    // Prefer confirming the control now shows the choice. Multi-selects keep
    // their menu open, so a closed menu is only the fallback signal.
    const shown = typeable ? typeable.value : "";
    const ok = shown ? similarity(chosen, shown) > 0.5 : !visibleOptions().length;

    return { ok, matched: chosen, score: hit.score };
  }

  // --- file inputs ---------------------------------------------------------

  // `input.files` is read-only to assignment of a plain array, but accepts a
  // FileList built through DataTransfer.
  function setFileInput(input, file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: input.files.length === 1 };
  }

  // Drop zones that never expose an <input type=file> still listen for a drop
  // event carrying the same DataTransfer payload.
  function dropFile(zone, file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    for (const type of ["dragenter", "dragover", "drop"]) {
      zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
    }
    return { ok: true };
  }

  ns.engine = {
    sleep,
    normalize,
    similarity,
    bestMatch,
    deepQueryAll,
    shadowRootOf,
    isVisible,
    isFilled,
    waitFor,
    waitForIdle,
    setValue,
    fillText,
    fillContentEditable,
    setCheckbox,
    selectNativeOption,
    fillCombobox,
    pointerClick,
    pressKey,
    visibleOptions,
    setFileInput,
    dropFile,
  };
})();
