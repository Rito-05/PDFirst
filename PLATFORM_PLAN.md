# PDFirst — Cross-Platform Packaging & Integration Plan

**Document Version:** 2.0.0  
**Status:** Complete Architecture Proposal (Awaiting Approval Before Implementation)  
**Author:** Antigravity Architecture & Verification Team  
**Scope:** Packaging PDFirst for Desktop (Tauri v2 / Electron) and Mobile (Capacitor / PWA) without rewriting the core application.

---

## 1. Inspection of Current Architecture

The PDFirst application was engineered with a strict decoupling between presentation, document state, and platform persistence:

1. **Frontend Framework & Runtime:**
   - **React 18.3.1:** Functional component architecture with strict hooks and error boundaries.
   - **TypeScript 5.5.4:** Fully typed domain models, schemas, and API contracts.
2. **Bundler & Build Pipeline:**
   - **Vite 5.4.2:** ESM-first development server and Rollup-based production bundler.
   - **Build Output:** Compiles to static web assets (`dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`) with zero server-side rendering (SSR) dependencies.
3. **Rich-Text Editor Core:**
   - **Tiptap 2.6.6 & ProseMirror (`@tiptap/pm`):** Manages interactive text editing, formatting marks, custom block nodes (tables, images, page breaks).
   - **Document Model (`DocumentModel`):** Serializable JSON Abstract Syntax Tree (AST) representing pages, blocks, and inline spans. This JSON model is the single source of truth.
   - *Architecture Note:* Tiptap requires standard browser DOM APIs (`document`, `window`, `contenteditable`, `Selection`, `MutationObserver`).
4. **Client-Side PDF Engine:**
   - **Vector Compilation:** `jspdf 2.5.1` + `jspdf-autotable 3.8.2` compile vector PDF binaries entirely in-browser.
   - **Text Extraction:** `pdfjs-dist 3.11.174` with dedicated worker extracts text and coordinates client-side.
5. **Styling System:**
   - **Vanilla CSS Tokens:** CSS custom properties (`src/styles/tokens.css`, `src/styles/components.css`) defining light/dark modes, elevations, typography, and responsive breakpoints. Zero TailwindCSS runtime.
6. **Existing PWA Setup:**
   - **Web App Manifest (`public/manifest.json`):** Name: *"PDF-First Editor"*, Short Name: *"PDF Editor"*, Display: `"standalone"`, Theme Color: `"#2563eb"`, Background Color: `"#f8fafc"`. Standard square and maskable icons (`192x192`, `512x512`, SVG).
   - **Service Worker (`public/sw.js`):** Custom two-tier caching (`pdfirst-cache-v1`): pre-cached app shell, network-first navigation fallback to `/index.html`, and cache-first static asset caching.
   - **Install Prompt Coordination (`src/pwa/pwaManager.ts`):** Listens for `beforeinstallprompt`, driving the header bar "Install App" button (`#btn-install-pwa`).
7. **Current Local Persistence:**
   - **IndexedDB via `idb 8.0.0` (`PDFirstDB`):** `documents` store (full `DocumentModel`) and `metadata` store (indexed by `by-updatedAt`).
   - **Debounced Autosave (`AutosaveManager`):** 1500ms keystroke debounce, transition states (`idle`, `dirty`, `saving`, `saved`, `error`).
   - **Emergency Fallback:** Synchronous write to `localStorage` (`pdfirst_backup_${id}`) on `beforeunload` or storage failure.

**Conclusion:** The application is 100% client-side, self-contained, and decoupled from any specific host environment. It is primed for cross-platform packaging with **zero changes to the document model**.

---

## 2. Packaging Approach Recommendations

### 2.1 Desktop Packaging Recommendation

We evaluated three potential desktop packaging strategies:

| Strategy | Technology | Binary Size | Idle RAM | Native OS Integrations | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Desktop PWA Shortcut** | Chrome/Edge PWA | 0 MB (uses host browser) | Host browser (~150MB) | Basic windowing, no native file associations, no arbitrary disk access | **Viable baseline, insufficient for full desktop experience** |
| **B. Electron Wrapper** | Bundled Chromium + Node.js | ~85 MB – 120 MB | ~150 MB – 250 MB | Full OS access, native menus, file associations, custom window chrome | **Low-risk secondary fallback** |
| **C. Tauri v2 (Recommended)** | OS WebView + Rust Core | **< 10 MB** | **~35 MB – 50 MB** | Full OS access, native menus, file associations, dialogs, auto-updater | **PRIMARY RECOMMENDATION** |

