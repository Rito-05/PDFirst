# PDFirst — Dependency & Setup Proposal

**Document Version:** 1.0.0  
**Target:** Post-MVP Implementation (Phases A, B, C)  
**Status:** Pending User Approval (No Packages Installed Yet)  
**References:** [`IMPLEMENTATION_PLAN_FINAL.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/IMPLEMENTATION_PLAN_FINAL.md), [`FEATURE_SPEC_FINAL.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/FEATURE_SPEC_FINAL.md)

---

## 1. Audit of Currently Installed Relevant Packages

Before proposing any new packages, we audited `package.json`. The following official Tiptap extensions are **already installed** in the workspace:

| Existing Package | Current Version | Capabilities Enabled |
| :--- | :--- | :--- |
| `@tiptap/extension-color` | `^2.6.6` | Inline text color mark support |
| `@tiptap/extension-text-style` | `^2.6.6` | Inline span style attributes (`color`, `font-family`) |
| `@tiptap/extension-highlight` | `^2.6.6` | Text background highlight marks |
| `@tiptap/extension-image` | `^2.6.6` | Image block node support |
| `@tiptap/extension-table` | `^2.6.6` | Table grid, row/col resizing |
| `@tiptap/extension-table-row` | `^2.6.6` | Table row container |
| `@tiptap/extension-table-cell` | `^2.6.6` | Table cell with attribute support |
| `@tiptap/extension-table-header` | `^2.6.6` | Table header cell support |
| `jspdf` & `jspdf-autotable` | `^2.5.1` / `^3.8.2` | Vector PDF compilation engine |
| `idb` | `^8.0.0` | IndexedDB client-side persistence |
| `lucide-react` | `^0.439.0` | UI icon set |

Because these packages are already present, we **do not need to install any new Tiptap packages** for core typography or table structure.

---

## 2. Proposed New NPM Packages

