# PDFirst — Cross-Platform Desktop & Mobile Packaging Plan

**Document Version:** 2.1.0  
**Date:** September 20, 2026  
**Auditor:** Antigravity Architecture & Verification Team  
**Scope:** Packaging PDFirst for Desktop (Tauri v2 vs Electron) and Mobile (PWA Primary / Native Shell Future) as a Personal Offline-First Document & PDF Studio.

---

## 1. Inspection of Current Architecture (Vite + React + PWA)

The PDFirst application is built with a strictly decoupled architecture where presentation, document state, and platform persistence are cleanly separated. Following the completion of the MVP foundation and Phases A, B, and C, the current system comprises:

1. **Frontend Framework & UI Layer:**
   - **React 18.3.1:** Functional component architecture with strict hook lifecycles, error boundaries (`ErrorBoundary.tsx`), and conditional modal mounting.
   - **TypeScript 5.5.4:** Strongly typed domain models, AST schemas, and platform contracts.
2. **Bundler & Build Pipeline:**
   - **Vite 5.4.21:** ESM development server with optimized Rollup production bundling.
   - **Build Output (`dist/`):** Pure static client-side web assets (`index.html`, JavaScript chunks, CSS stylesheets, icons, and manifest). Zero server-side rendering (SSR) or runtime backend server required.
3. **Rich-Text Editor Core:**
   - **Tiptap 2.6.6 & ProseMirror (`@tiptap/pm`):** Manages interactive text editing, formatting marks, and custom block nodes.
   - **Custom Extensions:**
     - `PageBreakExtension`: Atom block nodes representing manual page breaks with `Ctrl+Enter` shortcut.
     - `CustomImageNode` with `ImageBlockView`: NodeView supporting client-side rectangular crop (`react-image-crop 11.0.7`), horizontal alignment (left/center/right), width presets (25%, 50%, 75%, 100%), text wrap modes (none/left/right), inline editable captions (`<figcaption>`), and broken-image fallback alerts.
     - Text styling marks: Custom color and background highlight marks with hex palettes and presets.
     - Block borders: Block-level border width (0–4px), border style (solid/dashed/dotted), border color, and callout toggles.
     - Tables: Tiptap table extensions with cell background colors, header row styling, and border customization.
   - **Document Model (`DocumentModel`):** Serializable JSON Abstract Syntax Tree (AST) representing pages, blocks, and inline spans. This JSON model is the single source of truth for persistence and PDF compilation.
4. **Client-Side PDF Engine:**
   - **Vector PDF Compilation:** `jspdf 2.5.1` + `jspdf-autotable 3.8.2` compile vector PDF binaries entirely in-browser in $<50\text{ ms}$ with zero server round-trips.
   - **Digital PDF Ingestion:** `pdfjs-dist 3.11.174` with dedicated worker extracts text streams, statistical font sizes ($S_{body}$ lower median for H1–H3 classification), list glyphs, tabular column coordinates, and graphic state fill colors.
   - **Honest Scanned-PDF Detection:** Identifies non-searchable image-based PDFs ($<50$ characters) and presents an honest alert card preventing empty/corrupt document creation.
5. **Styling & Design System:**
   - **Vanilla CSS Tokens:** CSS custom properties (`tokens.css`, `components.css`) defining light/dark modes, elevations, typography, and responsive breakpoints. Zero TailwindCSS dependency.
   - **Mobile Viewport Optimization:** `interactive-widget=resizes-content, viewport-fit=cover`, horizontal scroll lock (`overflow-x: hidden`), touch targets $\ge 36\text{px}-44\text{px}$, and bottom-sheet docking for color pickers on screens $\le 640\text{px}$.
6. **Existing PWA Setup:**
   - **Web App Manifest (`public/manifest.json`):** Name: *"PDF-First Editor"*, Short Name: *"PDF Editor"*, Display: `"standalone"`, Theme Color: `"#2563eb"`, Background Color: `"#f8fafc"`. Standard square and maskable icons (`192x192`, `512x512`, SVG).
   - **Service Worker (`public/sw.js`):** Custom two-tier caching (`pdfirst-cache-v1`): pre-caches app shell, network-first navigation fallback to `/index.html`, and cache-first static asset caching.
   - **Install Prompt Coordination (`src/pwa/pwaManager.ts`):** Captures `beforeinstallprompt` to drive the header bar "Install App" button (`#btn-install-pwa`).
