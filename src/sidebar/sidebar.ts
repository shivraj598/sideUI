import { MessageTypes, Favorite } from '../types';

/* ============================================
   DOM ELEMENTS
   ============================================ */

// Header elements
const menuBtn = document.getElementById('menuBtn') as HTMLButtonElement;
const pinBtn = document.getElementById('pinBtn') as HTMLButtonElement;
const closeBtn = document.getElementById('closeBtn') as HTMLButtonElement;

// Navigation elements
const homeBtn = document.getElementById('homeBtn') as HTMLButtonElement;
const navSearchInput = document.getElementById('navSearchInput') as HTMLInputElement;
const goBtn = document.getElementById('goBtn') as HTMLButtonElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

// Favorites sidebar
const quickUrlInput = document.getElementById('quickUrlInput') as HTMLInputElement;
const quickAddBtn = document.getElementById('quickAddBtn') as HTMLButtonElement;
const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const countDisplay = document.getElementById('countDisplay') as HTMLSpanElement;

// Viewer area
const contentFrame = document.getElementById('contentFrame') as HTMLIFrameElement;
const viewerPlaceholder = document.getElementById(
  'viewerPlaceholder'
) as HTMLDivElement;

/* ============================================
   STATE
   ============================================ */

let allFavorites: Favorite[] = [];
let isDarkMode = localStorage.getItem('sideui-dark-mode') === 'true';

// Generate unique ID
function generateId(): string {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Extract favicon URL
function extractFaviconUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
  } catch {
    return '';
  }
}

// Initialize theme
function initTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
  }
}

// Toggle theme
function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('sideui-dark-mode', isDarkMode ? 'true' : 'false');
  initTheme();
}

/* ============================================
   CONTENT VIEWER
   ============================================ */

function openInViewer(url: string, title: string) {
  contentFrame.src = url;
  // Show iframe, hide placeholder
  viewerPlaceholder.classList.add('hidden');
  contentFrame.classList.remove('hidden');
}

function closeViewer() {
  contentFrame.src = 'about:blank';
  viewerPlaceholder.classList.remove('hidden');
  contentFrame.classList.add('hidden');
}

/* ============================================
   FAVORITES MANAGEMENT
   ============================================ */

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
    closeViewer();
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
  card.setAttribute('data-favorite-id', favorite.id);

  // Header section
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

  // Info
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
  openBtn.textContent = 'Open';
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openInViewer(favorite.url, favorite.title);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'favorite-action-btn remove';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFavorite(favorite.id);
  });

  actions.appendChild(openBtn);
  actions.appendChild(removeBtn);

  card.appendChild(header);
  card.appendChild(actions);

  // Click card to open
  card.addEventListener('click', () => {
    openInViewer(favorite.url, favorite.title);
  });

  return card;
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
    const favicon = extractFaviconUrl(url);

    const response = await chrome.runtime.sendMessage({
      type: MessageTypes.ADD_FAVORITE,
      payload: { url, favicon },
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
    countDisplay.textContent = 'No favorites';
  } else if (allFavorites.length === 1) {
    countDisplay.textContent = '1 favorite';
  } else {
    countDisplay.textContent = `${allFavorites.length} favorites`;
  }
}

/* ============================================
   NAVIGATION
   ============================================ */

function handleGoSearch() {
  const query = navSearchInput.value.trim();
  if (!query) return;

  // Check if it's a URL
  let url: string;
  if (query.startsWith('http://') || query.startsWith('https://')) {
    url = query;
  } else {
    // It's a search query
    url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  openInViewer(url, query);
  navSearchInput.value = '';
}

function setupEventListeners() {
  // Header
  closeBtn.addEventListener('click', () => {
    // Close the sidebar (extension-level control)
    chrome.runtime.sendMessage({ type: 'CLOSE_SIDEBAR' }).catch(() => {});
  });

  // Navigation
  homeBtn.addEventListener('click', closeViewer);
  goBtn.addEventListener('click', handleGoSearch);
  navSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGoSearch();
  });
  themeToggle.addEventListener('click', toggleTheme);

  // Favorites
  quickAddBtn.addEventListener('click', handleQuickAdd);
  quickUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleQuickAdd();
  });

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageTypes.FAVORITES_UPDATED) {
      loadFavorites();
    }
  });
}

/* ============================================
   INITIALIZATION
   ============================================ */

async function init() {
  initTheme();
  setupEventListeners();
  loadFavorites();
}

// Start
init();
