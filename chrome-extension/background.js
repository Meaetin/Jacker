// Matches any localhost port running the job tracker
const TRACKER_TAB_PATTERN = /^http:\/\/localhost:\d+\//;
const TRACKER_TAB_DASHBOARD = /^http:\/\/localhost:\d+\/dashboard/;

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

  // Prefer a tab already on the dashboard; fall back to any localhost tab
  const trackerTab =
    allTabs.find((t) => t.url && TRACKER_TAB_DASHBOARD.test(t.url)) ??
    allTabs.find((t) => t.url && TRACKER_TAB_PATTERN.test(t.url));

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
      error: "No Job Tracker tab found. Open http://localhost:3000/dashboard/job-analysis first.",
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
