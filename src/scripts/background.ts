import { ACTIONS } from '../shared/constants';

/**
 * This mechanism serves as a means to know when the extension's popup menu closes. Stream
 * is ended upon the Popup menu being closed.
 *
 * NOTE: the 'popup' port is opended in the useEffect of the Popup component
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'popup') return;
  port.onDisconnect.addListener(() => {
    const options = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(options, ([tab]) => {
      const msg = { action: ACTIONS.DISCONNECT, removeOverlay: true };
      chrome.tabs.sendMessage(tab.id, msg);
    });
  });
});
