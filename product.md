# PDFirst — Product Specification

**Document Version:** 1.0.0  
**Status:** Source of Truth  
**Target Milestone:** MVP  

---

## 1. Product Vision

**PDFirst** empowers non-technical users to write, format, and organize documents with ease, producing clean, beautifully formatted, professional PDFs every single time.

Unlike traditional desktop publishing software and standard PDF editors—which treat PDF files as rigid coordinate grids of static vector lines and fragmented text strings—PDFirst establishes a **reflowable internal document model** as its core source of truth. Users work in a fluid, intuitive editor that feels as natural as writing in a clean modern document tool, while the application handles the complex typography, margins, pagination, and vector layout required to compile the document into a high-fidelity PDF output.

---

## 2. Target Users

PDFirst is designed specifically for **non-technical professionals, small business owners, educators, and independent operators** who frequently need polished PDF deliverables but do not want to wrestle with complex software:

1. **Freelancers & Consultants:** Creating proposals, client summaries, statements of work, invoices, and service agreements.
2. **Small Business Owners & Office Managers:** Drafting formal letters, internal memos, operating procedures, and customer-facing notices.
3. **Educators & Trainers:** Preparing syllabus documents, assignment sheets, lesson briefs, and workshop handouts.
4. **Administrative Professionals:** Handling routine organizational paperwork where clarity, speed, and professional export quality matter most.

---

## 3. User Problems & Pain Points

Traditional tools force users into one of two frustrating extremes:

1. **The PDF Editor Trap:** Traditional PDF editors (e.g., standard Acrobat-style vector modifiers) treat text as disconnected geometric lines. Attempting to add a single sentence causes text to collide with existing paragraphs or overflow clumsily outside the page bounding box.
2. **The Bloated Word Processor Trap:** Traditional office suites come with hundreds of hidden formatting buttons, unpredictable tab stops, unstable image anchors that jump across pages when text changes, and inconsistent PDF export dialogs that distort formatting.
3. **The Subscription Lock-In Trap:** Basic PDF editing and export are frequently gated behind expensive recurring subscriptions and cumbersome cloud logins that non-technical users dislike.
4. **The False Promise of PDF Conversion:** Tools that claim "100% editable conversion of any PDF" inevitably produce broken layouts, mangled fonts, and messy overlapping blocks, eroding user trust.

---

## 4. Core Value Proposition

- **Reflowable Simplicity:** Content flows naturally. Adding paragraphs, inserting images, or resizing tables dynamically adjusts subsequent content without breaking page alignment.
- **Print-Perfect PDF Output:** PDF is the first-class compilation output. Margins, headers, footers, page numbering, and line wrapping look intentional and professional by default.
- **Local-First Privacy & Reliability:** Documents are stored securely on the user's device without mandatory cloud logins, keeping sensitive documents private and immediately accessible.
- **Honest PDF Ingestion:** Imported documents are parsed into clean, reflowable blocks with transparent feedback regarding what was converted and what requires user review.

---

## 5. Scope Definition

### 5.1 In-Scope for MVP
- Clean, responsive rich-text document workspace (A4 and US Letter page presets).
- Essential formatting: Paragraphs, Headings (H1, H2, H3), Bold, Italic, Underline, Strikethrough, Text Alignment (Left, Center, Right, Justify).
- Structural elements: Bulleted lists, numbered lists, blockquotes, horizontal dividers.
- Media & data: Responsive inline/block images (with caption and size controls) and formatted data tables (add/remove row/column).
- Automatic local persistence (debounced autosave to browser storage) with manual save indicator.
- Multi-document dashboard: Create, rename, duplicate, delete, and reopen documents.
- Deterministic PDF compilation: One-click export to vector PDF with configurable margins, page numbers, and document title header.
- Text-based PDF import: Extraction of digital text, paragraphs, and headings from standard PDFs into the reflowable editor model.
- Import inspection and feedback: Transparent classification banner alerting users if formatting or layout was simplified.

