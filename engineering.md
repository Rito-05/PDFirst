# PDFirst — Engineering Architecture & Specification

**Document Version:** 1.0.0  
**Status:** Source of Truth  
**Target Milestone:** MVP  

---

## 1. Recommended Technology Stack

Based on the empty workspace inspection and modern web application requirements, the recommended technology stack is:

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Runtime & Bundler** | **Vite + React 18 / 19 + TypeScript** | Ultra-fast HMR, strict type safety, modern ecosystem, minimal bundle size. |
| **Styling** | **Vanilla CSS + CSS Modules + CSS Custom Properties** | Zero runtime overhead, clean tokenization, total layout control without framework lock-in. |
| **Document Editor Engine**| **Tiptap Core (ProseMirror)** | Industry-standard headless rich text engine; native JSON AST serialization; reflowable block model; easy to extend with custom nodes (tables, images, page breaks). |
| **PDF Generation Engine**| **`@react-pdf/renderer`** or **`pdfmake`** (Client-side) | Directly compiles document AST to vector PDF primitives. Ensures vector text quality, exact print pagination, and eliminates rasterized canvas blur. |
| **PDF Extraction / Parsing**| **`pdfjs-dist`** (Mozilla PDF.js) | High-performance, client-side PDF inspection and text-layer extraction; zero cloud/server dependencies; privacy-preserving. |
| **Local Persistence** | **IndexedDB (via `idb` wrapper)** | Structured client-side storage capable of holding multi-megabyte documents, embedded images, and versioned drafts without localStorage limits. |
| **State Management** | **Zustand** | Lightweight, decoupled state stores with minimal boilerplate; clean separation of document data, editor state, and UI state. |
| **Testing Suite** | **Vitest + React Testing Library + Playwright** | Fast unit testing for document serialization and state logic; end-to-end browser testing for import/export flows. |

---

## 2. Project Folder Structure

```
PDFirst/
├── public/
│   ├── favicon.ico
│   └── fonts/                     # Embedded fonts for UI and PDF renderer (Inter, Merriweather)
├── src/
│   ├── assets/                    # Icons and static SVG artwork
│   ├── components/                # Shared UI Components
│   │   ├── common/                # Button, Input, Modal, Dropdown, Toast, Spinner
│   │   ├── header/                # HeaderBar, TitleInput, SaveIndicator, ThemeToggle
│   │   ├── toolbar/               # FormattingToolbar, StyleSelect, InsertControls
│   │   ├── sidebar/               # OutlineSidebar, PropertiesSidebar, ThumbnailList
│   │   ├── canvas/                # DocumentCanvas, PageSheet, ZoomWidget
│   │   └── modals/                # ExportPdfModal, ImportReviewModal, QualityAlertModal
│   ├── editor/                    # Document Editor Architecture
│   │   ├── schema/                # Internal AST schema definitions & type validators
│   │   ├── extensions/            # Custom Tiptap nodes: PageBreak, ResizableImage, CustomTable
│   │   ├── hooks/                 # useEditorSync, useFormattingState
│   │   └── EditorCore.tsx         # Primary rich-text editor component
│   ├── pdf/                       # PDF Import & Export Pipelines
│   │   ├── export/                # PDF Generation subsystem
│   │   │   ├── AstToPdfMapper.ts  # Translates Internal AST -> PDF Component Tree
│   │   │   ├── PdfDocument.tsx    # @react-pdf vector document definition
│   │   │   ├── PdfStyles.ts       # Print styling, margins, headers, footers
│   │   │   └── PdfExporter.ts     # Client-side blob compiler and downloader
│   │   └── import/                # PDF Extraction subsystem
│   │       ├── PdfClassifier.ts   # Categorizes PDF: text-based, scanned, or complex
│   │       ├── TextExtractor.ts   # Extracts text streams & bounding boxes via pdfjs
│   │       ├── LayoutReconstructor.ts # Groups lines into paragraphs, headings, lists
│   │       └── QualityAssessor.ts # Generates fidelity warnings & confidence score
│   ├── storage/                   # Local-First Persistence Subsystem
│   │   ├── db.ts                  # IndexedDB schema initialization via idb
│   │   ├── documentRepository.ts  # CRUD operations for documents and metadata
│   │   └── autosaveManager.ts     # Debounced autosave coordinator & dirty state machine
│   ├── store/                     # Global State Management (Zustand)
│   │   ├── useDocumentStore.ts    # Active document data & change tracking
│   │   ├── useUIStore.ts          # Sidebar visibility, active theme, zoom level
│   │   └── useImportExportStore.ts# Import analysis state, export modal state
│   ├── styles/                    # Global CSS & Design System
│   │   ├── variables.css          # Design tokens (colors, spacing, shadows, fonts)
│   │   ├── global.css             # Base reset, typography, utilities
│   │   └── editor.css             # ProseMirror / Tiptap content styling
│   ├── types/                     # Core TypeScript Interfaces
│   │   ├── document.ts            # Internal Document AST & Metadata
│   │   ├── export.ts              # PDF configuration options
│   │   └── import.ts              # PDF inspection & assessment types
│   ├── utils/                     # General Utilities
│   │   ├── sanitizer.ts           # XSS sanitization (DOMPurify wrapper)
│   │   ├── idGenerator.ts         # Nanoid / UUID generator for blocks
│   │   └── debounce.ts            # Timing utilities
│   ├── App.tsx                    # Top-level application shell & error boundaries
│   ├── main.tsx                   # React root mount
│   └── index.html
├── tests/
│   ├── unit/                      # Vitest unit tests
│   │   ├── documentSerialization.test.ts
│   │   ├── formattingCommands.test.ts
│   │   ├── autosaveManager.test.ts
│   │   └── pdfExportValidation.test.ts
│   ├── integration/               # Multi-step integration tests
│   │   ├── createEditSaveReopen.test.ts
│   │   ├── exportToPdf.test.ts
│   │   └── importReviewEditExport.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── EXPLORATION.md
├── product.md
├── ui.md
└── engineering.md
```

