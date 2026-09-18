// Turns a match from the matcher into an actual edit, choosing the right
// engine primitive for the control. Shared by the generic pass and the adapters.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.filler) return;

  const engine = ns.engine;

  async function applyMatch(match, { overwrite = false } = {}) {
    const { el, kind, value, key, aliases = [] } = match;

    if (!el.isConnected) return { key, ok: false, reason: "detached" };

    // Never clobber something the user (or the site) already put there.
    if (!overwrite && engine.isFilled(el)) {
      return { key, ok: false, reason: "already-filled", skipped: true };
    }

    switch (kind) {
      case "select":
        return { key, ...(await engine.selectNativeOption(el, value, aliases)) };
      case "combobox":
        return { key, ...(await engine.fillCombobox(el, value, { aliases })) };
      case "contenteditable":
        return { key, ...(await engine.fillContentEditable(el, value)) };
      case "checkbox":
        return { key, ...engine.setCheckbox(el, /^(yes|true)$/i.test(value)) };
      case "radio":
        return { key, ok: false, reason: "radio-needs-group", skipped: true };
      case "file":
        return { key, ok: false, reason: "file-needs-user", skipped: true };
      default:
        return { key, ...(await engine.fillText(el, value)) };
    }
  }

  // A plain text input can still be the visible half of a custom dropdown, so
  // a rejected write is retried as a combobox before being called a failure.
  async function applyWithFallback(match, opts) {
    const first = await applyMatch(match, opts);
    if (first.ok || first.skipped) return first;

    if (match.kind === "text" && first.reason === "value-rejected") {
      const retry = await engine.fillCombobox(match.el, match.value, {
        aliases: match.aliases ?? [],
      });
      if (retry.ok) return { key: match.key, ...retry, via: "combobox-fallback" };
    }
    return first;
  }

  async function applyAll(matches, opts) {
    const results = [];
    for (const match of matches) {
      results.push(await applyWithFallback(match, opts));
      await engine.sleep(40);
    }
    return results;
  }

  ns.filler = { applyMatch, applyWithFallback, applyAll };
})();