#### Why Tauri v2 is the Best Desktop Approach:
1. **Ultra-Lightweight Footprint:** Instead of bundling an entire 100MB Chromium browser, Tauri leverages existing system WebViews (Microsoft WebView2 on Windows 10/11, WebKit on macOS, WebKitGTK on Linux). The installer is under 10MB and memory consumption is a fraction of Electron.
2. **Native File System & Dialogs:** Provides native "Open" and "Save As" file pickers and direct disk read/write access via secure Rust IPC channels, eliminating browser download security prompts.
3. **OS File Associations:** Allows users to double-click `.pdfirst` document files or `.pdf` files in Windows File Explorer or macOS Finder to launch the editor directly.
4. **Native Application Menus:** Full support for standard desktop menu bars (`File`, `Edit`, `Insert`, `View`, `Export`, `Window`, `Help`) with keyboard accelerators.
5. **No Codebase Rewrite:** Tauri loads the existing Vite `dist/` bundle directly into the OS WebView without any modification to React components.

*Fallback Strategy:* If legacy Windows 7/8 support or a guaranteed single Chromium version across all platforms is mandated, Electron can serve as a drop-in fallback using the identical frontend build and `PlatformAdapter` API.

---

### 2.2 Mobile Packaging Recommendation

We evaluated three potential mobile packaging strategies:

| Strategy | Technology | DOM & Editor Compatibility | App Store Ready | Native Integrations | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Mobile PWA (WebAPK / iOS Add to Home Screen)** | Browser PWA | 100% Compatible | No (Browser / WebAPK only) | Web Share API, offline Service Worker, no iOS Share Sheet | **Immediate baseline (Active now)** |
| **B. React Native** | Native iOS/Android UI Components | **0% Compatible (INCOMPATIBLE)** | Yes | Full native | **STRICTLY REJECTED — Fatal mismatch** |
| **C. Capacitor by Ionic (Recommended)** | Native Shell + WKWebView / Android WebView | **100% Compatible** | **Yes (App Store & Google Play)** | Native Share Sheet, Filesystem, Keyboard accessory, Haptics | **RECOMMENDED FOR PACKAGED MOBILE** |

#### Why React Native is Strictly Rejected:
React Native **does not have a DOM**. It does not support HTML elements, `contenteditable`, ProseMirror, Tiptap, or CSS stylesheets. Adopting React Native would require discarding 100% of the editor, rendering engine, styling system, and PDF pipelines.

#### Why Capacitor is the Best Mobile Approach:
1. **100% DOM Preservation:** Capacitor wraps the existing Vite web application inside a high-performance native container (`WKWebView` on iOS, `WebView` on Android). All Tiptap nodes, CSS styles, and PDF generators run without alteration.
2. **Native Device Features:** Official, hardened plugins provide:
   - `@capacitor/filesystem`: Sandboxed file saving and external document sharing.
   - `@capacitor/share`: Pops the native iOS/Android Share Sheet for PDF exports (allowing instant AirDrop, AirPrint, Files app saving, or messaging).
   - `@capacitor/keyboard`: Coordinates virtual keyboard display, viewport resizing, and accessory toolbars.
   - `@capacitor/status-bar`: Configures native status bar colors matching the app theme.
3. **Phased Rollout:** The application already functions as an installable PWA for mobile web users. Capacitor can be introduced whenever native App Store / Google Play distribution is desired.

---

## 3. Required Additional Dependencies

> [!IMPORTANT]
> **FUTURE DEPENDENCIES — NOT INSTALLED YET**  
> In accordance with instructions, none of these packages are installed during the current MVP phase. They are cataloged here for implementation in Phases 2 and 3.

### 3.1 Desktop Dependencies (Phase 2 — Tauri v2)

```json
{
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0"
  }
}
```
*System Prerequisites:* Rust toolchain (`rustup`, `cargo`) on developer/CI build machines.

*(Alternative Electron Fallback Dependencies if ever needed: `electron: ^31.0.0`, `electron-builder: ^24.13.0`)*

### 3.2 Mobile Dependencies (Phase 3 — Capacitor)

```json
{
  "devDependencies": {
    "@capacitor/cli": "^6.1.0"
  },
  "dependencies": {
    "@capacitor/core": "^6.1.0",
    "@capacitor/ios": "^6.1.0",
    "@capacitor/android": "^6.1.0",
    "@capacitor/filesystem": "^6.0.0",
    "@capacitor/share": "^6.0.0",
    "@capacitor/keyboard": "^6.0.0",
    "@capacitor/status-bar": "^6.0.0",
    "@capacitor/app": "^6.0.0"
  }
}
```
*System Prerequisites:* Xcode (for iOS builds on macOS) and Android Studio / Android SDK (for Android builds).

