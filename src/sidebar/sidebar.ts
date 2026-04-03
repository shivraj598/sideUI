import { MessageTypes, Favorite } from '../types';

const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const quickUrlInput = document.getElementById(
  'quickUrlInput'
) as HTMLInputElement;
const quickAddBtn = document.getElementById('quickAddBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const countDisplay = document.getElementById('countDisplay') as HTMLSpanElement;

let allFavorites: Favorite[] = [];

async function init() {
  loadFavorites();
  setupEventListeners();
  setupMessageListener();
}

function setupEventListeners() {
  quickAddBtn.addEventListener('click', handleQuickAdd);
  quickUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleQuickAdd();
  });

  searchInput.addEventListener('input', filterFavorites);

  clearBtn.addEventListener('click', handleClearAll);
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageTypes.FAVORITES_UPDATED) {
      loadFavorites();
    }
  });
}

async function loadFavorites() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.GET_FAVORITES,
    });

    if (response.success) {
      allFavorites = response.data;
      renderFavorites(allFavorites);
      updateCount();
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

function renderFavorites(favorites: Favorite[]) {
  favoritesList.innerHTML = '';

  if (favorites.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Sort by most recent first
  const sorted = [...favorites].sort((a, b) => b.addedAt - a.addedAt);

  sorted.forEach((favorite) => {
    const card = createFavoriteCard(favorite);
    favoritesList.appendChild(card);
  });
}

function createFavoriteCard(favorite: Favorite): HTMLElement {
  const card = document.createElement('div');
  card.className = 'favorite-card';

  const header = document.createElement('div');
  header.className = 'favorite-header';

  // Favicon
  const faviconDiv = document.createElement('div');
  faviconDiv.className = 'favorite-favicon';
  if (favorite.favicon) {
    const img = document.createElement('img');
    img.src = favorite.favicon;
    img.onerror = () => {
      faviconDiv.textContent = '🔗';
    };
    faviconDiv.appendChild(img);
  } else {
    faviconDiv.textContent = '🔗';
  }

  // Info section
  const info = document.createElement('div');
  info.className = 'favorite-info';

  const title = document.createElement('div');
  title.className = 'favorite-title';
  title.textContent = favorite.title;

  const url = document.createElement('div');
  url.className = 'favorite-url';
  url.textContent = favorite.url;

  info.appendChild(title);
  info.appendChild(url);
  header.appendChild(faviconDiv);
  header.appendChild(info);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'favorite-actions';

  const openBtn = document.createElement('button');
  openBtn.className = 'favorite-action-btn';
  openBtn.textContent = '↗️ Open';
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openUrl(favorite.url, false);
  });

  const openNewBtn = document.createElement('button');
  openNewBtn.className = 'favorite-action-btn';
  openNewBtn.textContent = '🔗 New Tab';
  openNewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openUrl(favorite.url, true);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'favorite-action-btn remove';
  removeBtn.textContent = '✕ Remove';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFavorite(favorite.id);
  });

  actions.appendChild(openBtn);
  actions.appendChild(openNewBtn);
  actions.appendChild(removeBtn);

  card.appendChild(header);
  card.appendChild(actions);

  // Click anywhere on card to open
  card.addEventListener('click', () => {
    openUrl(favorite.url, false);
  });

  return card;
}

async function openUrl(url: string, newTab: boolean) {
  try {
    await chrome.runtime.sendMessage({
      type: MessageTypes.OPEN_URL,
      payload: { url, newTab },
    });
  } catch (error) {
    console.error('Error opening URL:', error);
  }
}

async function removeFavorite(id: string) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.REMOVE_FAVORITE,
      payload: { id },
    });

    if (response.success) {
      loadFavorites();
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

async function handleQuickAdd() {
  const url = quickUrlInput.value.trim();

  if (!url) return;

  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.ADD_FAVORITE,
      payload: { url },
    });

    if (response.success) {
      quickUrlInput.value = '';
      loadFavorites();
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

async function handleClearAll() {
  if (allFavorites.length === 0) return;

  const confirmed = confirm(
    `Clear all ${allFavorites.length} favorites? This cannot be undone.`
  );

  if (!confirmed) return;

  try {
    // Remove all favorites one by one (or you could add a clear all endpoint)
    for (const favorite of allFavorites) {
      await chrome.runtime.sendMessage({
        type: MessageTypes.REMOVE_FAVORITE,
        payload: { id: favorite.id },
      });
    }
    loadFavorites();
  } catch (error) {
    console.error('Error clearing favorites:', error);
  }
}

function filterFavorites() {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    renderFavorites(allFavorites);
    return;
  }

  const filtered = allFavorites.filter(
    (fav) =>
      fav.title.toLowerCase().includes(query) ||
      fav.url.toLowerCase().includes(query)
  );

  renderFavorites(filtered);
}

function updateCount() {
  if (allFavorites.length === 0) {
    countDisplay.textContent = 'No favorites yet';
  } else if (allFavorites.length === 1) {
    countDisplay.textContent = '1 favorite';
  } else {
    countDisplay.textContent = `${allFavorites.length} favorites`;
  }
}

// Initialize on load
init();