### 5.2 Future Work (Deferred Beyond MVP)

The following capabilities are explicitly deferred from the MVP to maintain architectural focus, performance, and simplicity:

1. **Authentication & User Accounts:** No sign-in walls, user profiles, or credentials. The MVP is strictly local-first.
2. **Cloud Synchronization & Remote Storage:** Cloud databases, remote sync APIs, and multi-device account syncing are deferred in favor of browser IndexedDB.
3. **Real-Time Collaboration:** No simultaneous multi-user cursor editing, operational transforms (OT), CRDTs, or document commenting.
4. **Payment Processing & Subscriptions:** No paywalls, Stripe/billing integration, or tier-gated features.
5. **Advanced Optical Character Recognition (OCR):** Local WebAssembly OCR (Tesseract) or third-party cloud vision APIs. In the MVP, scanned PDFs are detected and honestly identified with an explicit notification.
6. **Digital Signatures & Security Seals:** Cryptographic PKI certificates, signature fields, and password encryption for exported PDFs.
7. **Document Outline Navigator:** Long-document headings navigation sidebar.
8. **Arbitrary / Complex PDF Reverse Engineering:** Complex multi-column magazine layouts, absolute vector CAD positioning, and interactive form fields.
9. **Advanced Table Capabilities:** Multi-cell merging (`colspan`/`rowspan`), background cell fills, custom borders, and formula calculations.
10. **Document Template Gallery:** Built-in template pickers (resumes, invoices, corporate letterheads).
11. **Dynamic Header & Footer Variable Engine:** Dynamic page tokens ("Page X of Y", author, timestamp macros, custom logos).
12. **Alternative Export Formats:** Exporting to DOCX, Markdown, LaTeX, or EPUB.

### 5.3 Explicit Non-Goals for MVP
- **Not a Vector CAD / DTP Tool:** PDFirst will not support freehand vector drawing, bezier curves, or arbitrary pixel-coordinate floating elements.
- **Not an Adobe Acrobat Clone:** PDFirst will not claim or attempt pixel-perfect reverse engineering of arbitrary external PDFs.
- **No Cloud-Dependent Editing:** The core document drafting, editing, autosaving, and PDF export flows must operate 100% offline in-browser without external network calls.

---

## 5.4 Optional Feature Specification: Optical Character Recognition (OCR)

### A. Feature Overview & Opt-In Architecture
Optical Character Recognition (OCR) is designed as a **separate, optional capability** for users who import scanned paper documents, mobile camera captures, or flattened image-only PDFs. OCR is **strictly opt-in**; it never runs automatically in the background without explicit user initiation.

### B. Foundational Invariants
1. **Original PDF Preserved:** The OCR process is completely non-destructive. The original PDF file is never altered, overwritten, or discarded.
2. **Mandatory Review Screen:** OCR output is **never committed directly to the editor canvas**. Users must inspect an interactive **OCR Review Screen** displaying confidence ratings, side-by-side page comparisons, and extracted text before accepting content.
3. **Local-First Default:** To honor PDFirst's privacy commitment, OCR executes locally in the client browser using WebAssembly workers. No document pages or text are sent to external servers by default.

### C. Scanned PDF Detection Criteria
A PDF is identified as a candidate for OCR when:
- Total extractable digital characters across the document are $< 50$.
- Raster image objects are present on one or more pages.
- Text layer character density is $< 0.05$ characters per square inch.

### D. User Flow: OCR Ingestion & Review
1. **Detection Notice:** When a scanned PDF is uploaded, the Import Modal presents an honest status badge:
   - Badge: `Scanned Document Detected (No Digital Text Layer)`.
   - Message: *"This document contains scanned image pages. Would you like to run optical character recognition to extract editable text?"*
2. **Optional Trigger:** The user clicks `Run Local OCR` or chooses to `Cancel`.
3. **Execution & Progress State:**
   - Real-time progress bar: `Processing page X of Y...`.
   - Dedicated `Cancel OCR` button allowing the user to abort at any time without freezing the UI.