---

## 4. Platform Abstraction Layer (`PlatformAdapter`)

To ensure that packaging code never pollutes React components with platform-specific checks (`if (isElectron) ... else if (isCapacitor) ...`), a unified `PlatformAdapter` interface abstracts all host capabilities:

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
  nativeHandle?: any;     // FileSystemFileHandle on Chromium
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

## 5. File System Access Strategy

### 5.1 Current Storage Architecture
Currently, PDFirst uses a browser-sandboxed local storage strategy:
- **Primary Database:** IndexedDB (`PDFirstDB`) managed by `idb`.
  - Store `documents`: Keyed by document UUID (`doc.metadata.id`). Contains the entire `DocumentModel` AST.
  - Store `metadata`: Keyed by UUID, indexed by `by-updatedAt`. Contains title, timestamps, word/page telemetry for rapid dashboard loading without parsing full document trees.
- **Autosave Pipeline:** `AutosaveManager` debounces edits by 1500ms, persists to IndexedDB, and updates UI status badges.
- **Safety Recovery:** An emergency synchronous fallback writes to `localStorage` (`pdfirst_backup_${id}`) if IndexedDB fails or if `beforeunload` fires during an active save.

### 5.2 How Desktop & Mobile Packaging Improves File Access

| Operation | Current Web / PWA | Packaged Desktop (Tauri) | Packaged Mobile (Capacitor) |
| :--- | :--- | :--- | :--- |
| **Open Document** | File picker uploads into IndexedDB | Native OS Open Dialog (`.pdfirst`) or double-click from Explorer/Finder | Native File Picker (`@capacitor/filesystem`) |
| **Save Existing** | Persists to IndexedDB; manual download prompt | **In-Place Atomic Disk Write:** Saves back to original file path without prompts | Writes to App Documents sandbox |
| **Save As** | Triggers browser file download (`<a>` download) | **Native Save As Dialog:** User selects destination folder and filename | Native Share Sheet $\to$ "Save to Files" |
| **Import PDF** | File input reads `ArrayBuffer` into memory | Native dialog or Drag-and-Drop file from desktop | Native document picker or "Share to PDFirst" |
| **File Association** | Not supported | Double-clicking `.pdfirst` opens document directly | Opening `.pdfirst` launches PDFirst app |

#### Desktop In-Place Autosave Workflow:
When a user opens or saves a document to a physical desktop path (e.g. `C:\Users\name\Documents\Report.pdfirst`):
1. The document is registered with a `PlatformFileHandle` storing `path`.
2. Every 1500ms, changes persist to IndexedDB (for instant app rehydration).
3. Every 3000ms (or on `Ctrl+S`), changes flush directly to the disk file via Tauri's atomic filesystem plugin (`fs.writeTextFile`).
4. The user's external file is always in sync, behaving like Microsoft Word or Apple Pages.

---

## 6. PDF Export Strategy in Packaged Apps

The vector PDF compiler (`jspdf` + `jspdf-autotable`) remains **100% client-side and deterministic** across all platforms. The only difference is how the generated binary `Blob` is delivered to the user:

```
                  [ DocumentModel AST ]
                            │
                            ▼
               [ Vector PDF Compiler (jspdf) ]
                            │
                            ▼
                    [ Binary PDF Blob ]
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
  [ Web / PWA ]        [ Desktop ]          [ Mobile ]
Synthetic Anchor     Native OS Save Dialog  Native Share Sheet
Download or File     Direct write to disk   AirDrop, Files app,
System Access API    + "Reveal in Explorer" Print, Mail, etc.
```

1. **Web & PWA:**
   - On Chromium browsers, uses `window.showSaveFilePicker({ suggestedName: 'Doc.pdf', types: [...] })`.
   - On other browsers, creates temporary `URL.createObjectURL(blob)` and triggers synthetic anchor click.
2. **Packaged Desktop (Tauri):**
   - Shows native OS "Save File" dialog pre-populated with document title.
   - Converts Blob to `Uint8Array` and writes directly to chosen path using `tauri-plugin-fs`.
   - Displays application toast: *"PDF exported to Documents/Report.pdf"* with a *"Show in Folder"* action calling `revealInFileManager`.
   - Desktop Print: Passes PDF binary directly to native OS print spooler, completely bypassing low-fidelity `window.print()` rasterization.