---

## 3. Internal Document Schema (Source of Truth)

The document is represented in memory and storage as a strictly typed JSON object adhering to the `DocumentModel` interface:

```typescript
// src/types/document.ts

export type PageSize = 'A4' | 'LETTER';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'compact' | 'wide';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface DocumentMargins {
  top: number;    // points (1/72 inch)
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  margins: DocumentMargins;
  showPageNumbers: boolean;
  headerText?: string;
  footerText?: string;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: number;       // Unix epoch ms
  updatedAt: number;       // Unix epoch ms
  version: number;         // Schema version (e.g. 1)
  wordCount: number;
  characterCount: number;
  pageCount: number;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'listItem'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'image'
  | 'blockquote'
  | 'horizontalRule'
  | 'pageBreak';

export interface TextMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';
  attrs?: {
    href?: string;
  };
}

export interface InlineContent {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  attrs?: Record<string, any>;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  attrs: {
    level: 1 | 2 | 3;
    alignment?: TextAlignment;
  };
  content?: InlineContent[];
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  attrs?: {
    alignment?: TextAlignment;
  };
  content?: InlineContent[];
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  attrs: {
    src: string;        // Base64 data URL or local blob URI
    alt?: string;
    caption?: string;
    widthPercent: number; // 25, 50, 75, 100
    alignment: TextAlignment;
  };
}

export interface TableCellBlock extends BaseBlock {
  type: 'tableCell';
  attrs?: {
    colspan?: number;
    rowspan?: number;
  };
  content: ParagraphBlock[];
}

export interface TableRowBlock extends BaseBlock {
  type: 'tableRow';
  content: TableCellBlock[];
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  attrs: {
    hasHeaderRow: boolean;
    columnWidths?: number[]; // relative percentages
  };
  content: TableRowBlock[];
}

export interface PageBreakBlock extends BaseBlock {
  type: 'pageBreak';
}

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | TableBlock
  | PageBreakBlock
  | BaseBlock;

export interface DocumentModel {
  schemaVersion: 1;
  metadata: DocumentMetadata;
  settings: PageSettings;
  content: {
    type: 'doc';
    content: DocumentBlock[];
  };
}
```

---

## 4. Editor Architecture

1. **Decoupled AST Binding:**
   - The Tiptap instance operates on standard ProseMirror JSON nodes that map 1:1 to the `DocumentModel.content` structure.
   - Any transaction dispatched by typing or formatting fires a subscriber that updates the in-memory document state in `useDocumentStore`.
2. **Custom Node Extensions:**
   - `PageBreakNode`: Renders a non-deletable print divider line with interactive page count indicators.
   - `ResizableImageNode`: Custom node view allowing width toggling (25%, 50%, 75%, 100%), alignment, and caption editing.
   - `CustomTableNode`: Configured with table, table-row, and table-cell nodes enforcing boundaries so tables cannot exceed sheet margins.
3. **Keep-with-Next Pagination Rules:**
   - Headings automatically carry the CSS/print attribute `break-after: avoid` so that titles never sit orphaned at the bottom of a page without at least three lines of subsequent paragraph text.

---

## 5. PDF Export Architecture

The export pipeline is completely deterministic and runs directly in the client browser:

```
[ DocumentModel (JSON AST) ]
             │
             ▼
   [ AstToPdfMapper ]  ──> Normalizes blocks, validates page bounds, calculates margins
             │
             ▼
   [ @react-pdf/renderer Primitives ] (Document, Page, View, Text, Image)
             │
             ▼
      [ PDF Blob ]     ──> Compiled in a Web Worker / Asynchronous Task
             │
             ▼
   [ Browser Download ] (Triggered via Object URL)
```

### 5.1 Export Rules
- **Vector Typography:** All text is compiled as true vector glyphs with embedded font subsets (Inter Regular, Bold, Italic), ensuring crystal-clear readability and small file sizes.
- **Dynamic Headers & Footers:** The PDF renderer computes physical page indices using `@react-pdf`'s `render={({ pageNumber, totalPages }) => ...}` to output standard pagination (e.g., "Page 1 of 4").
- **Table Translation:** Nested `table` AST nodes are mapped to flexbox-based grid views with explicit percentage widths, preserving proportional layout across page sizes.