4. **OCR Review Screen:**
   - **Quality Assessment:** Overall document confidence score (e.g. `88% Confidence — Good Clarity`).
   - **Visual Low-Confidence Highlights:** Words with $< 65\%$ recognition confidence are subtly flagged in amber for user inspection.
   - **Side-by-Side Comparison:** Left pane renders the original scanned page image; right pane displays the reflowed editable draft.
5. **Decision Actions:**
   - `Accept & Open in Editor`: Commits the reflowed document to a new editable draft.
   - `Discard OCR`: Discards extracted text and returns safely to the document library.

### E. Explicit Limitations & Boundaries
- **No Handwriting Recognition:** OCR is tuned exclusively for printed, machine-typeset Latin typography (English and standard Western European alphabets). Cursive or handwritten notes are not supported.
- **Degraded Scans & Skew:** Poorly lit scans ($< 150\text{ DPI}$), heavily skewed pages ($> 15^\circ$), or noisy photocopies will display a low-confidence warning recommending a cleaner scan.
- **Complex Forms & Tables:** Multi-cell forms or irregular ledger grids in scanned images are extracted as linear text sections rather than complex nested tables.

### F. Operational Constraints
| Parameter | Constraint | Rationale |
| :--- | :--- | :--- |
| **Execution Environment** | Client-Side WebAssembly Worker | Zero server costs, 100% offline capability, complete data privacy. |
| **File Size Limit** | Max 20MB / Max 25 pages per batch | Prevents browser memory exhaustion and CPU lockup. |
| **Timeout Limit** | 60 seconds per page / 5 minutes overall | Automatic timeout aborts hung workers cleanly. |
| **Operational Cost** | $0.00 / Zero marginal cost | Operates locally on client hardware without third-party API keys. |

---

## 5.5 Optional Feature Specification: Cloud Synchronization & Account Services

### A. Feature Overview & Account Requirements
Cloud Synchronization is designed as an **optional, additive layer** built on top of the verified local-first storage foundation.
- **Guest / Anonymous Local Use:** Users can use PDFirst indefinitely without an account. All documents, editing, and vector PDF exports remain 100% functional locally in the browser via IndexedDB.
- **Account Creation (Opt-In):** Creating an account is required only when the user explicitly chooses to back up documents to the cloud, access drafts across multiple devices, or share documents.
- **Authentication Methods:** Secure, industry-standard authentication (Email with passwordless magic link, or OAuth 2.0 via Google / GitHub). No passwords stored in plaintext.

### B. Data Ownership & Privacy Invariants
1. **User Ownership:** The user retains 100% ownership, intellectual property, and copyright over all documents, images, and exported PDFs.
2. **Zero Commercial Data Exploitation:** PDFirst never sells user content, shares telemetry with third-party advertisers, or uses user documents to train machine learning models.
3. **Encryption Standards:**
   - **In Transit:** All communications encrypted via TLS 1.3 with HTTPS and HTTP Strict Transport Security (HSTS).
   - **At Rest:** Documents and metadata stored in cloud databases are encrypted using AES-256. Image attachments in object storage use server-side encryption (SSE-S3/KMS).

### C. Document Upload & Download Behavior
- **Local Source of Truth First:** All user keystrokes and formatting changes save immediately to local IndexedDB. Edits are never blocked by network latency.
- **Asynchronous Sync Outbox:** Unsynced changes are queued in a local `sync_outbox` store. When online, the sync worker transmits incremental changes to the sync endpoint via authenticated REST/GraphQL calls.
- **Bi-directional Pull:** On app launch or periodic sync intervals (every 60 seconds), the client queries the server for changes newer than the client's `lastSyncedAt` timestamp.