3. **Packaged Mobile (Capacitor):**
   - Writes PDF Blob to temporary application cache directory via `@capacitor/filesystem`.
   - Invokes native Share Sheet via `@capacitor/share`:
     ```typescript
     await Share.share({
       title: doc.metadata.title,
       url: fileUri,
       dialogTitle: 'Export PDF'
     });
     ```
   - User can immediately AirDrop to a Mac, save to Apple Files / Google Drive, send via email, or route to an AirPrint wireless printer.

---

## 7. Keyboard Shortcut Behavior on Desktop

Desktop users expect comprehensive keyboard navigation matching standard desktop productivity applications.

### 7.1 Platform Modifier Mapping
- **macOS:** Primary modifier is `Cmd` (`MetaKey`).
- **Windows / Linux:** Primary modifier is `Ctrl` (`CtrlKey`).

### 7.2 Intercepted Application Shortcuts

| Shortcut (Win/Linux) | Shortcut (macOS) | Browser Default Action | PDFirst Intercepted Action |
| :--- | :--- | :--- | :--- |
| **`Ctrl + S`** | **`Cmd + S`** | Save HTML webpage to disk | **Save / In-Place Disk Flush:** Immediately saves draft to disk and IndexedDB. |
| **`Ctrl + Shift + S`** | **`Cmd + Shift + S`** | None | **Save As Dialog:** Prompts native file picker to save a copy. |
| **`Ctrl + O`** | **`Cmd + O`** | Open local HTML file in browser | **Open Document Dialog:** Prompts native file picker to open `.pdfirst` or `.pdf`. |
| **`Ctrl + N`** | **`Cmd + N`** | Open new browser window | **New Document:** Creates and opens a new blank document draft. |
| **`Ctrl + P`** | **`Cmd + P`** | Browser print preview | **Export PDF Modal:** Opens PDFirst vector PDF compilation dialog. |
| **`Ctrl + Z`** | **`Cmd + Z`** | Native browser undo | **Tiptap Undo:** Reverses previous text/formatting edit. |
| **`Ctrl + Y` / `Ctrl + Shift + Z`** | **`Cmd + Shift + Z`** | Native browser redo | **Tiptap Redo:** Reapplies previously reversed edit. |
| **`Ctrl + F`** | **`Cmd + F`** | Browser find-in-page | **Canvas Search:** Opens PDFirst document text search and highlight bar. |
| **`Ctrl + B`** | **`Cmd + B`** | Browser bookmarks menu | **Format Bold:** Toggles bold formatting on selected text. |
| **`Ctrl + I`** | **`Cmd + I`** | Open page info / DevTools | **Format Italic:** Toggles italic formatting on selected text. |
| **`Ctrl + U`** | **`Cmd + U`** | View page source code | **Format Underline:** Toggles underline formatting on selected text. |

### 7.3 Native OS Menu Integration
In Tauri, these shortcuts are registered directly in the native OS menu bar (`tauri::menu::Menu`), ensuring they trigger reliably even when the editor focus is inside a modal or canvas iframe.

---

## 8. Mobile Input & Viewport Behavior

Mobile document editing requires specialized ergonomics to handle on-screen virtual keyboards, smaller viewports, and touch interactions.