---

## 6. PDF Import Architecture

PDFirst treats external PDF import as a **classification and reconstruction pipeline**:

```
                  [ Ingest External PDF File ]
                                │
                                ▼
                   [ pdfjs-dist Text Extraction ]
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
 [ Extract Text Layers & Fonts ]         [ Count Vector/Image Density ]
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                                ▼
                     [ PdfClassifier ]
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[ Text-Based PDF ]    [ Scanned / Image-Only ]   [ Complex Layout PDF ]
(High Confidence)     (Zero text / Raster scan)  (Multi-column / forms)
       │                        │                        │
       ▼                        ▼                        ▼
[ AST Reconstruction ]   [ Mocked OCR Stub ]      [ Best-effort Linearizer ]
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
                                ▼
                  [ Quality & Warning Evaluator ]
                                │
                                ▼
                   [ Import Review Modal ]
                                │
                        User Confirms?
                       ├── Yes ──> Load into Editor Canvas
                       └── No  ──> Discard & Return to Dashboard
```

### 6.1 PDF Classification Heuristics
- **Scanned / OCR Candidate:** If `totalTextLength < 50 characters` across the document while image element count is $\ge 1$ per page, or character density is $< 0.05$ chars/in², classify as `SCANNED_IMAGE`.
  - *Action:* Display the Scanned Notice: *"This PDF appears to be scanned or image-based. OCR conversion will be added in a later release."* Offers the optional OCR pipeline if enabled.
- **Complex Layout:** If multiple distinct horizontal text clusters share the same vertical Y coordinates (indicating multi-column magazine layouts) or font size changes $> 15$ times per page, classify as `COMPLEX_LAYOUT`.
  - *Action:* Reconstruct into linear single-column sections and trigger the Honesty Warning Modal.
- **Standard Text-Based:** Uniform sequential text blocks with detectable line-heights and standard font sizes.
  - *Action:* Reconstruct paragraphs and headings, present in the review modal with high-confidence green indicator.

---

### 6.2 Optional Optical Character Recognition (OCR) Subsystem Design

```
                  [ Scanned / Image-Only PDF ]
                               │
                               ▼
                [ Step 1: Page Rasterization ]
              (pdfjs-dist Canvas Render at 200 DPI)
                               │
                               ▼
               [ Step 2: Image Preprocessing ]
             (Grayscale conversion & Contrast filter)
                               │
                               ▼
                   [ Step 3: OcrEngine ]
           ┌───────────────────┴───────────────────┐
           ▼                                       ▼
 [ Default: Local Tesseract Worker ]     [ Optional: Future Cloud Provider ]
 (WebAssembly in isolated worker)        (Abstracted behind interface)
           │                                       │
           └───────────────────┬───────────────────┘
                               │
                               ▼
                 [ Step 4: Spatial Line Clustering ]
               (Group OCR words into paragraphs & headings)
                               │
                               ▼
                 [ Step 5: Confidence & Error Map ]
               (Tag words < 65% confidence, compute stats)
                               │
                               ▼
                  [ Step 6: OCR Review Modal ]
             (Side-by-side: Scan preview vs. Extracted text)
                               │
                       User Confirms?
                     ├── Yes ──> Commit to DocumentModel (Original PDF intact)
                     └── No  ──> Discard OCR text & return to library
```

#### A. Engine Architecture: Local vs. Server-Side
- **Default Engine (Local Client-Side):** Implemented via client-side WebAssembly Web Worker (`tesseract.js` / WASM core).
  - *Zero Cost:* Runs on client device CPU/WASM threads with $\$0.00$ server cost.
  - *Strict Privacy:* Zero image bytes, character streams, or document metadata ever exit the browser sandbox.
  - *Offline Capability:* Functions without internet access once worker assets are cached.
- **Pluggable Interface (`OcrEngine`):** Decoupled from specific vendor libraries to support enterprise or cloud plugins in future phases without touching application UI:

```typescript
export interface OcrWordConfidence {
  text: string;
  confidence: number; // 0 to 100
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number; // 0 to 100 average
  words: OcrWordConfidence[];
  durationMs: number;
}

export interface OcrEngineOptions {
  language?: string;        // default: 'eng'
  timeoutMs?: number;       // default: 60000 per page
  onProgress?: (progress: { page: number; totalPages: number; percent: number }) => void;
  signal?: AbortSignal;
}

export interface OcrEngine {
  readonly id: string;
  readonly isLocal: boolean;
  recognizePage(canvas: HTMLCanvasElement, options?: OcrEngineOptions): Promise<OcrPageResult>;
  terminate(): Promise<void>;
}
```

#### B. Scanned PDF Detection Mechanics
Scanned PDFs are detected algorithmically during the pre-flight extraction pass:
1. `pdfDoc.getPage(i).getTextContent()` evaluates extractable character streams.
2. `page.getOperatorList()` tallies `paintImageXObject` and `paintInlineImageXObject` operations.
3. If `characterCount < 50` while image operator count $\ge 1$, the document is marked `SCANNED_IMAGE`.
4. The system **never** replaces or mutates the uploaded file buffer. The original `ArrayBuffer` is held in memory purely for rendering page snapshots.

