import { MessageTypes, Favorite } from '../types';

/* ============================================
   DOM ELEMENTS
   ============================================ */

// Navigation elements
const homeBtn = document.getElementById('homeBtn') as HTMLButtonElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
const forwardBtn = document.getElementById('forwardBtn') as HTMLButtonElement;
const navSearchInput = document.getElementById(
  'navSearchInput'
) as HTMLInputElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;

// Tabs elements
const tabsList = document.getElementById('tabsList') as HTMLDivElement;
const addTabBtn = document.getElementById('addTabBtn') as HTMLButtonElement;

// Favorites sidebar
const quickUrlInput = document.getElementById('quickUrlInput') as HTMLInputElement;
const quickAddBtn = document.getElementById('quickAddBtn') as HTMLButtonElement;
const favoritesList = document.getElementById('favoritesList') as HTMLDivElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const countDisplay = document.getElementById('countDisplay') as HTMLSpanElement;

// Viewer area
const contentFrame = document.getElementById('contentFrame') as HTMLIFrameElement;
const viewerTitle = document.getElementById('viewerTitle') as HTMLDivElement;
const closeTabBtn = document.getElementById('closeTabBtn') as HTMLButtonElement;
const viewerPlaceholder = document.getElementById(
  'viewerPlaceholder'
) as HTMLDivElement;

/* ============================================
   STATE MANAGEMENT
   ============================================ */

interface Tab {
  id: string;
  title: string;
  url: string;
}

let allFavorites: Favorite[] = [];
let isDarkMode = localStorage.getItem('sideui-dark-mode') === 'true';
let tabs: Tab[] = [];
let activeTabId: string | null = null;

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
   TAB MANAGEMENT
   ============================================ */

function createNewTab(url?: string, title?: string): string {
  const id = generateId();
  const newTab: Tab = {
    id,
    url: url || 'about:blank',
    title: title || 'New Tab',
  };
  tabs.push(newTab);
  activeTabId = id;
  renderTabs();
  loadTab(id);
  return id;
}

function loadTab(id: string) {
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;

  activeTabId = id;
  contentFrame.src = tab.url;
  viewerTitle.textContent = tab.title;
  renderTabs();

  // Show iframe, hide placeholder
  viewerPlaceholder.classList.add('hidden');
  contentFrame.classList.remove('hidden');
}

function closeTab(id: string) {
  tabs = tabs.filter((t) => t.id !== id);

  if (activeTabId === id) {
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
      loadTab(activeTabId);
    } else {
      activeTabId = null;
      viewerTitle.textContent = 'Welcome to SideUI';
      viewerPlaceholder.classList.remove('hidden');
      contentFrame.classList.add('hidden');
      contentFrame.src = 'about:blank';
    }
  }

  renderTabs();
}

function renderTabs() {
  tabsList.innerHTML = '';

  tabs.forEach((tab) => {
    const tabEl = document.createElement('button');
    tabEl.className = 'tab';
    if (tab.id === activeTabId) {
      tabEl.classList.add('active');
    }

    // Tab title
    const titleSpan = document.createElement('span');
    titleSpan.textContent = tab.title;
    titleSpan.style.flex = '1';
    tabEl.appendChild(titleSpan);

    // Close button
    const closeSpan = document.createElement('span');
    closeSpan.className = 'tab-close';
    closeSpan.textContent = '✕';
    closeSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    tabEl.appendChild(closeSpan);

    // Click to load
    tabEl.addEventListener('click', () => {
      loadTab(tab.id);
    });

    tabsList.appendChild(tabEl);
  });
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
    openFavoriteInNewTab(favorite);
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

  // Click card to open in new tab
  card.addEventListener('click', () => {
    openFavoriteInNewTab(favorite);
  });

  return card;
}

function openFavoriteInNewTab(favorite: Favorite) {
  // Find if already open
  const existingTab = tabs.find((t) => t.url === favorite.url);
  if (existingTab) {
    loadTab(existingTab.id);
  } else {
    createNewTab(favorite.url, favorite.title);
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

function handleNavSearch() {
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

  // Try to add to existing tab or create new
  const existingTab = tabs.find((t) => t.url === url);
  if (existingTab) {
    loadTab(existingTab.id);
  } else {
    createNewTab(url, query.length > 20 ? query.substring(0, 20) + '...' : query);
  }

  navSearchInput.value = '';
}

function setupEventListeners() {
  // Navigation
  homeBtn.addEventListener('click', () => {
    viewerTitle.textContent = 'Welcome to SideUI';
    viewerPlaceholder.classList.remove('hidden');
    contentFrame.classList.add('hidden');
    contentFrame.src = 'about:blank';
    activeTabId = null;
  });

  navSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleNavSearch();
  });

  themeToggle.addEventListener('click', toggleTheme);

  // Tabs
  addTabBtn.addEventListener('click', () => createNewTab());
  closeTabBtn.addEventListener('click', () => {
    if (activeTabId) {
      closeTab(activeTabId);
    }
  });

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

  // Create first tab
  createNewTab('about:blank', 'Welcome to SideUI');
}

// Start
init();