7. **Local Persistence:**
   - **IndexedDB via `idb 8.0.0` (`PDFirstDB`):** `documents` store (full `DocumentModel`) and `metadata` store (indexed by `by-updatedAt`).
   - **Debounced Autosave (`AutosaveManager`):** 1500ms keystroke debounce with reactive UI badge states (`idle`, `dirty`, `saving`, `saved`, `error`).
   - **Emergency Backup:** Synchronous fallback to `localStorage` (`pdfirst_backup_${id}`) on `beforeunload` or storage failure.

**Architectural Takeaway:** Because PDFirst is 100% client-side, self-contained, and DOM-driven, it can be packaged for desktop and mobile with **zero changes to the document model, editor extensions, or PDF compilation engine**.

---

## 2. Desktop Packaging Recommendation (Electron vs Tauri v2)

For a personal application running on desktop operating systems (Windows, macOS, Linux), we evaluated the two leading packaging technologies:

| Criteria | Tauri v2 (Recommended Modern Choice) | Electron (Pragmatic Zero-Rust Alternative) |
| :--- | :--- | :--- |
| **Binary Size** | **< 10 MB** installer | **~85 MB – 120 MB** installer |
| **Idle Memory (RAM)** | **~35 MB – 50 MB** | **~150 MB – 250 MB** |
| **Rendering Engine** | Native OS WebView (Microsoft WebView2 on Windows 10/11, WebKit on macOS) | Bundled Chromium binary |
| **Backend Runtime** | Rust Core (safe, minimal attack surface, fast IPC) | Node.js Runtime (full Node standard library) |
| **Developer Prerequisites** | Requires Rust toolchain (`rustup`, `cargo`) + platform C++ build tools | Standard Node.js / npm only (`npm install electron`) |
| **File System Access** | Direct disk I/O via `tauri-plugin-fs` & `tauri-plugin-dialog` | Direct disk I/O via Node.js `fs/promises` & `dialog` |
| **Native Menus & Shortcuts** | Built-in native OS application menus with accelerators | Full native menu bar and global shortcut support |
| **File Associations** | Native `.pdfirst` & `.pdf` association via OS manifest | Native file associations via `electron-builder` |
| **Auto-Updater** | Built-in signed update module (`tauri-plugin-updater`) | Supported via `electron-updater` |

### 2.1 Why Tauri v2 is the Primary Recommendation for a Personal App
1. **Negligible Resource Overhead:** Electron launches an entire separate Chromium browser instance for your app. Tauri reuses the Microsoft WebView2 already pre-installed on Windows 10/11 (and WebKit on macOS), resulting in near-instant startup ($<0.5\text{s}$) and featherweight memory usage (~40MB vs ~200MB).
2. **Native Feel:** Tauri windows blend natively into Windows 11 Fluent design or macOS Mica/Vibrant designs, supporting native window controls, snap layouts, and OS menu bars.
3. **Atomic File System Safety:** Tauri's Rust backend handles atomic file writes, preventing partial file corruption if a machine loses power during an autosave.
4. **Zero Code Changes to UI:** Tauri points directly to Vite's `dist/` directory; React components render identically in WebView2.

### 2.2 When to Choose Electron as a Pragmatic Alternative
If you prefer not to install the Rust compiler (`rustup`) or C++ build tools on your Windows development machine, **Electron is the battle-tested, zero-friction alternative**. With Electron:
- You only need `npm install --save-dev electron electron-builder`.
- You get guaranteed 100% visual uniformity across every machine because Chromium is bundled directly.
- Writing IPC handlers for native file dialogs takes fewer than 50 lines of pure JavaScript/TypeScript.

**Decision Guideline for Personal Setup:**
- **Recommended Default:** Use **Tauri v2** for an ultra-clean, lightweight personal tool that uses minimal system resources.
- **Fast-Track Alternative:** Use **Electron** if you want to package a desktop app in 15 minutes using only existing `npm` tooling without configuring a Rust build environment.

---

## 3. Mobile Packaging Strategy

