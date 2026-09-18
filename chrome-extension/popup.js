const extractBtn = document.getElementById("extract-btn");
const autofillBtn = document.getElementById("autofill-btn");
const statusEl = document.getElementById("status");
const currentUrlEl = document.getElementById("current-url");

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
}

function clearStatus() {
  statusEl.className = "status-message";
  statusEl.textContent = "";
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  currentUrlEl.textContent = tab?.url ?? "Unknown page";
});

extractBtn.addEventListener("click", async () => {
  clearStatus();
  extractBtn.disabled = true;
  extractBtn.textContent = "Extracting...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("Could not identify the active tab.");

    console.log("[Job Tracker] Tab:", tab.id, tab.url);

    // Try messaging an already-injected content script first
    let pageContent = null;
    try {
      pageContent = await chrome.tabs.sendMessage(tab.id, { type: "get_content" });
    } catch {
      // Not injected yet — inject it now (requires scripting + activeTab)
      console.log("[Job Tracker] Injecting content script...");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      pageContent = await chrome.tabs.sendMessage(tab.id, { type: "get_content" });
    }

    if (!pageContent?.text) throw new Error("Content script returned no text.");

    console.log("[Job Tracker] Extracted", pageContent.text.length, "chars from", pageContent.url);

    const response = await chrome.runtime.sendMessage({
      type: "prefill",
      text: pageContent.text,
      url: pageContent.url,
    });

    if (response?.ok) {
      showStatus("Sent! Job Tracker tab is now open.", "success");
      extractBtn.textContent = "Done";
    } else {
      throw new Error(response?.error ?? "Background script returned an error.");
    }
  } catch (err) {
    console.error("[Job Tracker] Error:", err);
    showStatus(`Error: ${err?.message ?? "Unexpected error"}`, "error");
    extractBtn.disabled = false;
    extractBtn.textContent = "Extract & Send to Job Tracker";
  }
});

// The run itself belongs to the background script, so the popup can get out of
// the way immediately — it would otherwise cover the form it is filling.
//
// Waiting for the acknowledgement matters: closing the window in the same tick
// as the send tears down this context before Chrome dispatches the message, and
// the run never starts.
autofillBtn.addEventListener("click", async () => {
  try {
    await chrome.runtime.sendMessage({ type: "start_autofill" });
  } catch (err) {
    console.error("[Job Tracker] Could not start autofill:", err);
  }
  window.close();
});