#### C. Confidence Scoring & Error Presentation
1. **Document-Level Confidence:** Average of word-level confidence ratings across all processed pages:
   - $\ge 85\%$: High Confidence (Green checkmark indicator).
   - $65\% - 84\%$: Moderate Confidence (Amber notice: *"Review recommended — some text may be slightly imprecise"*).
   - $< 65\%$: Low Confidence (Red/Amber alert: *"Low scan resolution or skewed text detected"*).
2. **Word-Level Highlighting:** Words recognized with $< 65\%$ individual confidence are highlighted with subtle amber spans in the Review Modal preview pane.
3. **Graceful Error Handling:**
   - Worker crashes or memory limits trigger a clean fallback notification: *"OCR process ran out of memory. Please try with fewer pages or a higher contrast scan."*
   - Timeout alerts: *"Page X took longer than 60 seconds to process. OCR was halted safely without affecting your application."*
   - Cancellation: User-initiated cancel immediately invokes `worker.terminate()` and clears allocated buffers without memory leaks.

#### D. Operational & Resource Constraints
| Constraint | Specification | Failure Behavior |
| :--- | :--- | :--- |
| **Data Privacy** | 100% Client-Side Local Isolation | Zero network transmission. |
| **Max Batch Size** | 25 pages / 20MB file size | Rejects batch with prompt: *"For local browser OCR, please limit scans to 25 pages per batch."* |
| **Page Timeout** | 60 seconds per page | Terminates hung page worker; provides partial extraction for prior pages. |
| **Overall Timeout**| 5 minutes total run time | Aborts batch execution cleanly. |
| **Concurrency** | Max 1 active OCR worker thread | Avoids saturating client CPU and preserves 60 FPS UI responsiveness. |

#### E. Deterministic Testing Strategy for OCR
Testing the OCR pipeline without flaky live WASM neural networks:
- **`MockOcrEngine`:** Deterministic mock implementing the `OcrEngine` interface that responds with predefined high-confidence and low-confidence fixtures.
- **Fixture Verification:** Tests verify:
  1. Spatial line clustering into headings and paragraphs from OCR word bounding boxes.
  2. Average confidence score calculation and low-confidence word tagging.
  3. Timeout cancellation via `AbortSignal`.
  4. Preservation of original PDF buffer across the OCR execution lifecycle.
  5. Formatting of the exact user-facing warning messages.

---

## 7. Local Persistence & Autosave Strategy

### 7.1 Storage Engine (IndexedDB via `idb`)
Database: `PDFirstDB` (Version: 1)
- **Object Store `documents`:** Key: `id` (string). Stores full `DocumentModel` records.
- **Object Store `metadata`:** Key: `id` (string). Stores lightweight index records (`title`, `updatedAt`, `wordCount`, `pageCount`) for instant dashboard loading without parsing large document payloads.

### 7.2 Autosave State Machine
The autosave manager implements an explicit state machine:

```
[ IDLE ] ──(User Keystroke)──> [ DIRTY ] ──(1500ms Debounce)──> [ SAVING ]
                                                                   │
                                           ┌───────────────────────┴───────────────────────┐
                                           ▼                                               ▼
                                      [ SAVED ]                                         [ ERROR ]
                                   (Display green tick)                            (Retry / Local alert)
```

- **Unload Safety:** A `window.addEventListener('beforeunload', ...)` hook checks if state is `DIRTY` or `SAVING`. If unsaved data exists, it executes synchronous `localStorage` fallback write of the raw JSON draft before tab termination.

---

### 7.3 Optional Cloud Synchronization Engine Architecture

The cloud sync subsystem is an **offline-first outbox pipeline** designed to sit atop the existing local IndexedDB persistence layer without disturbing core document editing:

```
[ User Edit in Editor ]
          │
          ▼
[ Save to IndexedDB ('documents') ]  (Instant local write, 0ms network latency)
          │
          ▼
[ Enqueue to 'sync_outbox' ]          (Payload tagged with monotonic version & etag)
          │
          ▼
┌─────────────────────────────────┐
│     SyncEngine Coordinator      │ <─── [ Network Status Listener (online/offline) ]
└─────────────────────────────────┘
          │
      Is Online?
     ├── No  ──> Status = 'pending_sync' (Sleep until 'online' event)
     └── Yes ──> Process Outbox (FIFO)
                   │
                   ▼
         [ HTTP PUT /v1/documents/:id ] (Headers: If-Match: <etag>)
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   [ 200 OK ]         [ 409 Conflict ]
   (Mark Synced)      (Fork Conflicted Copy into IndexedDB)
                   │
                   ▼
         [ 5xx / Network Error ]
         (Exponential Backoff Retry with Jitter)
```