### 3.1 Primary Mobile Strategy: Progressive Web App (PWA) — Active Now
For a personal document editor, **PWA is the recommended primary mobile delivery method right now**. It offers unmatched advantages:
1. **Instant, Zero-Friction Installation:**
   - **Android:** Chrome displays the native *"Add PDFirst to Home screen"* or WebAPK install prompt; clicking it creates a standalone app icon in the app drawer.
   - **iOS / iPadOS:** Safari's *"Add to Home Screen"* installs PDFirst as an independent fullscreen web app without browser address bars (`apple-mobile-web-app-capable: yes`).
2. **Zero App Store Overhead:**
   - No $99/year Apple Developer program subscription.
   - No $25 Google Play Console registration fee.
   - No app review wait times, sandbox restrictions, or arbitrary store rejections.
3. **100% Offline Capability:**
   - The Service Worker (`public/sw.js`) caches the complete application bundle (`pdfirst-cache-v1`).
   - IndexedDB stores all documents and metadata locally on the device.
   - PDF generation runs entirely in JavaScript with `jspdf`—no server connection is ever contacted.
4. **Refined Mobile Ergonomics:**
   - Viewport resizing via `interactive-widget=resizes-content` ensures the virtual keyboard does not obscure the text cursor.
   - Minimum $36\text{px}-44\text{px}$ touch target sizes.
   - Popovers and color pickers dock comfortably as bottom sheets on narrow screens.

### 3.2 Secondary Mobile Strategy: Native Shell via Capacitor (Future Option)
If native device capabilities beyond the browser sandbox are needed in the future, **Capacitor by Ionic** is the recommended packaging bridge.

#### Why Capacitor Over React Native:
- **React Native is INCOMPATIBLE:** React Native does not use a DOM. It has no support for HTML elements, `contenteditable`, ProseMirror, Tiptap, or CSS. Adopting React Native would require rewriting 100% of the editor and styling engine.
- **Capacitor Preserves 100% of the Web Code:** Capacitor wraps the Vite `dist/` output inside a native `WKWebView` (iOS) or `WebView` (Android) shell.

#### Key Capabilities Unlocked by Capacitor in the Future:
- `@capacitor/share`: Direct access to the native iOS/Android Share Sheet for PDF exports (allowing one-tap AirDrop, AirPrint, WhatsApp, Google Drive, or saving directly to the Apple Files app).
- `@capacitor/filesystem`: Direct reading and writing to device document folders outside browser storage quotas.
- `@capacitor/keyboard`: Fine-grained programmatic control over virtual keyboard animations and accessory views.

---

## 4. File System Access Strategy

### 4.1 Current Web / PWA Storage (IndexedDB)
Currently, PDFirst stores all document data inside the browser's sandboxed storage:
- **Primary Store (`PDFirstDB`):**
  - `documents` object store: Keyed by UUID (`doc.metadata.id`). Contains the complete `DocumentModel` JSON AST.
  - `metadata` object store: Keyed by UUID, indexed by `by-updatedAt`. Stores lightweight telemetry (title, word count, page count, timestamps) to render the library dashboard instantly without decompressing large ASTs.
- **Autosave Pipeline (`AutosaveManager`):** Debounces edits by 1500ms and flushes changes to IndexedDB, updating the header save badge.
- **Emergency Protection:** A synchronous write to `localStorage` (`pdfirst_backup_${id}`) triggers on `beforeunload` or if IndexedDB quota errors occur.

### 4.2 How Desktop Packaging Improves File Access (Future)
When packaged for desktop (via Tauri or Electron), file system access transitions from an isolated browser sandbox to a true native productivity experience:

