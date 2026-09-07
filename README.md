# PDFirst — Reflowable Document Editor

PDFirst is a fast, cross-platform (mobile/desktop) document editor featuring an intuitive UI. It simplifies document creation by enforcing a PDF-only export while maintaining internal editability. Its standout feature is a built-in PDF reader that extracts and makes imported PDFs fully editable.

---

## Key Features

- **Reflowable Rich Text Editing:** Headings (H1, H2, H3), bold, italic, underline, strikethrough, blockquotes, bulleted and numbered lists, and text alignment.
- **Tables & Images:** Insert and edit grid tables with headers; embed local images and web URLs.
- **Local Autosave & Offline Persistence:** Debounced autosaving (1500ms) with IndexedDB storage (`PDFirstDB`) and emergency `localStorage` fallback.
- **Precision Vector PDF Export:** Deterministic client-side compilation via jsPDF with page size presets (A4, Letter), margins (Normal, Compact, Wide), and footer page numbers.
- **Honest PDF Ingestion:**
  - Extracts text layers from digital PDFs into reflowable editable document blocks.
  - Automatically classifies scanned/image-based PDFs and presents an honest warning explaining that OCR will be supported in a future release.
- **Progressive Web App (PWA):** Installable on desktop and mobile with offline caching via Service Worker (`pdfirst-cache-v1`).
- **Health Check Route:** Built-in health check route at `/health` and `#/health`.

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Tiptap 2 / ProseMirror
- **Styling:** Vanilla CSS with HSL design tokens (Light & Dark modes)
- **PDF Engine:** jsPDF, jsPDF-AutoTable, pdfjs-dist
- **Storage:** IndexedDB (`idb`), Service Worker (`CacheStorage`)
- **Bundler & Test Runner:** Vite 5, Vitest

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```
Executes the full suite of 17 test files and 66 unit/integration tests.

### 4. Build for Production
```bash
npm run build
```
Generates production-ready static assets in `dist/`.

---

## Project Documentation

- [`product.md`](./product.md) — Product vision, user personas, MVP scope boundaries, and roadmap.
- [`engineering.md`](./engineering.md) — Architecture, data models, persistence pipeline, security, and PWA setup.
- [`ui.md`](./ui.md) — Design system tokens, color palettes, component hierarchy, and responsive breakpoints.
- [`PLATFORM_PLAN.md`](./PLATFORM_PLAN.md) — Cross-platform packaging strategy (PWA, Tauri v2, Capacitor).
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Deployment instructions for Vercel, Netlify, and static hosts.
- [`VERIFICATION.md`](./VERIFICATION.md) — Quality assurance commands, test specifications, and verification steps.
- [`E2E_CHECKLIST.md`](./E2E_CHECKLIST.md) — End-to-end QA verification checklist across all 7 core user flows.

---

## License

MIT

<!-- auto-sync: active -->