#### A. Outbox Queue Schema (IndexedDB)
Object Store: `sync_outbox` (Key: `id`)
```typescript
export interface SyncOutboxItem {
  id: string;               // Unique outbox transaction ID
  documentId: string;       // Target document ID
  action: 'UPSERT' | 'DELETE';
  payload?: DocumentModel;  // Document snapshot
  baseEtag?: string;        // Server ETag client is modifying
  clientVersion: number;    // Monotonic client version counter
  queuedAt: number;         // Timestamp
  retryCount: number;       // Number of failed attempts
  lastAttemptAt?: number;
}
```

#### B. Conflict Resolution Algorithm
1. Every document record maintains `version` (number) and `etag` (string).
2. Sync requests send `If-Match: <etag>`.
3. If the server detects another client committed an update since the client's base ETag:
   - Server responds with `409 Conflict` containing the current server document.
   - The client **never overwrites** either copy.
   - The engine generates a **Conflicted Copy** in IndexedDB:
     - New document ID: `doc_<nanoid>`
     - New Title: `${doc.metadata.title} (Conflicted Copy from ${new Date().toLocaleTimeString()})`
   - Both the local user edits and the remote server updates are preserved in the library.
   - The user is notified with an accessible non-blocking toast: *"Concurrent edit detected. A separate copy was created to prevent data loss."*

#### C. Retry Engine with Exponential Backoff & Jitter
When a sync request fails due to a network drop or 5xx server error, the retry scheduler calculates the next delay:
$$\text{Delay}(n) = \min\left(30000\text{ ms},\; 1000 \times 2^n + \text{random}(0, 500)\right)$$
- **Circuit Breaker:** After $n = 5$ consecutive failures, automatic polling pauses. Status transitions to `sync_paused`, offering a manual `Retry Now` button.
- **Session Expiry (401):** Sync halts gracefully. Local changes remain queued in `sync_outbox`.

#### D. Security & Secrets Management
- **Zero Frontend Secrets:** No API secret keys, database credentials, or private tokens exist in frontend code.
- **Environment Variables:** All client configuration is injected via standard `VITE_` public environment variables:
  - `VITE_SYNC_API_BASE_URL`: Base URL for the sync API (e.g., `https://api.pdfirst.com/v1`).
  - `VITE_AUTH_DOMAIN`: OAuth/Auth domain.
  - `VITE_AUTH_CLIENT_ID`: Public client application ID.
- An environment template [`.env.example`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/.env.example) defines all required configuration variables.

#### E. Deterministic Testing Strategy for Cloud Sync
To test sync without live cloud infrastructure, the engine depends on a pluggable `SyncTransport` interface:
```typescript
export interface SyncTransport {
  uploadDocument(item: SyncOutboxItem): Promise<{ etag: string; version: number }>;
  downloadDocument(id: string): Promise<DocumentModel | null>;
}
```
Automated tests use `MockSyncTransport` to verify:
1. **Offline Mode:** Changes queue safely in outbox when `isOnline = false`.
2. **Retry Behavior:** Retries scale with exponential backoff on simulated 500 errors.
3. **Conflict Detection:** Triggers on simulated 409 responses and forks a distinct document copy without losing data.
4. **Outbox Draining:** Successfully clears outbox when connection returns online.

1. **React Error Boundaries:** Both the Canvas area and the PDF Export modal are wrapped in localized error boundaries to prevent full-application crashes if a single component fails.
2. **Safe Deserialization:** Any incoming JSON from storage or import passes through a validation function that fills in missing properties with default values (defensive schema migration).
3. **Corrupt Import Protection:** Corrupted PDF streams or password-locked PDFs are caught during the initial `pdfjs-dist` initialization; the user receives an immediate friendly alert rather than an unhandled promise rejection.

---

## 9. Security & Privacy Rules

- **Zero Remote Transmission:** All document editing, storage, PDF extraction, and PDF compilation execute 100% client-side in the browser sandbox.
- **XSS Prevention & HTML Sanitization:** Any pasted rich text or imported strings are sanitized using a strict allow-list via `DOMPurify` before insertion into the document AST. No raw HTML tags (`<script>`, `<style>`, `<iframe>`) are ever evaluated or rendered.
- **Image URL Sanitization:** Only Base64 data URLs (`data:image/(png|jpeg|webp)`) and validated blob URLs (`blob:...`) are permitted for image rendering. External `http://` or `https://` image references are blocked to prevent mixed-content warnings, tracking pixels, and unauthorized third-party requests.
- **No Hardcoded Secrets or API Keys:** No authentication keys, third-party tokens, or private secrets exist in the source code.

---

## 10. Performance Rules

- **Input Latency Budget:** Typing in the editor must maintain $\le 16\text{ ms}$ input response time (60 FPS) with no debounce on the immediate text view.
- **Debounced Export Compilation:** Vector PDF compilation runs asynchronously off the main thread or via chunked promises, displaying a non-blocking progress spinner.
- **Image Quota Management:** Embedded images are automatically compressed to JPEG/WebP format with max dimensions of $1600 \times 1600\text{ px}$ before storing in IndexedDB to avoid storage bloat.
- **Document Virtualization:** For documents exceeding 30 pages, page sheets are lazily rendered when scrolling near the viewport.

