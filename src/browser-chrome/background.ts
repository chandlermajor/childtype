/**
 * Chrome background script (Service Worker for MV3)
 * Opens the typing practice page when the action is clicked.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('childtype Chrome extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
