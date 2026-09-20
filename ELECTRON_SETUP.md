# PDFirst — Desktop Electron Setup Guide

This guide describes how to run and package **PDFirst** as a native desktop application using Electron.

---

## 1. Prerequisites & Required Packages

To enable Electron desktop execution and packaging, the following dev-dependencies are required:

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

| Package | Purpose |
| :--- | :--- |
| **`electron`** | Desktop Chromium + Node.js runtime container. |
| **`electron-builder`** | Packages standalone installers (`.exe`, `.dmg`, `.AppImage`). |
| **`concurrently`** | Runs the Vite dev server and Electron process concurrently in dev mode. |
| **`wait-on`** | Waits for `http://localhost:5173` to be ready before launching the Electron window. |
| **`cross-env`** | Sets `NODE_ENV=development` cross-platform (Windows, macOS, Linux). |

---

## 2. Configuration & Scripts

### `package.json` Integration
The main entry point points to `electron/main.cjs`:
```json
{
  "main": "electron/main.cjs",
  "scripts": {
    "dev:electron": "cross-env NODE_ENV=development concurrently -k \"npm run dev\" \"wait-on tcp:5173 && electron .\"",
    "build:electron": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.pdfirst.app",
    "productName": "PDFirst",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis", "portable"]
    },
    "mac": {
      "target": ["dmg"],
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": ["AppImage"]
    }
  }
}
```

---

## 3. How to Run in Development Mode

To start the Vite live dev server and launch the desktop Electron window with Hot Module Replacement (HMR):

```powershell
npm run dev:electron
```

1. Vite launches the development server on `http://localhost:5173`.
2. `wait-on` monitors port 5173 until the server is responsive.
3. Electron spawns a native window (1200x800 default size) titled **PDFirst** connected to the live dev server.
4. Any code changes made to React components, styling, or extensions hot-reload instantly inside the Electron window.

---

## 4. How to Build a Distributable Package

To build the static web application and compile native desktop distributables:

```powershell
npm run build:electron
```

### What Happens:
1. **`npm run build`** runs `tsc && vite build`, compiling the production bundle to `dist/` with relative asset links (`./assets/...`).
2. **`electron-builder`** packages the production assets and Electron binary into the `release/` directory:
   - **Windows:** Generates an NSIS setup installer (`.exe`) and a standalone portable executable.
   - **macOS:** Generates an Apple disk image (`.dmg`).
   - **Linux:** Generates a standalone Linux binary (`.AppImage`).

---

## 5. Known Limitations & Future Enhancements

1. **Sandboxed File Operations:**
   - In this initial minimal wrapper, opening and saving documents functions using standard in-browser dialogs and browser download streams inside the Electron window.
   - *Future Enhancement:* Add native IPC handlers (`ipcMain` / `ipcRenderer`) for `dialog.showOpenDialog` and `dialog.showSaveDialog` to enable in-place disk saves (`Ctrl+S`) directly to arbitrary folder paths on disk without browser download prompts.
2. **Native Application Menu:**
   - Currently uses standard window framing. Native OS menu bars (`File`, `Edit`, `Insert`, `View`, `Export`) can be registered via `electron.Menu` in a subsequent milestone.
3. **OS File Associations:**
   - Double-clicking `.pdfirst` or `.pdf` files from Windows File Explorer will be enabled once file associations are bound in the main process lifecycle.