| Workflow | Current Web / PWA | Future Packaged Desktop (Tauri / Electron) |
| :--- | :--- | :--- |
| **Open Document** | File picker uploads document into IndexedDB | **Native OS Open Dialog:** Open `.pdfirst` or `.pdf` from any local or cloud folder (Dropbox, OneDrive, etc.). |
| **Save Existing File** | Persists to IndexedDB; requires manual PDF/JSON export | **In-Place Atomic Disk Save (`Ctrl+S`):** Edits save directly back to the physical file path on disk without prompts. |
| **Save As** | Downloads a new file via browser synthetic link | **Native OS Save Dialog:** Pick specific drive, folder, and filename. |
| **Import PDF** | `<input type="file">` reads bytes into memory | Native OS file picker or **Drag-and-Drop** directly from File Explorer/Finder into the editor window. |
| **Insert Image** | File input or URL input | Native OS file dialog with thumbnail previews for PNG, JPG, WebP, SVG. |
| **File Association** | Not supported | **Double-click launch:** Double-clicking any `.pdfirst` file in Windows Explorer opens PDFirst directly with that file loaded. |
| **Recent Files** | Browser history only | Native OS Recent Documents jump-list in Windows Taskbar and macOS Dock. |

---

## 5. PDF Export Strategy in Packaged Apps

The vector PDF compiler (`jspdf` + `jspdf-autotable`) remains **100% client-side, local, and deterministic** across all platforms. The compilation pipeline never calls external servers. Packaging alters only how the resulting binary `Blob` is delivered to the user:

```
                  [ DocumentModel AST ]
                            │
                            ▼
              [ Vector PDF Compiler (jspdf) ]
                            │
                            ▼
                    [ Binary PDF Blob ]
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   [ Web / PWA ]       [ Desktop ]         [ Mobile ]
Synthetic Download  Native OS Save Dialog  Native Share Sheet
or File System API  Direct write to disk  AirDrop, Files app,
(showSaveFilePicker) + "Show in Folder"   AirPrint, Mail, etc.
```

1. **Web & PWA:**
   - Uses Chromium `window.showSaveFilePicker()` where supported.
   - Falls back to `URL.createObjectURL(blob)` with a synthetic `<a download>` click.
2. **Packaged Desktop (Tauri / Electron):**
   - Displays native OS "Save As" file dialog pre-filled with document title.
   - Writes `Uint8Array` bytes directly to the chosen disk path using native file APIs.
   - Shows a desktop toast notification with a *"Reveal in Folder"* button opening Windows File Explorer or macOS Finder.
   - **Direct Native Printing:** Spools PDF bytes directly to the OS print system, bypassing browser rasterization.
3. **Packaged Mobile (Capacitor):**
   - Writes PDF to temporary app cache and opens native Share Sheet (`@capacitor/share`), enabling instant AirDrop, saving to Apple Files, or sending via messaging apps.

---

## 6. Keyboard Shortcut Behavior on Desktop

Desktop packaging must respect OS conventions:
- **Windows / Linux:** Primary modifier is `Ctrl`.
- **macOS:** Primary modifier is `Cmd` (`⌘`).

### 6.1 Intercepted Application Shortcuts

| Shortcut (Win/Linux) | Shortcut (macOS) | Browser Default | PDFirst Packaged Action |
| :--- | :--- | :--- | :--- |
| **`Ctrl + S`** | **`Cmd + S`** | Save HTML page | **Save / In-Place Disk Flush:** Immediately saves to disk file and IndexedDB. |
| **`Ctrl + Shift + S`** | **`Cmd + Shift + S`** | None | **Save As Dialog:** Prompts native file picker to save a new copy. |
| **`Ctrl + O`** | **`Cmd + O`** | Open HTML file | **Open Document Dialog:** Native file picker for `.pdfirst` or `.pdf`. |
| **`Ctrl + N`** | **`Cmd + N`** | New browser window | **New Document:** Creates blank document in the editor. |
| **`Ctrl + P`** | **`Cmd + P`** | Browser print dialog | **Export PDF Modal:** Opens PDFirst vector compilation dialog. |
| **`Ctrl + Enter`** | **`Cmd + Enter`** | Submit form | **Page Break:** Inserts new page break block node. |
| **`Ctrl + Z`** | **`Cmd + Z`** | Browser undo | **Tiptap Undo:** Reverses previous text/formatting edit. |
| **`Ctrl + Y` / `Ctrl + Shift + Z`** | **`Cmd + Shift + Z`** | Browser redo | **Tiptap Redo:** Reapplies previously reversed edit. |
| **`Ctrl + B`** | **`Cmd + B`** | Browser bookmarks | **Format Bold:** Toggles bold on selected text. |
| **`Ctrl + I`** | **`Cmd + I`** | DevTools / Page info | **Format Italic:** Toggles italic on selected text. |
| **`Ctrl + U`** | **`Cmd + U`** | View page source | **Format Underline:** Toggles underline on selected text. |
| **`Ctrl + K`** | **`Cmd + K`** | Browser search bar | **Insert Link:** Opens link creation modal. |
| **`Ctrl + F`** | **`Cmd + F`** | Browser find-in-page | **Document Search:** Focuses editor canvas search/replace bar. |