To implement the remaining capabilities specified in [`FEATURE_SPEC_FINAL.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/FEATURE_SPEC_FINAL.md) (client-side image cropping, robust clipboard HTML sanitization, and seamless color selection) in a safe, lightweight, and production-tested manner, we propose adding only **2 core runtime dependencies** (plus 1 optional UI enhancer):

### 2.1 Package: `react-image-crop`
* **Type:** Production Runtime Dependency (`dependencies`)
* **Bundle Size:** $\approx 5.1\text{ KB}$ gzipped (Zero runtime dependencies)
* **Purpose:** High-performance, touch-friendly rectangular crop bounding box UI for client-side image cropping.
* **Why It Is Needed:**
  - Enables **Feature IMG-04 (Client-Side Rectangular Crop UI)**.
  - Users need to interactively drag a crop rectangle with 8 handles, lock aspect ratios, and crop photos before inserting them into the document.
  - Mobile touch digitizers (Android and iOS) often encounter coordinate jitter, window scroll hijacking, and device pixel ratio (DPR) scaling bugs when implementing manual touch listeners on raw `<canvas>` elements. `react-image-crop` provides battle-tested, responsive touch and mouse dragging logic with clean pixel and percentage coordinate outputs.
* **Alternatives Considered:**
  - *`cropperjs` ($\approx 32\text{ KB}$ gzipped):* Heavy, legacy jQuery/imperative architecture, difficult to coordinate cleanly with React 18 functional component lifecycle.
  - *Custom Zero-Dep HTML5 Canvas Drag Code ($0\text{ KB}$):* Feasible, but requires $\approx 350$ lines of custom touch/pointer event math, risking mobile touch handling bugs on mid-range Android devices.
  - *Decision:* `react-image-crop` is the gold standard for modern React image cropping.

---

### 2.2 Package: `dompurify` and `@types/dompurify`
* **Type:** Production Runtime Dependency (`dompurify`) + Dev Dependency (`@types/dompurify`)
* **Bundle Size:** $\approx 6.5\text{ KB}$ gzipped (Zero runtime dependencies)
* **Purpose:** Client-side HTML sanitization for external clipboard paste.
* **Why It Is Needed:**
  - Enables **Feature CP-01 (Formatted Rich Text Copy-Paste & HTML Sanitization)**.
  - When users copy rich text from Wikipedia, Google Docs, Microsoft Word, or web pages, the clipboard contains dirty HTML with potential security vulnerabilities (inline `<script>` tags, malicious `<iframe loading=...>`, event handlers like `onload` or `onerror`, or malformed tags).
  - `dompurify` strips all unsafe elements while strictly preserving valid document formatting tags (`<h1>`-`<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<u>`, `<a>`, `<table>`).
* **Alternatives Considered:**
  - *Hand-rolled Regex Tag Stripping ($0\text{ KB}$):* Dangerously fragile; prone to XSS bypasses and known to break legitimate nested table structures or formatted lists.
  - *Browser `DOMParser` alone:* Parses HTML into DOM elements, but does not sanitize dangerous attributes or scripts without extensive manual allow-listing.
  - *Decision:* `dompurify` is the security industry standard for browser-side DOM sanitization.

---

### 2.3 Package (Recommended Optional): `react-colorful`
* **Type:** Production Runtime Dependency (`dependencies`)
* **Bundle Size:** $\approx 1.8\text{ KB}$ gzipped (Zero runtime dependencies)
* **Purpose:** Compact, accessible, touch-friendly visual color picker popover.
* **Why It Is Needed:**
  - Enhances **Features RT-01, RT-02, BLK-01, TBL-01, TBL-02**.
  - While native `<input type="color">` works well for desktop, on mobile devices (Android/iOS) it triggers full-screen OS dialogs that can dismiss the virtual keyboard, lose text selection, and disrupt user editing flow.
  - `react-colorful` provides an embedded, self-contained color gradient slider that works smoothly inside popovers and bottom-sheets on both mobile touchscreens and desktop.
* **Alternatives Considered:**
  - *`react-color` ($\approx 140\text{ KB}$ gzipped):* Extremely bloated, unmaintained, and causes React 18 deprecation warnings.
  - *Native `<input type="color">` only ($0\text{ KB}$):* Viable, but opens external OS dialogs.
  - *Decision:* We recommend `react-colorful` because at under $2\text{KB}$, it offers an app-native look and feel without third-party bulk.

---

## 3. Proposed Installation Commands

When approved, the exact commands to run in the workspace terminal are:

```bash
# Core required packages for client-side image cropping and clipboard sanitization:
npm install react-image-crop dompurify react-colorful

# TypeScript type definitions for DOMPurify:
npm install -D @types/dompurify
```

*(Total added bundle weight across all packages: $\approx 13.4\text{ KB}$ gzipped).*

---

## 4. Required Configuration Changes

| Configuration File | Changes Required |
| :--- | :--- |
| **`vite.config.ts`** | **None.** All proposed packages are standard ES modules (`esm`) that Vite packages and bundles out of the box. |
| **`tsconfig.json`** | **None.** TypeScript 5.5+ will automatically resolve types from `@types/dompurify` and the built-in type definitions in `react-image-crop` and `react-colorful`. |
| **`src/styles/global.css`** | Add `@import 'react-image-crop/dist/ReactCrop.css';` to supply the stylesheet for the cropping overlay handles. |
| **Environment Variables (`.env`)** | **None.** No API keys, server URLs, or environment variables are required. |

---

## 5. Architectural & Operational Confirmations

1. **Zero Secrets or API Keys:**
   - 100% of the proposed functionality executes client-side inside the browser or webview. No API keys, tokens, or backend accounts are required.
2. **100% Client-Side & Local-First:**
   - Image cropping is performed on the device via HTML5 Canvas `drawImage()`.
   - HTML sanitization runs inside the browser DOM via `DOMPurify.sanitize()`.
   - Color selection operates via pure SVG/CSS math.
3. **Build & Dev Guarantee:**
   - The application will continue to build cleanly with `npm run build` (`tsc && vite build`) with zero TypeScript errors.
   - The dev server (`npm run dev`) and test suite (`npm run test`) will run without issues.
4. **Zero Regression on Existing MVP:**
   - Existing documents stored in IndexedDB will remain 100% compatible and continue to load, edit, save, and export without interruption.

---

*This proposal is submitted for your review. No packages will be installed until you give your explicit approval.*
