// Runs on localhost:3000 pages — bridges background → React via CustomEvent

function dispatchPrefill(text, url) {
  window.dispatchEvent(
    new CustomEvent("job-tracker:prefill", { detail: { text, url } })
  );
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
});
