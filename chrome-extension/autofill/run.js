// Orchestrates one autofill run: detect the platform, hand off to an adapter or
// the generic pass, and report what happened in an on-page overlay.

(() => {
  const ns = (globalThis.__jackerAutofill ??= {});
  if (ns.run) return;

  const engine = ns.engine;

  // --- overlay -------------------------------------------------------------
  // Rendered inside a shadow root so the host page's stylesheets cannot reach
  // in and the overlay's styles cannot leak onto the form.

  function createOverlay() {
    document.getElementById("jacker-autofill-overlay")?.remove();

    const host = document.createElement("div");
    host.id = "jacker-autofill-overlay";
    host.style.cssText = "position:fixed;z-index:2147483647;top:16px;right:16px;";
    const shadow = host.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>
        .panel {
          font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          width: 260px; background: #fff; color: #111827;
          border: 1px solid #e5e7eb; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,.14); overflow: hidden;
        }
        .head { display:flex; align-items:center; justify-content:space-between;
                padding:10px 12px; border-bottom:1px solid #f3f4f6; font-weight:600; }
        .close { cursor:pointer; border:0; background:none; font-size:16px; line-height:1; color:#6b7280; }
        .body { padding:10px 12px; }
        .status { color:#6b7280; margin-bottom:8px; }
        .row { display:flex; justify-content:space-between; padding:2px 0; }
        .count { font-variant-numeric: tabular-nums; font-weight:600; }
        .note { margin-top:8px; padding-top:8px; border-top:1px solid #f3f4f6; color:#92400e; }
        .todo { margin-top:8px; padding-top:8px; border-top:1px solid #f3f4f6; }
        .todo-title { font-weight:600; margin-bottom:4px; }
        .todo ul { margin:0; padding-left:16px; max-height:130px; overflow:auto; }
        .todo li { padding:1px 0; color:#374151; }
        .todo li.req { color:#9a3412; }
      </style>
      <div class="panel">
        <div class="head"><span>Job Tracker autofill</span>
          <button class="close" title="Close">&times;</button></div>
        <div class="body"><div class="status">Starting…</div><div class="rows"></div></div>
      </div>`;

    shadow.querySelector(".close").addEventListener("click", () => host.remove());
    document.documentElement.appendChild(host);

    return {
      status: (text) => {
        const el = shadow.querySelector(".status");
        if (el) el.textContent = text;
      },
      summary: (rows, { todo = [], note = "" } = {}) => {
        const container = shadow.querySelector(".rows");
        if (!container) return;

        container.innerHTML = rows
          .map(([label, count]) => `<div class="row"><span>${label}</span><span class="count">${count}</span></div>`)
          .join("");

        // Field names come from the host page, so they are set as text rather
        // than interpolated into the markup above.
        if (todo.length) {
          const block = document.createElement("div");
          block.className = "todo";

          const title = document.createElement("div");
          title.className = "todo-title";
          title.textContent = "Still empty";
          block.appendChild(title);

          const list = document.createElement("ul");
          for (const item of todo) {
            const li = document.createElement("li");
            li.textContent = item.required ? `${item.label} (required)` : item.label;
            if (item.required) li.className = "req";
            list.appendChild(li);
          }
          block.appendChild(list);
          container.appendChild(block);
        }

        if (note) {
          const el = document.createElement("div");
          el.className = "note";
          el.textContent = note;
          container.appendChild(el);
        }
      },
      remove: () => host.remove(),
    };
  }

  // Outlines the fields still needing an answer, so the list in the overlay can
  // actually be found on a long form.
  function highlight(items) {
    for (const { el } of items) {
      el.style.outline = "2px solid #f59e0b";
      el.style.outlineOffset = "1px";
    }
  }

  // --- the generic pass ----------------------------------------------------

  async function runGeneric(profile, report) {
    await engine.waitForIdle({ quietMs: 300, timeout: 4000 });

    const { matches, sensitive } = ns.matcher.matchControls(profile);
    report?.(`Found ${matches.length} fields I recognise`);

    const results = await ns.filler.applyAll(matches);

    // Education and work history sit behind an Add button on many forms, so
    // they are filled after the single-value fields rather than with them.
    results.push(...(await ns.repeater.fillAllSections(profile, report)));

    // Skills come last: a token input steals focus and opens menus, which would
    // interfere with the plainer fields above.
    results.push(...(await ns.skills.fillSkillRows(profile, { report })));
    results.push(...(await ns.skills.fillSkills(profile, { report })));

    return { ok: true, results, sensitive, steps: [] };
  }

  // --- entry point ---------------------------------------------------------

  async function run(profile) {
    const { platform, via } = ns.detect.detectPlatform();

    // Injection runs in every frame, most of which are trackers and ad slots.
    // Those bow out before drawing anything so only the real form shows UI.
    if (!ns.detect.looksLikeApplicationForm() && platform !== "workday") {
      return { ok: false, reason: "no-form", platform };
    }

    const overlay = createOverlay();
    const report = (text) => overlay.status(text);

    try {
      report(`${platform === "generic" ? "Generic form" : platform} detected (${via})`);

      const adapter = ns.adapters?.[platform];
      const outcome = adapter
        ? await adapter.run(profile, { report })
        : await runGeneric(profile, report);

      if (!outcome.ok) {
        overlay.status(outcome.message ?? "Could not fill this page.");
        overlay.summary([]);
        return outcome;
      }

      const filled = outcome.results.filter((r) => r.ok);
      const alreadyFilled = outcome.results.filter((r) => r.reason === "already-filled");
      const failed = outcome.results.filter((r) => !r.ok && !r.skipped);

      // Anything still blank is reported by inspecting the form itself, not by
      // counting failed attempts. A field the dictionary never recognised, or
      // one with nothing in the profile, is never attempted and would otherwise
      // vanish from the report entirely.
      const unfilled = ns.matcher.findUnfilled();
      const required = unfilled.filter((u) => u.required);
      highlight(required);

      overlay.status(filled.length ? "Filled — check it before you submit." : "Nothing left to fill.");
      overlay.summary(
        [
          ["Filled", filled.length],
          ["Already had a value", alreadyFilled.length],
          ["Still empty", unfilled.length],
          ["Required and empty", required.length],
        ],
        {
          // Required fields come first; they are what blocks the submit.
          todo: [...required, ...unfilled.filter((u) => !u.required)].slice(0, 12),
          note: [
            outcome.sensitive.length
              ? "Sponsorship, pay and demographic questions are left blank on purpose."
              : "",
            profile.resume ? `Attach ${profile.resume.filename} yourself — the file is not stored.` : "",
          ]
            .filter(Boolean)
            .join(" "),
        },
      );

      return {
        ok: true,
        platform,
        filled: filled.length,
        skipped: alreadyFilled.length,
        unfilled: unfilled.length,
        required: required.map((u) => u.label),
        failed: failed.map((f) => ({ key: f.key, reason: f.reason })),
        sensitive: outcome.sensitive.map((s) => s.sensitive),
        steps: outcome.steps,
      };
    } catch (error) {
      overlay.status(`Autofill hit an error: ${error?.message ?? error}`);
      return { ok: false, error: String(error?.message ?? error) };
    }
  }

  ns.run = run;

  // The background injects these files, then sends one of these messages.
  if (!ns.listening) {
    ns.listening = true;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === "autofill") {
        run(message.profile).then(sendResponse);
        return true;
      }

      // The popup has already closed by this point, so a failure to even load
      // the profile has to be shown on the page.
      if (message?.type === "autofill_error") {
        const overlay = createOverlay();
        overlay.status(message.message ?? "Autofill could not start.");
        overlay.summary([]);
        sendResponse({ ok: false });
        return false;
      }
    });
  }
})();
