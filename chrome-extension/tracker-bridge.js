// Runs on Job Tracker pages — bridges background → React via CustomEvent, and
// serves the autofill profile over a same-origin fetch.

(() => {
  // The background script re-injects this file when a tab predates the
  // extension being loaded, so guard against registering everything twice.
  if (globalThis.__jackerBridgeReady) return;
  globalThis.__jackerBridgeReady = true;

  function dispatchPrefill(text, url) {
    window.dispatchEvent(new CustomEvent("job-tracker:prefill", { detail: { text, url } }));
  }

  // On page load: check if background stored pending data while this tab wasn't ready
  chrome.storage.session.get("pendingPrefill", ({ pendingPrefill }) => {
    if (pendingPrefill) {
      chrome.storage.session.remove("pendingPrefill");
      dispatchPrefill(pendingPrefill.text, pendingPrefill.url);
    }
  });

  // While page is open: background sends a direct message
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "dispatch_prefill") {
      dispatchPrefill(message.text, message.url);
      sendResponse({ ok: true });
    }

    // The autofill profile is read through this tab rather than fetched by the
    // service worker: the Supabase session cookie is SameSite=Lax, so only a
    // same-origin request from the Job Tracker page itself carries it.
    if (message.type === "fetch_profile") {
      fetchProfile().then(sendResponse);
      return true;
    }
  });

  async function fetchProfile() {
    try {
      const response = await fetch("/api/extension/profile", { credentials: "include" });

      if (response.status === 401) {
        return { ok: false, error: "Sign in to Job Tracker, then try again." };
      }

      // A 404 means either "no profile saved" (our JSON) or "no such route"
      // (Next's HTML page), and those need very different fixes.
      if (response.status === 404) {
        const body = await response.json().catch(() => null);
        return {
          ok: false,
          error:
            body?.error ??
            "This Job Tracker build has no /api/extension/profile route — restart the dev server or deploy.",
        };
      }

      if (!response.ok) {
        // The route explains itself in the body; the bare status code does not.
        const body = await response.json().catch(() => null);
        return { ok: false, error: body?.error ?? `Job Tracker returned ${response.status}.` };
      }

      const data = await response.json();
      return { ok: true, profile: data.profile, updatedAt: data.updated_at };
    } catch (err) {
      return { ok: false, error: err?.message ?? "Could not reach Job Tracker." };
    }
  }
})();
