import { MessageTypes } from '../types';
import { StorageManager } from '../utils/storage';
import { SidePanelUtil } from '../utils/sidePanel';

// Handle extension icon click - open sidebar
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await SidePanelUtil.open(tab.id);
  }
});

// Handle keyboard shortcut for toggling sidebar
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle_sidebar') {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.id) {
      await SidePanelUtil.toggle(tab.id);
    }
  }
});

// Listen for messages from popup and sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep the message port open for async response
});

async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    switch (message.type) {
      case MessageTypes.GET_FAVORITES: {
        const favorites = await StorageManager.getFavorites();
        sendResponse({ success: true, data: favorites });
        break;
      }

      case MessageTypes.ADD_FAVORITE: {
        const { url, title, favicon } = message.payload;
        const favorite = await StorageManager.addFavorite(url, title, favicon);

        // Broadcast to all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  type: MessageTypes.FAVORITES_UPDATED,
                  payload: { favorites: [favorite] },
                },
                () => chrome.runtime.lastError // Ignore errors if tab can't receive
              );
            }
          });
        });

        sendResponse({ success: true, data: favorite });
        break;
      }

      case MessageTypes.REMOVE_FAVORITE: {
        const { id } = message.payload;
        await StorageManager.removeFavorite(id);

        // Broadcast to all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  type: MessageTypes.FAVORITES_UPDATED,
                  payload: { removed: id },
                },
                () => chrome.runtime.lastError
              );
            }
          });
        });

        sendResponse({ success: true });
        break;
      }

      case MessageTypes.OPEN_URL: {
        const { url, newTab } = message.payload;
        if (newTab) {
          chrome.tabs.create({ url });
        } else {
          chrome.tabs.update({ url });
        }
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: String(error) });
  }
}