---

## 11. Browser & Responsive Standards

- **Target Browsers:** Evergreen modern browsers (Chrome/Chromium $\ge 110$, Edge $\ge 110$, Firefox $\ge 115$, Safari $\ge 16.4$).
- **Responsive Breakpoints:**
  - `mobile`: `< 768px`
  - `tablet`: `768px - 1023px`
  - `desktop`: `1024px - 1439px`
  - `wide`: `≥ 1440px`

---

## 12. Testing Strategy

The quality assurance plan verifies all critical guarantees across unit, integration, and user-flow levels.

### 12.1 Unit Tests

#### A. Document Serialization & Deserialization (`tests/unit/documentSerialization.test.ts`)
- **Test 1:** Serialize a document containing all supported blocks (H1, H2, H3, Paragraph, Image, Table, PageBreak) to JSON string; assert JSON matches schema version 1.
- **Test 2:** Deserialize valid JSON back into `DocumentModel`; assert complete object graph equality.
- **Test 3:** Deserialize legacy or incomplete JSON (e.g., missing margins or metadata); verify fallback defaults are populated without throwing errors.
- **Test 4:** Verify XSS injection payload (`<script>alert(1)</script>`) is stripped from text nodes during serialization.

#### B. Formatting Commands (`tests/unit/formattingCommands.test.ts`)
- **Test 1:** Executing `toggleBold` applies `bold` mark to selected text range; second execution removes the mark.
- **Test 2:** Executing `setHeading(2)` transforms a paragraph block to heading level 2 while preserving text content.
- **Test 3:** Executing `insertTable(3, 3)` creates valid 3-row, 3-column structured blocks with empty paragraph cells.
- **Test 4:** Executing `insertImage` with invalid URL or oversized payload fails gracefully with descriptive error.

#### C. Autosave Behavior (`tests/unit/autosaveManager.test.ts`)
- **Test 1:** State transitions from `IDLE` to `DIRTY` on first edit event.
- **Test 2:** Autosave timer fires exactly 1500ms after final keystroke (advancing fake timers).
- **Test 3:** Rapid consecutive keystrokes reset the debounce timer; only one persistence write occurs.
- **Test 4:** Persistence failure transitions state to `ERROR` and triggers backup event.

#### D. PDF Export Input Validation (`tests/unit/pdfExportValidation.test.ts`)
- **Test 1:** Validates page size parameter accepts only `'A4'` and `'LETTER'`.
- **Test 2:** Validates margin settings ensure minimum printable area ($> 200\text{ pt}$ width/height).
- **Test 3:** Validates empty document compiles valid blank vector page without throwing exceptions.
- **Test 4:** Validates document with missing image source falls back to placeholder box rather than failing the export.

---

### 12.2 Integration Tests

#### A. Create-Edit-Save-Reopen (`tests/integration/createEditSaveReopen.test.ts`)
1. Initialize application state.
2. Dispatch "Create New Document" action; verify new ID and default title generated.
3. Apply title change: "Quarterly Strategy Memo".
4. Add H1 heading, two paragraphs, and a bulleted list.
5. Wait for autosave cycle to complete (`SAVED` status).
6. Simulate closing editor (unmount) and returning to dashboard.
7. Re-open "Quarterly Strategy Memo"; assert all blocks, headings, and formatting match exact original state.

#### B. Export-to-PDF (`tests/integration/exportToPdf.test.ts`)
1. Load populated test document model.
2. Open PDF Export configuration modal; set Page Size to `A4`, Margins to `Normal`, Page Numbers to `true`.
3. Trigger `compilePdf()`; capture the generated binary `Blob`.
4. Validate PDF magic bytes (`%PDF-1.`).
5. Assert output file size is non-zero and within expected range ($< 1\text{ MB}$ for text-only).

#### C. Import-Review-Edit-Export (`tests/integration/importReviewEditExport.test.ts`)
1. Ingest a sample text-based digital PDF fixture.
2. Assert classifier identifies it as `TEXT_BASED` with confidence $> 85\%$.
3. Trigger Import Review modal; verify preview contains extracted text.
4. User confirms import; verify editor canvas populates with extracted blocks.
5. Append new paragraph to imported content.
6. Trigger PDF export; verify newly exported PDF includes both imported content and new paragraph.

---

### 12.3 System State Verification Tests

| State Type | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Empty State** | Launch app with fresh IndexedDB | Dashboard renders empty state graphic with "New Document" button; no console errors. |
| **Loading State** | Open 50-page document | Skeleton placeholder renders while IndexedDB reads; transition to interactive canvas is smooth. |
| **Failure State** | Import corrupt `.pdf` file (truncated bytes) | Import error modal appears: "Cannot Open PDF"; application remains stable and interactive. |
| **Recovery State** | Simulate simulated IndexedDB storage quota error | In-memory notification alerts user; provides immediate "Download JSON Backup" fallback action. |

---

### 12.4 Visual Verification Checklist

