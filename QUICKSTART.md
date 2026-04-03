# SideUI Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Install & Build
```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

### 2. Load Extension in Chrome
1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Navigate to the `dist/` folder and select it

### 3. Start Using!
- Click the SideUI icon in your toolbar
- Or press `Cmd+Shift+U` (Mac) / `Ctrl+Shift+U` (Windows)

---

## 🔧 Development Workflow

### Watch Mode (Auto-rebuild)
```bash
npm run dev
```
This watches your TypeScript files and rebuilds automatically.

### After Making Changes
1. Files in `src/` are automatically rebuilt to `dist/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on the SideUI card
4. Your changes appear immediately!

### Code Quality
```bash
# Lint your code
npm run lint

# Format all files
npm run format
```

---

## 📁 Where to Make Changes

- **Add/Remove/Edit Favorites**: `src/sidebar/sidebar.ts`
- **Change UI Layout**: `src/sidebar/sidebar.html` or `src/popup/popup.html`
- **Style Updates**: `src/sidebar/sidebar.css` or `src/popup/popup.css`
- **Storage Logic**: `src/utils/storage.ts`
- **Message Handling**: `src/background/background.ts`

---

## 🐛 Troubleshooting

### Extension disappeared?
```bash
npm run build
```
Then reload from `chrome://extensions/`

### Old data still showing?
Try clearing the stored data:
1. Go to `chrome://extensions/`
2. Click **Details**
3. Scroll down and find Storage → Clear site data

### Getting TypeScript errors?
```bash
# Make sure TypeScript is up to date
npm install --save-dev typescript@latest
```

---

## 📦 Production Build

```bash
npm run build
```

The `dist/` folder now contains your production-ready extension!

---

## 🔐 Privacy Checklist

✅ No data sent anywhere
✅ No search history tracked
✅ All stored locally
✅ Can be uninstalled and all data deleted instantly

---

## 📚 Useful Chrome APIs

Some key Chrome APIs used in this extension:

- `chrome.storage.local` - Save/load favorites
- `chrome.sidePanel` - Manage sidebar
- `chrome.runtime.sendMessage` - Communicate between parts
- `chrome.tabs` - Open/manage tabs

Check `src/background/background.ts` to see how they're used!

---

## 🚀 Next Steps

- Customize colors in `src/popup/popup.css` and `src/sidebar/sidebar.css`
- Add keyboard shortcuts in `src/manifest.json`
- Modify the UI in the HTML files
- Add new features by extending message types in `src/types.ts`

Happy coding! 🎉
