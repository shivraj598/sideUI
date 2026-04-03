# SideUI Architecture & Development Guide

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Chrome Browser                         │
├────────────────┬──────────────────┬──────────────────────┤
│ Background    │   Popup          │   Sidebar            │
│ Service       │   (Icon Click)   │   (Side Panel)       │
│ Worker        │                  │                      │
├────────────────┼──────────────────┼──────────────────────┤
│ • Message hub │ • Quick add      │ • Full interface     │
│ • Storage ops │ • Recent items   │ • Search/filter      │
│ • Broadcasts  │ • Open sidebar   │ • Manage all items   │
└────────────────┴──────────────────┴──────────────────────┘
          ↓               ↓                    ↓
      chrome.storage.local (Chrome's local storage API)
```

## Component Details

### 1. Background Service Worker (`src/background/background.ts`)

The brain of the extension. Runs in the background and handles:

- **Message Processing**: Routes all messages from popup/sidebar
- **Storage Operations**: Calls StorageManager for CRUD operations
- **Broadcasting**: Updates all open tabs when data changes
- **UI Control**: Opens/toggles sidebars and tabs

**Key Methods:**
```typescript
handleMessage()       // Routes incoming messages
ADD_FAVORITE         // Stores new favorite
REMOVE_FAVORITE      // Deletes favorite
GET_FAVORITES        // Retrieves all favorites
OPEN_URL             // Opens URL in tab/sidebar
```

### 2. Storage Manager (`src/utils/storage.ts`)

Data layer abstraction for Chrome storage.

**Key Methods:**
```typescript
getFavorites()       // Get all stored favorites
addFavorite()        // Create new favorite
removeFavorite()     // Delete a favorite
clearAllFavorites()  // Nuclear option
```

**Storage Format:**
```typescript
{
  "sideui_favorites": {
    "favorites": [
      {
        "id": "fav_1234567890_abc123",
        "url": "https://github.com",
        "title": "GitHub",
        "addedAt": 1699564800000,
        "favicon": "data:image/png;base64,..."
      }
    ]
  }
}
```

### 3. Popup (`src/popup/popup.ts`)

Lightweight interface that appears when clicking the extension icon.

**Features:**
- Auto-fills current page URL
- Search functionality (filtered from full favorites)
- Quick access to recent additions
- One-click sidebar toggle

**Data Flow:**
```
User enters URL
    ↓
Validate URL
    ↓
Send ADD_FAVORITE message
    ↓
Background processes & stores
    ↓
Popup refreshes list
    ↓
User sees confirmation
```

### 4. Sidebar (`src/sidebar/sidebar.ts`)

Main interface for managing favorites. Rendered in the browser's side panel.

**Features:**
- Display all favorites with search
- Quick add bar for pasting URLs
- Open in current tab or new tab
- Delete favorites
- Real-time count display

**Real-time Updates:**
The sidebar listens for `FAVORITES_UPDATED` messages from the background worker and refreshes automatically.

## Message Protocol

All inter-component communication uses a message-based system:

### Message Structure
```typescript
{
  type: "MESSAGE_TYPE",
  payload: { ... data ... }
}
```

### Message Types

| Type | Origin | Handler | Payload |
|------|--------|---------|---------|
| `ADD_FAVORITE` | Popup/Sidebar | Background | `{url, title?, favicon?}` |
| `GET_FAVORITES` | Popup/Sidebar | Background | `{}` |
| `REMOVE_FAVORITE` | Popup/Sidebar | Background | `{id}` |
| `OPEN_URL` | Popup/Sidebar | Background | `{url, newTab}` |
| `FAVORITES_UPDATED` | Background | Popup/Sidebar | `{favorites? or removed}` |

### Example Flow

**Adding a favorite:**
```
Sidebar UI: User clicks "Add"
    ↓
sidebar.ts: Validates URL
    ↓
chrome.runtime.sendMessage({
  type: "ADD_FAVORITE",
  payload: { url: "...", title: "..." }
})
    ↓
background.ts: Receives message
    ↓
StorageManager.addFavorite()
    ↓
background.ts: Broadcasts to all tabs
    ↓
Sidebar receives FAVORITES_UPDATED
    ↓
Sidebar re-renders list
```

## TypeScript Interfaces

### Core Types (`src/types.ts`)

```typescript
interface Favorite {
  id: string;          // UUID-like ID
  url: string;         // Full URL
  title: string;       // Display name
  addedAt: number;     // Epoch timestamp
  favicon?: string;    // Optional data URL
}

interface StorageData {
  favorites: Favorite[];
}

interface Message {
  type: string;
  payload?: any;
}
```

## Chrome APIs Used

### `chrome.storage.local`
Persistent key-value storage.
```typescript
// Get
chrome.storage.local.get([key], callback)

// Set
chrome.storage.local.set({key: value}, callback)
```

### `chrome.runtime.sendMessage`
Communicate between extension parts.
```typescript
// Send message and get response
chrome.runtime.sendMessage(message, (response) => {...})
```

### `chrome.runtime.onMessage`
Listen for incoming messages.
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message
})
```

### `chrome.sidePanel`
Control the sidebar panel.
```typescript
chrome.sidePanel.open({ tabId: tab.id })
chrome.sidePanel.toggle({ tabId: tab.id })
```

### `chrome.tabs`
Manage browser tabs.
```typescript
chrome.tabs.query(...)     // Find tabs
chrome.tabs.create(...)    // Open new tab
chrome.tabs.update(...)    // Update tab
```

## UI Components

### Popup UI
```html
Header
  ├─ Title
  └─ Open Sidebar button
Form
  ├─ URL input
  ├─ Title input
  └─ Add button
Recent Favorites List
  └─ Clickable items with remove
```

### Sidebar UI
```html
Header
  ├─ Title
  ├─ Search input
  └─ Clear all button
Quick Add Bar
  ├─ URL input
  └─ Add button (+)
Stats Display
Favorites Grid
  └─ Favorite Cards
       ├─ Favicon
       ├─ Title
       ├─ URL
       └─ Actions (Open, New Tab, Remove)
```

## Styling Strategy

- **Color Palette**: Purple gradient (`#667eea` → `#764ba2`)
- **Typography**: System fonts for performance
- **Spacing**: 8px base unit
- **Responsive**: Sidebar width varies, content adapts

**SCSS not used** - Plain CSS for minimal build size.

## Build Process

```
TypeScript Files (src/)
    ↓
webpack --mode production
    ↓
TypeScript compiled to JavaScript
    ↓
CopyPlugin copies static assets (HTML, CSS, JSON)
    ↓
dist/ folder with:
  ├─ background.js
  ├─ popup.js
  ├─ sidebar.js
  ├─ manifest.json
  ├─ popup.html
  ├─ sidebar.html
  └─ *.css files
    ↓
Load in Chrome from dist/
```

## Performance Considerations

1. **Bundle Size**: Keep under 5MB (typical is ~50KB)
2. **Storage**: Chrome allows 10MB per extension
3. **Runtime**: Service worker runs only when needed
4. **Network**: No requests made - fully local

## Error Handling

All major operations wrap in try-catch:
```typescript
try {
  const response = await chrome.runtime.sendMessage(message)
  if (response.success) { ... }
} catch (error) {
  console.error('Error:', error)
  // Show user-friendly message
}
```

## Testing Tips

### Manual Testing
1. Add a favorite from popup
2. Verify it appears in sidebar
3. Remove from sidebar
4. Verify popup updates
5. Refresh and verify persistence
6. Test search functionality

### Debug Console
- Open `chrome://extensions/`
- Click "Errors" to see service worker errors
- Open popup/sidebar and use DevTools (inspect)

### Storage Inspection
- Chrome DevTools → Application → Chrome Extensions Storage
- Or `chrome://extensions/` → Details → Storage

## Common Modifications

### Change Colors
Edit CSS gradient in `popup.css` and `sidebar.css`:
```css
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Add New Feature
1. Add message type to `src/types.ts`
2. Add handler in `src/background/background.ts`
3. Call from popup/sidebar (UI)
4. Update UI to reflect changes

### Add New Field to Favorites
1. Update `Favorite` interface in `src/types.ts`
2. Update StorageManager in `src/utils/storage.ts`
3. Update place where favorites are created/displayed

## Deployment

1. Test thoroughly locally
2. Run `npm run build` for production build
3. Zip the `dist/` folder
4. Upload to Chrome Web Store (requires developer account)
5. Or distribute as `.crx` file

---

For more info, see [QUICKSTART.md](QUICKSTART.md) or [README.md](README.md)
