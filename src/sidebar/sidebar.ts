import { MessageTypes, Favorite } from '../types';

const googleSearch = document.getElementById('googleSearch') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
const quickUrlInput = document.getElementById(
  'quickUrlInput'
) as HTMLInputElement;
const quickAddBtn = document.getElementById('quickAddBtn') as HTMLButtonElement;
const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const countDisplay = document.getElementById('countDisplay') as HTMLSpanElement;

let allFavorites: Favorite[] = [];
let isDarkMode = localStorage.getItem('sideui-dark-mode') === 'true';

async function init() {
  initTheme();
  loadFavorites();
  setupEventListeners();
  setupMessageListener();
}

function initTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
  }
}

function setupEventListeners() {
  // Search Google
  searchBtn.addEventListener('click', handleGoogleSearch);
  googleSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGoogleSearch();
  });

  // Quick add URL
  quickAddBtn.addEventListener('click', handleQuickAdd);
  quickUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleQuickAdd();
  });

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageTypes.FAVORITES_UPDATED) {
      loadFavorites();
    }
  });
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('sideui-dark-mode', isDarkMode ? 'true' : 'false');
  initTheme();
}

async function handleGoogleSearch() {
  const query = googleSearch.value.trim();

  if (!query) return;

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  try {
    await chrome.runtime.sendMessage({
      type: MessageTypes.OPEN_URL,
      payload: { url: searchUrl, newTab: true },
    });
    googleSearch.value = '';
  } catch (error) {
    console.error('Error performing search:', error);
  }
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