### D. Offline-First Resilience
- **Zero Degradation Offline:** When disconnected from the internet, the entire application remains fully usable. Documents can be created, edited, deleted, and exported to PDF without errors.
- **Auto-Reconnection:** The client listens to browser `online` and `offline` events. When connectivity returns, the sync engine wakes up automatically and drains the pending outbox.

### E. Conflict Resolution & Forking Policy
When concurrent edits occur on the same document across two devices (e.g. offline edits on laptop while edits were made on a tablet):
1. **No Silent Overwriting:** The system **never** silently deletes or overwrites user work.
2. **Version Tagging (ETags):** Every document update carries a monotonic version counter and cryptographic checksum (`etag`).
3. **Conflict Fork Creation:** If a sync upload encounters a version mismatch (`409 Conflict`), the engine automatically creates a **Conflicted Copy**:
   - Title: `<Document Title> (Conflicted Copy from <Device/Date>)`
   - Both versions remain saved in the document library.
   - An in-app conflict notification banner alerts the user: *"Concurrent edits detected. A backup copy was preserved so no changes were lost."*

### F. File Size & Storage Limits
| Resource | Limit | Rationale |
| :--- | :--- | :--- |
| **Document JSON Payload** | Max 10MB per document | Accommodates documents up to 500+ pages with rich tables. |
| **Embedded Image Files** | Max 5MB per image | Prevents sync latency; client-side image compression enforced. |
| **Total Cloud Storage Quota**| 500MB per free tier account | Sustainable cloud operational costs while providing generous capacity. |

### G. Sync Status Indicators & Failure Recovery
The header displays real-time, human-readable cloud sync badges:
- `Synced`: All changes backed up to the cloud (Green cloud check icon).
- `Syncing...`: Transmitting pending edits (Animated pulse icon).
- `Offline (Saved Locally)`: Network unavailable; draft is safe in browser (Grey cloud offline icon).
- `Sync Paused`: Network failure or server error; retrying automatically with exponential backoff (Amber warning icon).

**Recovery Mechanics:**
- **Exponential Backoff with Jitter:** On network failures or 5xx server errors, retry delays scale: 1s $\to$ 2s $\to$ 4s $\to$ 8s $\to$ 16s $\to$ max 30s.
- **Circuit Breaker:** If 5 consecutive retries fail, auto-sync pauses to conserve client battery/bandwidth and shows a manual `Retry Sync` button.
- **Session Expiry (401):** If the authentication token expires, local edits remain securely preserved; user is prompted to re-authenticate without data loss.

### H. Account Deletion Policy
- **Self-Service Deletion:** Users can permanently delete their account at any time from Account Settings.
- **Export Before Delete:** The system prompts the user to download a complete ZIP archive of all their documents and PDFs before confirming deletion.
- **Hard Deletion Guarantee:** Upon confirmation, all cloud database records, version histories, and stored image assets are permanently purged within 24 hours. Local browser copies in IndexedDB remain on the user's physical device until the user clears local browser storage.

---

## 6. User Stories

| ID | As a... | I want to... | So that... |
| :--- | :--- | :--- | :--- |
| **US-01** | User | Create a new blank document with standard page dimensions | I can start drafting a clean document immediately. |
| **US-02** | User | Apply typographic styles (headings, bold, lists, alignment) | My document structure is clear, legible, and hierarchical. |
| **US-03** | User | Insert an image and a table into my document | I can present visual diagrams and structured data side-by-side with text. |
| **US-04** | User | Have my edits saved automatically in the background | I never lose work if my browser refreshes or crashes. |
| **US-05** | User | Close the application and reopen previous documents from a list | I can return to previous drafts anytime without manual file browsing. |
| **US-06** | User | Export my document directly to a downloadable PDF | I can share a professional, unalterable document with clients and colleagues. |
| **US-07** | User | Import an existing digital text PDF into PDFirst | I can update and edit the content in a reflowable editor without starting from scratch. |
| **US-08** | User | Receive clear warnings if an imported PDF contains complex or scanned elements | I know exactly what needs manual review rather than discovering missing text later. |

