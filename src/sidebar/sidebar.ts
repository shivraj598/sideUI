import { MessageTypes, Favorite } from '../types';

// Left panel elements
const googleSearch = document.getElementById('googleSearch') as HTMLInputElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
const quickUrlInput = document.getElementById('quickUrlInput') as HTMLInputElement;
const quickAddBtn = document.getElementById('quickAddBtn') as HTMLButtonElement;
const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const countDisplay = document.getElementById('countDisplay') as HTMLSpanElement;

// Right panel (iframe viewer) elements
const contentFrame = document.getElementById('contentFrame') as HTMLIFrameElement;
const viewerTitle = document.getElementById('viewerTitle') as HTMLDivElement;
const closeViewerBtn = document.getElementById('closeViewerBtn') as HTMLButtonElement;
const viewerPlaceholder = document.getElementById('viewerPlaceholder') as HTMLDivElement;

let allFavorites: Favorite[] = [];
let isDarkMode = localStorage.getItem('sideui-dark-mode') === 'true';
let currentViewingId: string | null = null;

// Extract favicon URL using Google's favicon service
function extractFaviconUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
  } catch {
    return '';
  }
}

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

  // Close viewer button
  closeViewerBtn.addEventListener('click', closeViewer);
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

function openInViewer(url: string, title: string, favoriteId?: string) {
  currentViewingId = favoriteId || null;
  contentFrame.src = url;
  viewerTitle.textContent = title;
  viewerPlaceholder.classList.add('hidden');
  contentFrame.classList.remove('hidden');
  
  // Update active state on favorite cards
  document.querySelectorAll('.favorite-card').forEach((card) => {
    card.classList.remove('active');
  });
  if (favoriteId) {
    const activeCard = document.querySelector(
      `[data-favorite-id="${favoriteId}"]`
    );
    if (activeCard) {
      activeCard.classList.add('active');
    }
  }
}

function closeViewer() {
  currentViewingId = null;
  contentFrame.src = 'about:blank';
  viewerPlaceholder.classList.remove('hidden');
  contentFrame.classList.add('hidden');
  document.querySelectorAll('.favorite-card').forEach((card) => {
    card.classList.remove('active');
  });
}

async function handleGoogleSearch() {
  const query = googleSearch.value.trim();

  if (!query) return;

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  openInViewer(searchUrl, `Search: ${query}`);
  googleSearch.value = '';
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

  if (currentViewingId === favorite.id) {
    card.classList.add('active');
  }

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
    openInViewer(favorite.url, favorite.title, favorite.id);
  });

  const removeBtn = document.createElement('button');
  removeBtn.className = 'favorite-action-btn remove';
  removeBtn.textContent = '✕ Remove';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFavorite(favorite.id);
  });

  actions.appendChild(openBtn);
  actions.appendChild(removeBtn);

  card.appendChild(header);
  card.appendChild(actions);

  // Click card to open in viewer
  card.addEventListener('click', () => {
    openInViewer(favorite.url, favorite.title, favorite.id);
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
      // If we're viewing the deleted favorite, close the viewer
      if (currentViewingId === id) {
        closeViewer();
      }
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
    // Extract favicon before sending
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
    countDisplay.textContent = 'No favorites yet';
  } else if (allFavorites.length === 1) {
    countDisplay.textContent = '1 favorite';
  } else {
    countDisplay.textContent = `${allFavorites.length} favorites`;
  }
}

// Initialize on load
init();
