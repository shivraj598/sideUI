# SideUI - Chrome Extension Sidebar for Managing Favorites

A lightweight Chrome extension that provides a sidebar interface for saving and managing your favorite URLs without storing any search history in Chrome.

## Features

✨ **Sidebar Interface** - Access your favorites in a sleek side panel
🔖 **Quick Add** - Save URLs instantly from the sidebar or popup
🔍 **Search** - Filter your favorites by title or URL
🗑️ **Clean** - No search history stored in Chrome
⌨️ **Keyboard Shortcut** - Toggle sidebar with `Cmd+Shift+U` (Mac) or `Ctrl+Shift+U` (Windows/Linux)
📱 **Recent Favorites** - Quick access to recently added favorites in the popup
🎨 **Modern UI** - Beautiful gradient design with smooth interactions
📤 **Open Options** - Open URLs in current tab or new tab

## Project Structure

```
sideUI/
├── src/
│   ├── background/
│   │   └── background.ts       # Service worker - handles messaging and storage
│   ├── popup/
│   │   ├── popup.html          # Popup UI
│   │   ├── popup.css           # Popup styles
│   │   └── popup.ts            # Popup logic
│   ├── sidebar/
│   │   ├── sidebar.html        # Sidebar UI
│   │   ├── sidebar.css         # Sidebar styles
│   │   └── sidebar.ts          # Sidebar logic
│   ├── utils/
│   │   └── storage.ts          # Chrome storage management
│   ├── types.ts                # TypeScript interfaces
│   └── manifest.json           # Chrome extension manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Installation

### Prerequisites
- Node.js 16+ and npm
- Google Chrome

### Build from Source

1. **Clone the repository**
   ```bash
   cd sideUI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Build in watch mode
```bash
npm run dev
```

This will rebuild the extension automatically when files change.

### File Changes Workflow
1. Make changes to TypeScript files in `src/`
2. Webpack rebuilds the `dist/` folder
3. Refresh the extension in `chrome://extensions/` to see changes

## Usage

### From Popup
1. Click the SideUI icon in Chrome toolbar
2. The popup shows the current page URL
3. Enter a custom title (optional)
4. Click "Add to Favorites"
5. View recent favorites below

### From Sidebar
1. Press `Cmd+Shift+U` (Mac) or `Ctrl+Shift+U` (Windows/Linux)
2. Or click the sidebar arrow in the popup
3. Paste a URL in the quick add box and click `+`
4. Use search to filter favorites
5. Click any favorite to open it
6. Use "Open" to replace current tab
7. Use "New Tab" to open in a new tab
8. Click "Remove" to delete a favorite

## Data Storage

- **Location**: Chrome's `chrome.storage.local` API
- **History**: No search history is stored in Chrome
- **Sync**: Data is stored locally (not synced across devices)
- **Privacy**: All data remains private to your Chrome profile

## API Reference

### Types

```typescript
interface Favorite {
  id: string;                // Unique identifier
  url: string;              // The URL
  title: string;            // Display title
  addedAt: number;          // Timestamp when added
  favicon?: string;         // Optional favicon URL
}

interface Message {
  type: string;
  payload?: any;
}
```

### Message Types

- `ADD_FAVORITE` - Add a new favorite
- `REMOVE_FAVORITE` - Remove a favorite
- `GET_FAVORITES` - Retrieve all favorites
- `FAVORITES_UPDATED` - Notification of changes
- `OPEN_URL` - Open a URL in a tab

## Architecture

### Background Service Worker
- Manages all message communication
- Handles storage operations
- Controls sidebar toggle
- Broadcasts updates to all tabs

### Popup
- Quick URL addition interface
- Shows current page URL/title by default
- Displays recent favorites
- Recent list updates in real-time

### Sidebar
- Main interface for viewing favorites
- Search and filter capabilities
- Quick add bar at top
- Shows favorite count
- Responsive and scrollable

### Storage Manager
- Abstraction layer for Chrome storage API
- CRUD operations for favorites
- Automatic ID generation
- Error handling

## Browser Compatibility

- Chrome 92+
- Edge 92+
- Other Chromium-based browsers

## Building for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for distribution.

## Privacy & Security

✅ **No tracking** - We don't track your favorites
✅ **Local storage only** - All data stays on your device
✅ **No network requests** - The extension doesn't send data anywhere
✅ **No search history** - Chrome search history is never touched
✅ **Open source** - Review the code yourself

## Troubleshooting

### Extension not appearing
- Make sure to load from `dist/` folder after running `npm run build`
- Enable "Developer mode" in chrome://extensions/

### Sidebar doesn't open
- Try the keyboard shortcut: `Cmd+Shift+U` / `Ctrl+Shift+U`
- Reload the extension in chrome://extensions/

### Changes not reflecting
- Run `npm run build` to rebuild
- Refresh the extension in chrome://extensions/

### Favorites not saving
- Check if Chrome storage is enabled
- Try clearing Chrome cache and reloading

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - Feel free to use and modify