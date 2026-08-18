/**
 * Firefox background script
 * Opens the typing practice page when the browser action is clicked.
 */

browser.runtime.onInstalled.addListener(() => {
  console.log('childtype Firefox extension installed');
});

browser.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'OPEN_PRACTICE') {
    browser.tabs.create({ url: browser.runtime.getURL('index.html') });
  }
  return true; // async response
});