### 8.1 Virtual Keyboard Management
1. **Viewport Meta Configuration:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">
   ```
   The `interactive-widget=resizes-content` directive ensures that when the software keyboard opens on Android and modern iOS, the CSS viewport height shrinks dynamically rather than scrolling unpredictably.
2. **Keyboard Accessory Toolbar:**
   - On mobile viewports (`< 768px`), the desktop top toolbar transforms into a compact, horizontally scrolling accessory pill bar docked directly above the virtual keyboard.
   - Styled using CSS safe-area insets:
     ```css
     .mobile-toolbar-dock {
       position: sticky;
       bottom: env(keyboard-inset-height, 0px);
       padding-bottom: env(safe-area-inset-bottom, 8px);
       background: var(--color-bg-surface);
       border-top: 1px solid var(--color-border-subtle);
       z-index: 100;
     }
     ```
3. **Caret Visibility & Auto-Scroll:**
   - Whenever the user types near the bottom of the page, the editor monitors cursor position and scrolls the active line into view with a minimum vertical clearance of $32\text{px}$ above the virtual keyboard dock.

### 8.2 Touch Target Standards (WCAG 2.1 AA)
- All interactive touch targets (toolbar buttons, dropdown selectors, modal dismiss buttons) have a minimum bounding box of **$44 \times 44\text{ px}$**.
- Table column resize handles expand from a $4\text{px}$ visual divider to a $24\text{px}$ invisible hit-box for comfortable touch manipulation.
- Document canvas enables pinch-to-zoom (`touch-action: pan-y pinch-zoom`) while zoom is disabled on headers and modal overlays to prevent accidental interface scaling.

---

## 9. Offline Storage Behavior

PDFirst operates on an **offline-first invariant**: the application must be 100% functional without an active network connection.

| Platform | Static Assets & Engine Caching | Document & AST Storage | Storage Eviction Resistance |
| :--- | :--- | :--- | :--- |
| **Web Browser** | Service Worker (`CacheStorage`) | IndexedDB (`PDFirstDB`) | Subject to browser quota eviction under extreme disk pressure. |
| **PWA (Installed)** | Service Worker (`CacheStorage`) | IndexedDB (`PDFirstDB`) | **Protected:** Prompts `navigator.storage.persist()`; browser grants persistent retention. |
| **Packaged Desktop (Tauri)** | Local bundle embedded in executable | Native Filesystem + SQLite / IndexedDB | **Permanent:** OS filesystem files are never cleared by browser heuristics. |
| **Packaged Mobile (Capacitor)** | Embedded local web bundle | Sandboxed App Storage (`@capacitor/filesystem`) | **Permanent:** App Documents directory is backed up to iCloud / Google Drive. |

### Storage Eviction Mitigation for Web & PWA:
1. **Persistent Storage Request:** On application bootstrap, `pwaManager` requests persistent storage:
   ```typescript
   if (navigator.storage && navigator.storage.persist) {
     const isPersisted = await navigator.storage.persist();
     console.log(`Persistent storage granted: ${isPersisted}`);
   }
   ```
2. **Quota Monitoring:** Regularly checks `navigator.storage.estimate()` to notify users before device storage limits are reached.

---

## 10. Known Limitations and Architectural Risks

| Risk / Limitation | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **iOS Safari 7-Day Storage Eviction** | If a user visits via browser without adding to Home Screen, Safari can purge IndexedDB after 7 days of inactivity. | PWA banner actively prompts user to "Install / Add to Home Screen". Future Capacitor native shell permanently eliminates this risk. |
| **Mobile Memory Pressure on Large PDFs** | Ingesting a 100+ page PDF on older mobile devices can exhaust mobile WebView RAM during text extraction. | Mobile PDF parser processes pages in sequential chunks of 5 pages, disposing canvas contexts between batches. |
| **Cross-WebView Font Rendering** | Text metrics can subtly shift between Blink (Windows WebView2) and WebKit (macOS / iOS). | Bundle standardized open-source web fonts (Inter, Merriweather, JetBrains Mono) directly within the application package. |
| **File System Access API Fragmentation** | Firefox and Safari do not support `showOpenFilePicker()` / `showSaveFilePicker()`. | Standard `<input type="file">` and Object URL anchor fallback are fully maintained in `PlatformAdapter`. |
| **Tauri Rust Toolchain Prerequisite** | Desktop builds require Rust and platform build tools on CI machines. | Documented build pipeline scripts; fallback to Electron if a team lacks Rust CI capability. |

---

## 11. Implementation Roadmap & Milestones

```
[ Phase 1: Progressive Web App (PWA) ] ──> COMPLETE & VERIFIED
                 │
                 ▼
[ Phase 2: Desktop Packaging (Tauri v2) ] ──> PLANNED (Awaiting Approval)
  ├── Setup @tauri-apps/cli & Rust scaffold
  ├── Implement DesktopPlatformAdapter
  ├── Register .pdfirst & .pdf file associations
  ├── Bind native menus & keyboard accelerators
  └── Produce signed Windows (.msi/.exe) & macOS (.dmg) installers
                 │
                 ▼
[ Phase 3: Mobile Packaging (Capacitor) ] ──> PLANNED (Awaiting Approval)
  ├── Setup @capacitor/cli & native iOS/Android shells
  ├── Implement MobilePlatformAdapter
  ├── Integrate @capacitor/share for native PDF export
  └── Adapt mobile virtual keyboard & accessory dock
```

---

*This plan establishes a clear, practical roadmap for desktop and mobile packaging that honors the zero-rewrite requirement, guarantees document model integrity, and delivers a native-grade user experience across all platforms.*