---

## 7. Primary MVP User Flows & Acceptance Criteria

### Flow 1: Create a New Document
- **Trigger:** User clicks "New Document" on the home dashboard or header.
- **Behavior:**
  1. System initializes a new document record with default page settings (A4 or US Letter based on user locale).
  2. Document opens in the editor with focus placed on the document title input (default: "Untitled Document").
  3. Canvas shows an empty primary paragraph block ready for typing.
- **Acceptance Criteria:**
  - `doc-title-input` is editable and updates document title immediately.
  - Document is assigned a unique identifier (`id`) and timestamp.
  - Initial document record is saved to local storage within 500ms of creation.

### Flow 2: Add and Format Text
- **Trigger:** User types content into the canvas and highlights text or uses toolbar controls.
- **Behavior:**
  1. User can apply Headings (H1, H2, H3), Paragraph styling, Bold, Italic, Underline, and Strikethrough via toolbar or keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+U`).
  2. User can toggle bulleted (`Ctrl+Shift+8`) and numbered (`Ctrl+Shift+7`) lists.
  3. User can set text alignment (left, center, right, justify).
- **Acceptance Criteria:**
  - Formatting applies immediately without cursor jumping or visual latency.
  - Formatting persists across paragraphs when enter/return is pressed appropriately.
  - Undo (`Ctrl+Z`) and Redo (`Ctrl+Y` / `Ctrl+Shift+Z`) revert formatting changes accurately.

### Flow 3: Insert an Image and Table
- **Trigger:** User clicks "Insert Image" or "Insert Table" on the toolbar.
- **Behavior (Image):**
  1. File picker allows selecting PNG, JPEG, or WebP files (max 5MB recommended).
  2. Image is converted to a local Base64/Blob URL, rendered inline, and resizable (small, medium, full-width).
  3. Optional image caption field is provided below the image.
- **Behavior (Table):**
  1. User specifies initial dimensions (default: 3 columns x 3 rows).
  2. Table renders with editable cells supporting basic text formatting.
  3. Context controls allow adding/deleting rows and columns.
- **Acceptance Criteria:**
  - Image stays anchored to its document block position and flows naturally with text.
  - Tables do not overflow the page boundaries horizontally; columns adapt cleanly.
  - Both images and tables correctly serialize into the internal document model.

### Flow 4: Save Automatically
- **Trigger:** User modifies text, styling, or structural elements.
- **Behavior:**
  1. The application marks the document state as "dirty".
  2. A debounced autosave timer (1500ms after last keystroke) triggers serialization to IndexedDB.
  3. Status indicator transitions from "Saving..." to "All changes saved".
- **Acceptance Criteria:**
  - In-flight autosaves complete before window unload (`beforeunload` event).
  - Autosave executes without causing UI stutter or input lag.
  - Status indicator clearly displays "Unsaved changes", "Saving...", or "Saved" with timestamps.

### Flow 5: Close and Reopen the Document
- **Trigger:** User navigates back to the Document Dashboard and selects an existing document.
- **Behavior:**
  1. Dashboard displays all saved documents with title, last modified date, and page count.
  2. Clicking a document card loads its JSON AST from IndexedDB.
  3. Document canvas rehydrates with identical content, formatting, images, and tables.
- **Acceptance Criteria:**
  - Document rehydrates completely within 300ms for standard 5-page documents.
  - Cursor or scroll position is restored to the first page.
  - No data corruption or formatting loss occurs during rehydration.

### Flow 6: Export the Document to PDF
- **Trigger:** User clicks "Export PDF" in the main navigation.
- **Behavior:**
  1. An export modal opens offering quick configuration: Page Size (A4 / Letter), Margins (Normal, Compact, Wide), and Page Numbering toggle.
  2. User clicks "Download PDF".
  3. Client-side PDF engine translates the internal document AST into vector PDF commands.
  4. Browser triggers download of `<document-title>.pdf`.
- **Acceptance Criteria:**
  - Exported PDF text is selectable vector text (not a low-resolution canvas snapshot).
  - Page breaks avoid orphan headings (headings keep-with-next rules).
  - Margins, fonts, tables, and images accurately reflect the document layout settings.
  - Export completes in under 3 seconds for documents under 20 pages.

### Flow 7: Import a Supported Text-Based PDF
- **Trigger:** User clicks "Import PDF" on the dashboard or editor menu and selects a `.pdf` file.
- **Behavior:**
  1. Engine inspects the PDF file structure using `pdfjs-dist`.
  2. Verifies the presence of text streams; identifies headings by font size heuristics and paragraphs by spatial bounding boxes.
  3. Maps extracted text streams into internal document blocks.
  4. Opens the document in the editor with a non-destructive draft preview.
- **Acceptance Criteria:**
  - Clean text PDFs (e.g., written documents, reports) import with readable paragraph hierarchy.
  - Line breaks within paragraphs are reflowed into unified paragraph blocks rather than rigid individual line elements.

### Flow 8: Show an Honest Warning When Conversion is Incomplete
- **Trigger:** User imports a PDF that contains scanned images, complex multi-column layouts, or unsupported vector art.
- **Behavior:**
  1. System analyzes the PDF and calculates a layout confidence metric:
     - **Scanned / Image-Only:** Text stream count is near zero while image count is high.
     - **Complex Layout:** Multiple overlapping text boxes, dense vector drawings, or multi-column grids detected.
  2. The application opens an **Import Quality Assessment Modal** before committing to the editor:
     - Clear status badge: "Conversion Simplified" or "Scanned Document Detected".
     - Honest explanation: *"This document contains scanned pages or complex desktop publishing layouts. PDFirst has extracted the readable text, but columns, graphics, and background decorations have been simplified into reflowable sections."*
     - For scanned documents without text: Displays a polite notice explaining that OCR will be supported in an upcoming update, with an option to import raw image pages as reference.
  3. User can choose to "Open in Editor (Reflowed)" or "Cancel".
- **Acceptance Criteria:**
  - User is never misled into believing an external PDF will import with identical vector geometry.
  - No silent failures or blank screens on corrupt or encrypted PDFs.

---

## 8. Product Risks & Mitigation Strategies

| Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **User expects Adobe Acrobat-style coordinate vector editing** | High | Clear onboarding messaging: *"PDFirst turns PDFs into clean, reflowable documents you can actually edit and re-export without broken lines."* |
| **Scanned PDFs contain no digital text** | High | Immediate pre-flight detection: Flag image-only PDFs before parsing, show clear status modal explaining OCR limitation in MVP, and avoid generating empty screens. |
| **Page-break mismatch between web canvas and exported PDF** | Medium | Implement fixed-dimension sheet view in the editor canvas (A4/Letter dimensions with visible page divider marks) so visual breaks match export output. |
| **Large embedded images bloat local storage** | Medium | Client-side image compression and resizing (max 1600px width/height) before storing in IndexedDB; warn user if total document size exceeds 25MB. |
| **Complex table layout overflows on mobile/PDF** | Medium | Restrict table column widths to proportional percentages; enable horizontal scrolling on canvas if needed and wrap cell content cleanly in PDF generator. |

---

## 9. Success Metrics

1. **Document Creation Speed:** A user can create a document, format two headings, add a table, and export a PDF in under 90 seconds.
2. **Export Reliability:** 100% of exported PDFs are valid, selectable vector PDF documents without font corruption or cut-off text.
3. **Zero Data Loss:** 0 reported incidents of unsaved changes lost during unexpected browser refreshes or tab closures.
4. **Import Transparency:** 100% of scanned or complex PDFs trigger the honesty warning modal before user edit commitment.
5. **Client-Side Privacy:** Zero document content bytes or personal data transmitted to external servers during standard operation.
