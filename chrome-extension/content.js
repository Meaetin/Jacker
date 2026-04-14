chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "get_content") {
    sendResponse({ text: document.body.innerText, url: location.href });
  }
});
