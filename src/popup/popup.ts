import { MessageTypes, Favorite } from '../types';
import { SidePanelUtil } from '../utils/sidePanel';

const urlInput = document.getElementById('urlInput') as HTMLInputElement;
const titleInput = document.getElementById('titleInput') as HTMLInputElement;
const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const recentList = document.getElementById('recentList') as HTMLDivElement;
const openSidebarBtn = document.getElementById('openSidebar') as HTMLButtonElement;

// Get current tab URL on popup open
async function initializePopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url) {
    urlInput.value = tab.url;
    titleInput.value = tab.title || '';
  }

  loadRecentFavorites();
}

// Load and display recent favorites
async function loadRecentFavorites() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.GET_FAVORITES,
    });

    if (response.success) {
      const favorites: Favorite[] = response.data;
      const recent = favorites.slice(-5).reverse();

      recentList.innerHTML = '';

      if (recent.length === 0) {
        recentList.innerHTML =
          '<div class="empty-message">No favorites yet</div>';
        return;
      }

      recent.forEach((fav) => {
        const item = createFavoriteItem(fav);
        recentList.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

function createFavoriteItem(favorite: Favorite): HTMLElement {
  const div = document.createElement('div');
  div.className = 'favorite-item';

  const textDiv = document.createElement('div');
  textDiv.className = 'favorite-item-text';

  const titleEl = document.createElement('div');
  titleEl.className = 'favorite-item-title';
  titleEl.textContent = favorite.title;

  const urlEl = document.createElement('div');
  urlEl.className = 'favorite-item-url';
  urlEl.textContent = favorite.url;

  textDiv.appendChild(titleEl);
  textDiv.appendChild(urlEl);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'favorite-item-remove';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFavorite(favorite.id);
  });

  div.addEventListener('click', () => {
    chrome.runtime.sendMessage(
      {
        type: MessageTypes.OPEN_URL,
        payload: { url: favorite.url, newTab: false },
      },
      () => {
        window.close();
      }
    );
  });

  div.appendChild(textDiv);
  div.appendChild(removeBtn);

  return div;
}

async function removeFavorite(id: string) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.REMOVE_FAVORITE,
      payload: { id },
    });

    if (response.success) {
      showStatus('Removed from favorites', 'success');
      loadRecentFavorites();
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    showStatus('Error removing favorite', 'error');
  }
}

function showStatus(message: string, type: 'success' | 'error') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// Add favorite button click
addBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();

  if (!url) {
    showStatus('Please enter a URL', 'error');
    return;
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = 'Adding...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.ADD_FAVORITE,
      payload: {
        url,
        title: titleInput.value || undefined,
      },
    });

    if (response.success) {
      showStatus('Added to favorites!', 'success');
      urlInput.value = '';
      titleInput.value = '';
      loadRecentFavorites();
    } else {
      showStatus('Error adding favorite', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('Error adding favorite', 'error');
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add to Favorites';
  }
});

// Open sidebar button
openSidebarBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    await SidePanelUtil.open(tab.id);
    window.close();
  }
});

// Initialize popup
initializePopup();
