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
});

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
