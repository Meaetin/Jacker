// Matches the job tracker running on localhost (dev) or jackerai.vercel.app (prod)
const TRACKER_TAB_PATTERNS = [
  /^http:\/\/localhost:\d+\//,
  /^https:\/\/jackerai\.vercel\.app\//,
];

function isTrackerTab(url) {
  return TRACKER_TAB_PATTERNS.some((p) => p.test(url));
}

function isDashboardTab(url) {
  return isTrackerTab(url) && /\/dashboard/.test(url);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "prefill") {
    handlePrefill(message.text, message.url).then(sendResponse).catch((err) => {
      sendResponse({ ok: false, error: err?.message ?? "Unknown error" });
    });
    return true;
  }

  if (message.type === "get_profile") {
    getProfile({ force: message.force }).then(sendResponse).catch((err) => {
      sendResponse({ ok: false, error: err?.message ?? "Unknown error" });
    });
    return true;
  }

  // Answer immediately so the popup can close without losing the message, then
  // run out here where closing the popup cannot interrupt anything.
  if (message.type === "start_autofill") {
    sendResponse({ ok: true });
    startAutofill().catch((err) => {
      notify("Autofill failed", err?.message ?? String(err));
    });
    return false;
  }
});

// Errors have to reach the user somehow, and the popup that triggered the run
// is already gone by the time most of them happen.
function notify(title, message) {
  console.error(`[Job Tracker] ${title}: ${message}`);
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title,
    message: String(message ?? "").slice(0, 300),
    priority: 2,
  });
}

// --- autofill run ----------------------------------------------------------

const AUTOFILL_FILES = [
  "autofill/engine.js",
  "autofill/matcher.js",
  "autofill/filler.js",
  "autofill/repeater.js",
  "autofill/skills.js",
  "autofill/detect.js",
  "autofill/adapters/workday.js",
  "autofill/run.js",
];

async function startAutofill() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    notify("Autofill failed", "Could not identify the active tab.");
    return;
  }

  if (!/^https?:/.test(tab.url ?? "")) {
    notify("Autofill failed", "This page cannot be filled. Open the application form first.");
    return;
  }

  // Every frame gets the code, because Greenhouse and several other boards
  // serve the real form inside a cross-origin iframe.
  let injected;
  try {
    injected = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: AUTOFILL_FILES,
    });
  } catch (err) {
    notify("Autofill failed", `Could not run on this page: ${err?.message ?? err}`);
    return;
  }

  if (!injected?.length) {
    notify("Autofill failed", "Chrome blocked the extension from running on this page.");
    return;
  }

  const profileResponse = await getProfile();

  if (!profileResponse.ok) {
    notify("Autofill needs your profile", profileResponse.error);
    await showOnPage(tab.id, profileResponse.error);
    return;
  }

  const outcomes = await Promise.all(
    injected.map(({ frameId }) =>
      chrome.tabs
        .sendMessage(tab.id, { type: "autofill", profile: profileResponse.profile }, { frameId })
        .catch(() => null),
    ),
  );

  await reportOutcome(tab.id, outcomes, profileResponse);
}

// A notification can be silenced at the OS level, so anything worth saying is
// also drawn on the page when a frame is there to draw it.
async function showOnPage(tabId, message) {
  await chrome.tabs
    .sendMessage(tabId, { type: "autofill_error", message }, { frameId: 0 })
    .catch(() => {});
}

// The overlay only appears in the frame that held a form. When no frame did,
// or the fill came back empty, nothing on screen would say so.
async function reportOutcome(tabId, outcomes, profileResponse) {
  const filled = outcomes.filter((o) => o?.ok).sort((a, b) => b.filled - a.filled)[0];

  if (!filled) {
    // An adapter bowing out, or a crash inside the page, both carry a reason
    // worth more than the generic miss.
    const explained = outcomes.find((o) => o?.message || o?.error);
    const reason =
      explained?.message ??
      explained?.error ??
      "No application form was found on this page. Open the form itself, then try again.";
    notify("Nothing was filled", reason);
    await showOnPage(tabId, reason);
    return;
  }

  if (filled.filled === 0) {
    notify(
      "Nothing was filled",
      profileResponse.fromCache
        ? "Every field was either already filled or unrecognised. Your profile came from the cache — open Job Tracker to refresh it."
        : "Every field was either already filled or unrecognised.",
    );
  }
}

// --- autofill profile ------------------------------------------------------