- [ ] Sheet elevation shadow renders crisp without pixel banding in both Light and Dark mode.
- [ ] Toolbar remains pinned to top with slight frosted glass backdrop blur when scrolling.
- [ ] Active formatting icons (Bold, Italic, Alignment) reflect current selection state accurately.
- [ ] Page break divider visually separates pages with discrete "Page N" indicator badge.
- [ ] Modals display centered with dark backdrop overlay (`rgba(0,0,0,0.5)`).
- [ ] All interactive buttons and inputs have visible focus outline on keyboard `Tab` navigation.

---

### 12.5 Explicit Limits on MVP Testing (What is NOT Tested)

To preserve engineering velocity and focus on core value:
1. **Real OCR Execution:** No testing of optical character recognition accuracy or ML model inference (OCR is explicitly mocked/deferred).
2. **Multi-User Concurrency:** No testing of simultaneous edits or conflict resolution across separate browser tabs.
3. **Complex Desktop Publishing Ingestion:** No testing of magazine-style multi-column coordinate reconstruction; imported PDFs are tested strictly for text and paragraph extraction.
4. **Legacy Browser Support:** No testing for Internet Explorer or pre-2023 browser versions.
5. **Physical Printer Hardware:** No testing against physical printer hardware; validation concludes at PDF binary file generation.

---

## 13. Progressive Web App (PWA) & Offline-First Architecture

### 13.1 Web App Manifest Configuration (`public/manifest.json`)
The application defines a standard PWA manifest meeting all Chromium, Safari, and Firefox installation criteria:
- **`name`:** `"PDFirst"`
- **`short_name`:** `"PDFirst"`
- **`start_url`:** `"/"`
- **`display`:** `"standalone"` (fullscreen application shell without browser address bar)
- **`theme_color`:** `"#2563eb"` (matching `--color-brand-primary` from `ui.md`)
- **`background_color`:** `"#f8fafc"` (matching `--color-bg-app` from `ui.md`)
- **Icons:** Standard square and maskable formats (`192x192`, `512x512`, and scalable SVG).

### 13.2 Service Worker Caching Pipeline (`public/sw.js`)
The application registers a dedicated service worker implementing a two-tier offline caching strategy:
1. **App Shell Pre-caching (`install` event):**
   - Core shell files (`/`, `/index.html`, `/manifest.json`, icons) are pre-fetched and stored in CacheStorage (`pdfirst-cache-v1`).
   - `self.skipWaiting()` activates the worker immediately upon installation.
2. **Navigation Requests (`mode === 'navigate'`):**
   - Implements **Network-First with Cache Fallback**.
   - Online requests fetch fresh HTML and update the cache; offline requests immediately fall back to the pre-cached `/index.html` shell.
3. **Static Assets (`/assets/*`, fonts, CSS, JS chunks):**
   - Implements **Cache-First with Network Fallback**.
   - Repeated requests serve from CacheStorage in 0ms with zero network overhead. Newly encountered assets are dynamically added to `pdfirst-cache-v1`.
4. **Cache Lifecycle Maintenance (`activate` event):**
   - Stale cache versions (non-matching keys) are pruned automatically.
   - `self.clients.claim()` takes immediate control of all active tabs.

### 13.3 Native Installation Coordination (`src/pwa/pwaManager.ts`)
- Manages the browser `beforeinstallprompt` event and captures the `deferredPrompt`.
- Exposes a reactive state (`canInstall`, `isInstalled`) that drives the dynamic `#btn-install-pwa` action button in the header bar.
- On user click, invokes `deferredPrompt.prompt()` and tracks the resulting choice (`accepted` or `dismissed`).
- Automatically hides the install button upon `appinstalled` event.

### 13.4 In-App Mobile PWA Install Guidance Hint (`PwaInstallBanner.tsx`)
Because iOS Safari and certain mobile browsers do not support the programmatic `beforeinstallprompt` API, PDFirst includes a non-intrusive mobile install banner (`#pwa-install-hint`):
- **Guidance Copy:** *"Install PDFirst on your phone: tap ‘Add to Home Screen’ in your browser menu."*
- **Visual Design:** Rendered as a compact banner docked at the top of the viewport with a mobile smartphone icon and soft brand highlight styling (`--color-brand-subtle`).
- **Dismissal Persistence:** Dismissing via `#btn-dismiss-pwa-hint` persists `pdfirst_pwa_hint_dismissed: 'true'` in `localStorage` so users are not repeatedly prompted.
- **Standalone Mode Detection:** Automatically hides if the application is already running in `display-mode: standalone` (i.e. installed as a PWA or WebAPK).

### 13.5 How to Test Offline Behavior
1. **First-Load Caching:**
   - Launch the application (`http://localhost:5173/` or production preview `http://localhost:4173/`).
   - Open Chrome DevTools $\to$ **Application** $\to$ **Service Workers**; confirm status is `activated and is running`.
   - Verify Cache Storage contains `pdfirst-cache-v1` with `/index.html`, `/manifest.json`, and asset bundles.