### 6.2 Native OS Application Menu Integration
In desktop builds, these shortcuts are registered directly in the native application menu bar (`File`, `Edit`, `Insert`, `Format`, `Export`, `View`, `Help`), ensuring they trigger reliably even when focus is inside modals or popovers.

---

## 7. Mobile Input Behavior & Layout Adaptation

Mobile devices require specialized accommodations for software keyboards, small touchscreens, and varying display aspect ratios:

### 7.1 Virtual Keyboard Management
1. **Dynamic Viewport Height:**
   - Configured in `index.html`:
     ```html
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
     ```
   - `interactive-widget=resizes-content` ensures that when the virtual keyboard slides up on Android or iOS, the CSS viewport height shrinks dynamically, keeping the toolbar docked above the keys.
2. **Caret Visibility & Auto-Scroll:**
   - The editor tracks cursor position during typing; if the caret approaches the bottom edge, it scrolls the active line into view with a minimum $32\text{px}$ clearance above the keyboard accessory bar.

### 7.2 Mobile Toolbar & Touch Ergonomics
1. **Horizontal Touch Panning:**
   - On screens $\le 768\text{px}$, the top formatting toolbar transforms into a compact, horizontally scrollable accessory bar (`touch-action: pan-x; -webkit-overflow-scrolling: touch; scrollbar-width: none;`).
2. **Touch Target Sizing:**
   - All buttons and controls maintain a minimum bounding box of **$36\text{px} \times 36\text{px}$** (expanding to **$44\text{px} \times 44\text{px}$** for high-frequency actions) to satisfy WCAG 2.1 AA mobile touch standards.
3. **Bottom Sheet Popovers:**
   - Floating popovers (text color palette, highlight palette, table options) automatically reposition as bottom-docked sheets on screens $\le 640\text{px}$, preventing them from clipping off the edges of the viewport.
4. **Horizontal Scroll Prevention:**
   - The document canvas container enforces `overflow-x: hidden` to eliminate horizontal page wobble during touch gestures while maintaining smooth vertical page scrolling.

---

## 8. Offline Storage Behavior & Invariants

PDFirst operates on an **offline-first invariant**: every core capability (authoring, formatting, image editing, table manipulation, autosave, and vector PDF compilation) must function without an internet connection.

| Platform | Static Asset Caching | Document & AST Storage | Data Eviction Risk |
| :--- | :--- | :--- | :--- |
| **Web Browser** | Service Worker (`CacheStorage`) | IndexedDB (`PDFirstDB`) | Moderate: Can be evicted by browser heuristics under extreme disk pressure. |
| **PWA (Installed)** | Service Worker (`CacheStorage`) | IndexedDB (`PDFirstDB`) | **Protected:** Prompts `navigator.storage.persist()`; modern browsers grant durable retention. |
| **Packaged Desktop (Tauri / Electron)** | Local assets bundled inside binary | Native File System (`.pdfirst` files) + IndexedDB cache | **Permanent:** Native filesystem files are never evicted by browser heuristics. |
| **Packaged Mobile (Capacitor)** | Embedded local web bundle | Sandboxed App Documents directory (`@capacitor/filesystem`) | **Permanent:** App Documents directory is backed up to iCloud / Google Drive. |

### Browser Quota Protection Strategy:
On application start, the PWA manager calls `navigator.storage.persist()`:
```typescript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
}
```
This flags the IndexedDB database as durable, preventing automatic cache purges in Chromium and Safari.

---

## 9. Known Limitations and Architectural Risks