const PROFILE_CACHE_KEY = "autofillProfile";
const PROFILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Bumped whenever the shape the API returns changes, so a cache written by an
// older build is discarded rather than quietly filling fields with undefined.
const PROFILE_CACHE_VERSION = 2;

// Cached so autofill keeps working on an application page long after the Job
// Tracker tab has been closed. A stale cache is still better than no fill, so
// it is only treated as a hard failure when there is nothing stored at all.
async function getProfile({ force = false } = {}) {
  const stored = (await chrome.storage.local.get(PROFILE_CACHE_KEY))[PROFILE_CACHE_KEY];
  const cached = stored?.version === PROFILE_CACHE_VERSION ? stored : null;
  const fresh = cached && Date.now() - cached.fetchedAt < PROFILE_MAX_AGE_MS;

  if (fresh && !force) {
    return { ok: true, profile: cached.profile, fromCache: true };
  }

  const refreshed = await fetchProfileFromTracker();

  if (refreshed.ok) {
    await chrome.storage.local.set({
      [PROFILE_CACHE_KEY]: {
        profile: refreshed.profile,
        fetchedAt: Date.now(),
        version: PROFILE_CACHE_VERSION,
      },
    });
    return { ok: true, profile: refreshed.profile, fromCache: false };
  }

  if (cached) {
    return { ok: true, profile: cached.profile, fromCache: true, staleReason: refreshed.error };
  }

  return refreshed;
}

const PRODUCTION_ORIGIN = "https://jackerai.vercel.app";

async function fetchProfileFromTracker() {
  const tabs = await chrome.tabs.query({});
  const trackerTab = tabs.find((t) => t.url && isTrackerTab(t.url));

  // Going through the page is the reliable route, because the Supabase session
  // cookie is SameSite=Lax and only travels on a same-origin request.
  if (trackerTab?.id) {
    const viaTab = await askTab(trackerTab.id);
    if (viaTab) return viaTab;
  }

  // No usable tab. Worth one direct attempt: Chrome does send cookies on
  // extension-initiated requests in some configurations, and when it does this
  // removes the need for an open tab entirely.
  const origin = trackerTab?.url ? new URL(trackerTab.url).origin : PRODUCTION_ORIGIN;
  const direct = await fetchProfileDirect(origin);
  if (direct.ok) return direct;

  if (!trackerTab) {
    return { ok: false, error: "Open the Job Tracker dashboard in a tab, then try again." };
  }
  return { ok: false, error: direct.error ?? "Could not read your profile from Job Tracker." };
}

// Messages the content script, injecting it first if the tab predates the
// extension being loaded or reloaded. Returns null when the tab cannot answer.
async function askTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "fetch_profile" });
    if (response) return response;
  } catch {
    // No listener there yet — fall through and inject one.
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["tracker-bridge.js"] });
    const response = await chrome.tabs.sendMessage(tabId, { type: "fetch_profile" });
    if (response) return response;
  } catch {
    // Injection is blocked on some pages; the caller falls back to a direct fetch.
  }

  return null;
}

async function fetchProfileDirect(origin) {
  try {
    const response = await fetch(`${origin}/api/extension/profile`, { credentials: "include" });

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

async function handlePrefill(text, url) {
  await chrome.storage.session.set({ pendingPrefill: { text, url } });

  const allTabs = await chrome.tabs.query({});

  // Prefer a tab already on the dashboard; fall back to any tracker tab
  const trackerTab =
    allTabs.find((t) => t.url && isDashboardTab(t.url)) ??
    allTabs.find((t) => t.url && isTrackerTab(t.url));

  let trackerTabId;

  if (trackerTab?.id) {
    trackerTabId = trackerTab.id;

    // Try sending directly to the already-injected content script
    try {
      await chrome.tabs.sendMessage(trackerTabId, { type: "dispatch_prefill", text, url });
      await chrome.storage.session.remove("pendingPrefill");
    } catch {
      // Content script not injected — reload so tracker-bridge.js injects and reads storage
      await chrome.tabs.reload(trackerTabId);
      await waitForTabLoad(trackerTabId);
    }
  } else {
    return {
      ok: false,
      error: "No Job Tracker tab found. Open the Job Tracker dashboard first.",
    };
  }

  await chrome.tabs.update(trackerTabId, { active: true });
  const info = await chrome.tabs.get(trackerTabId);
  if (info.windowId) {
    await chrome.windows.update(info.windowId, { focused: true });
  }

  return { ok: true };
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function onUpdated(id, changeInfo) {
      if (id === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}