2. **Simulate Offline Mode:**
   - In Chrome DevTools, open the **Network** tab and select the **Offline** preset (or toggle **Offline** under Application $\to$ Service Workers).
   - Reload the page (`Ctrl+R` / `Cmd+R`).
   - Verify that the application shell, editor canvas, and library load instantly without dinosaur/no-internet screens.
3. **Offline Document Editing & Persistence:**
   - Create a new document or open an existing draft while offline.
   - Type paragraphs, apply headings, insert tables, add block borders, and style text.
   - Observe that the autosave status updates to `(✓) Saved [Time]` (stored safely in IndexedDB `PDFirstDB`).
   - Reload the page while still offline; verify that the newly typed content rehydrates with 100% fidelity.
4. **Offline PDF Export:**
   - Click "Export PDF" while offline.
   - Vector compilation via `jspdf` executes 100% client-side in-browser without network requests; the vector PDF downloads immediately.

### 13.6 Offline Capabilities, Constraints & Browser Differences
| Feature | Offline Behavior | Constraints / Fallbacks |
| :--- | :--- | :--- |
| **App Shell & Editor** | 100% Functional | Cached in CacheStorage via Service Worker. |
| **Document Storage & Autosave** | 100% Functional | Persists directly to IndexedDB (`PDFirstDB`). Protected via `navigator.storage.persist()`. |
| **Vector PDF Export** | 100% Functional | Compiles vector commands entirely client-side using `jspdf`. Downloads via synthetic anchor or File System API. |
| **Text-Based PDF Import** | 100% Functional | Extracts text streams client-side using `pdfjs-dist` worker bundled locally. |
| **Embedded Images** | 100% Functional for Base64 / Local Blobs | External web images (`https://...`) cannot be fetched while offline. Local file uploads (`#toolbar-upload-image`) are recommended. |
| **Web Fonts** | Cached Fallback | Google Fonts (Inter, Merriweather, JetBrains Mono) are cached upon first load; if accessed offline before caching, falls back to system sans-serif (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto`). |
| **Browser Differences (Chromium vs iOS Safari)** | Native install prompt on Chrome/Edge (Android & Desktop); iOS Safari requires manual Share $\to$ "Add to Home Screen". | Safari restricts background sync and can evict uninstalled websites after 7 days of inactivity; installing to Home Screen creates a durable container exempt from this rule. |

---

## 14. Cross-Platform Packaging Architecture & Roadmap

For full technical specifications, dependency manifests, and platform adapter schemas, see [PLATFORM_PLAN.md](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/PLATFORM_PLAN.md).

### 14.1 Summary of Packaging Strategy

PDFirst was engineered with clean layer decoupling: the core React 18, Tiptap, Vanilla CSS, and client-side PDF compiler (`jspdf`) run entirely on standard browser DOM APIs. **No rewrite of the application framework or document model is required.**

```
[ Phase 1: Progressive Web App (PWA) ] ──> COMPLETE (Web, ChromeOS, Mobile Web)
                 │
                 ▼
[ Phase 2: Desktop Native Shell (Tauri v2) ] ──> PLANNED (Windows, macOS, Linux)
  • Binary size <10MB; memory footprint ~35MB RAM.
  • Native OS menus, file associations (.pdfirst, .pdf), and direct in-place disk flush.
  • Electron maintained as a documented low-risk fallback.
                 │
                 ▼
[ Phase 3: Mobile Native Shell (Capacitor) ] ──> PLANNED (iOS App Store & Google Play)
  • 100% DOM and CSS preservation (WKWebView / Android WebView).
  • Native iOS/Android Share Sheet integration for vector PDF exports (AirDrop, Files, Mail).
  • React Native strictly rejected due to absence of DOM/contenteditable for rich-text editing.
```

### 14.2 Platform Adapter Architecture (`PlatformAdapter`)
To prevent host-specific conditionals from polluting presentation components, all platform interactions (file dialogs, disk persistence, PDF export, window chrome) are routed through a standardized, pluggable `PlatformAdapter` interface:
- **`WebPlatformAdapter`:** Standard file input and synthetic anchor downloads with Chromium File System Access API enhancements.
- **`DesktopPlatformAdapter` (Tauri / Electron):** Native OS Open/Save dialogs, in-place disk auto-save, and direct integration with the OS print spooler.
- **`MobilePlatformAdapter` (Capacitor):** Sandboxed app storage (`@capacitor/filesystem`) and native OS Share Sheet (`@capacitor/share`).

### 14.3 Packaged File System & Export Highlights
- **In-Place Desktop Auto-Save:** Opening a `.pdfirst` file from disk enables dual-write persistence: changes debounced to IndexedDB (1500ms) and flushed atomically to disk (3000ms / `Ctrl+S`), behaving like a native desktop editor.
- **Native PDF Exporting:** Desktop writes directly to user-chosen paths and triggers "Show in Folder"; mobile saves to cache and pops the native Share Sheet for instant AirDrop, print, or cloud storage routing.
- **Desktop Keyboard Shortcuts:** Standard application accelerators (`Ctrl/Cmd + S` for save, `Ctrl/Cmd + P` for PDF export modal, `Ctrl/Cmd + O` for open) override browser defaults across all platforms.