| Risk / Limitation | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **iOS Safari 7-Day Storage Eviction** | If a user opens PDFirst in iOS Safari as a website (without installing to Home Screen), Safari may purge IndexedDB after 7 days of inactivity. | Display an in-app banner encouraging users to *"Install to Home Screen"* on iOS. PWA installation creates a dedicated container with durable storage. |
| **Memory Pressure on Giant PDFs (Mobile)** | Ingesting a 100+ page PDF on older phones ($<4\text{GB}$ RAM) can spike WebView memory during canvas/text rendering. | Ingest large PDFs in sequential 5-page batches, disposing page objects and garbage collecting between chunks. |
| **Cross-WebView Font Rendering Variances** | Typography metrics (line heights, character spacing) can differ slightly between Blink (Windows WebView2) and WebKit (macOS / iOS). | Bundle self-hosted web fonts (Inter, Merriweather, JetBrains Mono) directly within `dist/` rather than relying on system font fallbacks. |
| **Image CORS on External URLs** | Client-side cropping (`react-image-crop`) requires HTML5 canvas pixel access, which is blocked by browser CORS if loading images from third-party URLs. | Encourage local image file upload (`#toolbar-upload-image`), which reads images as Base64 data URLs with zero CORS restrictions. |
| **Rust Build Tool Prerequisites (Tauri)** | Tauri requires `cargo`, `rustup`, and MSVC C++ tools on the developer's machine to produce Windows installers. | If installing Rust is inconvenient for your personal environment, use Electron as a direct Node.js-only alternative. |

---

## 10. Platform Abstraction Architecture (`PlatformAdapter`)

To prevent packaging code from littering React components with platform-specific checks (`if (isElectron) ... else if (isTauri) ...`), a clean `PlatformAdapter` interface is designed to unify all platform capabilities:

```typescript
// Proposed architecture for src/platform/types.ts

export type PlatformType = 'web' | 'pwa' | 'desktop' | 'mobile';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface PlatformFileHandle {
  id: string;
  name: string;
  path?: string;          // Desktop absolute path
  nativeHandle?: any;     // Chromium FileSystemFileHandle
}

export interface PlatformAdapter {
  readonly platformType: PlatformType;
  readonly capabilities: {
    readonly directFileSystem: boolean;
    readonly nativeDialogs: boolean;
    readonly nativeShare: boolean;
    readonly fileAssociations: boolean;
    readonly nativeMenus: boolean;
  };

  fileSystem: {
    openDocument(filters?: FileFilter[]): Promise<{ name: string; content: string; handle?: PlatformFileHandle } | null>;
    saveDocument(content: string, defaultName: string, existingHandle?: PlatformFileHandle): Promise<PlatformFileHandle>;
    saveDocumentAs(content: string, defaultName: string): Promise<PlatformFileHandle | null>;
    importPdfFile(): Promise<{ name: string; buffer: ArrayBuffer } | null>;
    openImageFile(): Promise<{ name: string; dataUrl: string } | null>;
  };

  pdf: {
    exportPdf(pdfBlob: Blob, filename: string): Promise<void>;
  };

  app: {
    getAppVersion(): string;
    showNotification(title: string, body: string): void;
    revealInFileManager?(path: string): Promise<void>;
  };
}
```

---

## 11. Staged Execution Plan

```
[ Step 1: PWA Mobile & Web Baseline ] ──> COMPLETE & VERIFIED
  └── Service Worker caching, IndexedDB persistence, mobile viewport resizing, touch targets.
                 │
                 ▼
[ Step 2: Desktop Packaging Setup (When Approved) ]
  ├── Select Tauri v2 (Recommended) or Electron (Fast-Track JS).
  ├── Implement DesktopPlatformAdapter (native dialogs, in-place disk save, file associations).
  ├── Register OS menu bar and keyboard accelerators.
  └── Generate Windows installer (.msi / .exe) and portable package.
                 │
                 ▼
[ Step 3: Native Mobile Shell (Optional Future Enhancement) ]
  ├── Wrap Vite bundle with Capacitor (@capacitor/cli).
  ├── Integrate @capacitor/share for native iOS/Android Share Sheet PDF export.
  └── Add native haptics and status bar styling.
```

---

*This document serves as the complete, authoritative platform specification for PDFirst. No packaging dependencies have been installed or implemented yet, preserving the pristine state of the verified web application.*
