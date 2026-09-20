# PDFirst — Final Feature Specification & Roadmap

**Document Version:** 1.0.0  
**Target:** Post-MVP Production Feature Suite  
**Author:** Antigravity Architecture & Product Team  
**Scope:** Complete feature specifications, user stories, acceptance criteria, technical constraints, and phased implementation schedule for PDFirst beyond the initial MVP baseline.

---

## Executive Summary & Guiding Architectural Invariants

PDFirst empowers non-technical users to write, format, and organize reflowable documents that compile to print-perfect vector PDFs every single time. As we expand the feature set beyond the initial MVP baseline, every new capability must strictly uphold the core architectural invariants:

1. **The Internal Document Model is the Single Source of Truth:**
   The document is always stored, persisted, and edited as a structured, reflowable JSON Abstract Syntax Tree (`DocumentModel` based on Tiptap/ProseMirror). Neither exported PDFs nor external imported files are ever the internal editing model.
2. **100% Local-First & Client-Side Execution:**
   All text formatting, color application, image cropping, table styling, PDF compilation, and PDF text extraction execute entirely client-side in the browser or device WebView without mandatory server calls or accounts.
3. **Deterministic Dual Rendering (DOM Canvas $\leftrightarrow$ Vector PDF):**
   Every visual styling feature added to the rich-text canvas (e.g., text colors, highlights, table borders, cell backgrounds, image wrap) must have an exact, deterministic compilation mapping in the `jspdf` / `jspdf-autotable` vector engine.
4. **Honest Ingestion Boundaries:**
   We maximize extraction fidelity for digital, text-based PDFs while preserving the honest, non-destructive boundary for scanned or image-only documents.

---

## Feature Matrix & Phasing Overview

| Feature ID | Feature Description | Phase | Priority Tag | Primary Layer |
| :--- | :--- | :--- | :--- | :--- |
| **RT-01** | Text Color Picker (Presets + Custom Hex) | **Phase A** | **Must Have** | Editor & PDF Compiler |
| **RT-02** | Text Highlight / Background Color | **Phase A** | **Must Have** | Editor & PDF Compiler |
| **PG-01** | Manual Page Break & Visual Page Sheets | **Phase A** | **Must Have** | Canvas & AST Schema |
| **PG-02** | Document Page Settings Consistency | **Phase A** | **Must Have** | Sidebar, Storage & Exporter |
| **CP-01** | Formatted Rich Text Copy-Paste & HTML Sanitization | **Phase A** | **Must Have** | ProseMirror & DOMPurify |
| **CP-02** | Direct Clipboard Image Paste & Duplication | **Phase A** | **Must Have** | Clipboard API & AST |
| **IMG-01** | Multi-Source Image Insertion (URL + File Upload) | **Phase B** | **Must Have** | Modals, Storage & Exporter |
| **IMG-02** | Broken / Invalid Image Fallback State | **Phase B** | **Must Have** | DOM NodeView & Exporter |
| **IMG-03** | Visual Resize Handles, Alignment & Captions | **Phase B** | **Must Have** | Tiptap NodeView & Canvas |
| **IMG-04** | Client-Side Rectangular Crop UI | **Phase B** | **Must Have** | HTML Canvas & FileReader |
| **IMG-05** | Image Text Wrap Modes (Inline, Square, Float) | **Phase B** | **Nice to Have** | CSS Layout & Exporter |
| **BLK-01** | Block Border Controls (Width, Style, Color) | **Phase B** | **Must Have** | Block Schema & Exporter |
| **TBL-01** | Table Header & Cell Background Color Fills | **Phase B** | **Must Have** | Table Extension & AutoTable |
| **TBL-02** | Table Border Width, Style & Color Customization | **Phase B** | **Must Have** | Table Extension & AutoTable |
| **IMP-01** | Enhanced Text PDF Structural Ingestion (Headings, Lists) | **Phase C** | **Must Have** | PDF.js Worker & Clustering |
| **IMP-02** | PDF Text Color Preservation | **Phase C** | **Nice to Have** | PDF Operator Stream & Marks |
| **IMP-03** | Basic Tabular Grid Detection & Reconstruction | **Phase C** | **Nice to Have** | Spatial Heuristics & Tables |
| **IMP-04** | Scanned PDF Honest Notification & Review Gate | **Phase C** | **Must Have** | Classifier & Review Modal |
| **MOB-01** | Touch-Optimized Color & Slider Controls ($44\text{px}$) | **Phase C** | **Must Have** | Mobile UI & CSS Tokens |
| **MOB-02** | Mobile Viewport Safety & Virtual Keyboard Caret Dock | **Phase C** | **Must Have** | Viewport Meta & DOM Layout |

---

## Phase A: Core Typography, Page Management & Clipboard

### Feature RT-01: Text Color Picker (Presets + Custom Hex)
* **Priority:** **Must Have**
* **User Story:**
  > *As a document author, I want to apply distinct text colors to headings, key metrics, and emphasized paragraphs so that my documents convey hierarchy, brand identity, and visual appeal.*
* **Acceptance Criteria:**
  1. The formatting toolbar provides a dedicated Text Color dropdown/popover (`#toolbar-text-color`).
  2. The popover presents a curated palette of at least 10 high-contrast, theme-harmonized presets (Slate, Navy, Blue, Teal, Emerald, Amber, Crimson, Purple, Charcoal, Black).
  3. Includes an interactive native `<input type="color">` and text input allowing arbitrary 6-character Hex input (`#RRGGBB`).
  4. Selected text range receives the color mark; if no text is selected, newly typed text inherits the active color.
  5. Includes a "Reset to Default" action that strips the color mark, reverting to `--color-text-primary`.
  6. The active color is serialized into the document JSON AST (`marks: [{ type: 'textStyle', attrs: { color: '#2563eb' } }]`).
  7. Vector PDF compiler (`jspdf`) reads the color attribute and sets `pdf.setTextColor(r, g, b)`, producing exact vector RGB color matching.
* **Technical Constraints & Risks:**
  - `@tiptap/extension-color` and `@tiptap/extension-text-style` are already installed and must be properly registered in `EditorCore.tsx`.
  - Contrast accessibility: When Dark Theme is active, custom dark colors (e.g. `#1e293b`) must remain readable on the canvas while retaining their exact print value for white-background PDF compilation.

---

### Feature RT-02: Text Highlight / Background Color
* **Priority:** **Must Have**
* **User Story:**
  > *As a reviewer or student, I want to highlight critical passages with background colors so that important action items and takeaways immediately stand out.*
* **Acceptance Criteria:**
  1. Formatting toolbar provides a Text Highlight button (`#toolbar-text-highlight`) with popover.
  2. Offers 6 soft pastel background presets (Yellow, Green, Cyan, Pink, Orange, Violet) plus custom hex.
  3. Includes a "Remove Highlight" button that unsets the mark.
  4. Renders on the canvas with subtle rounded background padding (`border-radius: 2px`).
  5. The highlight is preserved in AST serialization (`marks: [{ type: 'highlight', attrs: { color: '#fef08a' } }]`).
  6. The PDF export compiler measures text dimensions using `pdf.getTextDimensions()` and renders a filled vector rectangle behind the highlighted glyphs before painting text.
* **Technical Constraints & Risks:**
  - In jsPDF, background rects must be drawn **prior** to rendering the text characters at `(cursorX, cursorY)` to avoid occluding vector text glyphs.

---

### Feature PG-01: Manual Page Break & Visual Page Sheets
* **Priority:** **Must Have**
* **User Story:**
  > *As a report writer, I want to force content onto a new page and visually see where page breaks occur so that my document looks structured and intentional before exporting.*
* **Acceptance Criteria:**
  1. Toolbar includes an "Insert Page Break" action (`#toolbar-page-break`) and shortcut `Ctrl+Enter` / `Cmd+Enter`.
  2. Inserts an explicit `pageBreak` block node into the document AST:
     ```json
     { "type": "pageBreak", "attrs": { "id": "pb_123" } }
     ```
  3. In the editor canvas, page breaks render as a discrete visual divider containing a badge: `── Page Break ──`.
  4. The canvas organizes content visually into simulated page sheets (`.page-sheet`) reflecting the document's selected page size (A4 / Letter).
  5. Backspacing at the boundary of a page break safely removes the node without deleting adjacent text.
  6. During PDF compilation, encountering a `pageBreak` node triggers `pdf.addPage(size, orientation)` and resets `cursorY` to top margin.
* **Technical Constraints & Risks:**
  - Dynamic multi-page reflow: ProseMirror manages a single continuous DOM. Visual sheet boundaries must calculate block heights without introducing cursor traps or breaking IME keyboard composition.

---

### Feature PG-02: Document Page Settings Consistency
* **Priority:** **Must Have**
* **User Story:**
  > *As an administrative user, I want my chosen page size (A4/Letter), orientation (Portrait/Landscape), and margins to apply consistently across the editor canvas and the exported PDF.*
* **Acceptance Criteria:**
  1. The Properties Sidebar (`PropertiesSidebar.tsx`) provides real-time controls for:
     - Page Size: `A4` ($210 \times 297\text{ mm}$) or `Letter` ($8.5 \times 11\text{ in}$).
     - Orientation: `Portrait` or `Landscape`.
     - Margin Presets: `Normal` (0.75 in / 54pt), `Compact` (0.5 in / 36pt), `Wide` (1.0 in / 72pt).
     - Header / Footer toggles and page numbering checkbox.
  2. Modifying settings immediately updates the canvas sheet aspect ratio and CSS padding.
  3. Settings persist in `document.settings` in IndexedDB and rehydrate cleanly upon document reload.
  4. Export PDF modal initializes its default parameters directly from `document.settings`, ensuring 1:1 fidelity without re-prompting.
  5. Landscape mode recalculates content printable width ($contentWidth = pageHeight - left - right$) and adjusts table auto-columns accordingly.
* **Technical Constraints & Risks:**
  - Switching orientation dynamically must not clip tables or overflow wide images; image `maxWidth` must remain constrained to $100\%$ of the active sheet container.

---

### Feature CP-01: Formatted Rich Text Copy-Paste & HTML Sanitization
* **Priority:** **Must Have**
* **User Story:**
  > *As a user copying research from external sources or rearranging draft sections, I want pasted rich text to retain headings, bold, italic, lists, and links while stripping unsafe scripts.*
* **Acceptance Criteria:**
  1. Copying text from within PDFirst and pasting elsewhere in the document preserves all formatting marks and block types.
  2. Pasting external HTML (e.g. from Google Docs, Wikipedia, or web articles) maps recognized tags (`<h1>`-`<h3>`, `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`, `<em>`, `<u>`, `<a>`) into corresponding Tiptap nodes.
  3. Any malicious tags (`<script>`, `<iframe>`, `<style>`, `<embed>`, inline event handlers `onclick=`) are aggressively stripped using DOMPurify before insertion.
  4. Pasting plain text preserves line breaks as discrete paragraphs without mangling existing block structure.
* **Technical Constraints & Risks:**
  - ProseMirror's clipboard parser can occasionally insert empty spans or redundant wrapping divs from MS Word; custom `transformPastedHTML` rule required to normalize dirty clipboard HTML.

---

### Feature CP-02: Direct Clipboard Image Paste & Duplication
* **Priority:** **Must Have**
* **User Story:**
  > *As a content creator, I want to take a screenshot and paste it directly with Ctrl+V so that I don't have to manually save the file to disk first.*
* **Acceptance Criteria:**
  1. Pressing `Ctrl+V` / `Cmd+V` when clipboard contains image data (`items[i].type.startsWith('image/')`) intercepts the event.
  2. Reads image binary via `item.getAsFile()` and converts to optimized Base64 data URL.
  3. Inserts an `image` node into the document at the current cursor position.
  4. Displays a brief non-blocking toast: *"Image pasted from clipboard"*.
  5. Supports copying an existing editor image and pasting a duplicate image block.
  6. Enforces image size guard: Images $> 5\text{MB}$ are automatically compressed to JPEG/WebP before insertion to preserve IndexedDB storage quota.
* **Technical Constraints & Risks:**
  - Safari iOS clipboard permissions require handling async clipboard items gracefully with fallback file picker prompt if permission is blocked.

---

## Phase B: Media Architecture, Block Borders & Table Styling

### Feature IMG-01: Multi-Source Image Insertion (URL + File Upload)
* **Priority:** **Must Have**
* **User Story:**
  > *As a user, I want to insert images either by dragging and dropping an image file, browsing my computer, or pasting a web URL so that I have complete flexibility.*
* **Acceptance Criteria:**
  1. Image Modal (`InsertImageModal.tsx`) provides two distinct tabs: **"Upload File"** and **"Direct URL"**.
  2. File upload tab supports drag-and-drop zone and native file picker (`image/png, image/jpeg, image/webp`).
  3. Validates file format and displays real-time thumbnail preview before confirming insertion.
  4. Direct URL tab validates format (`http://`, `https://`, or `data:image/...`) and tests image loading before confirming.
  5. Allows entering an optional Alt Text / Caption during insertion.
* **Technical Constraints & Risks:**
  - External HTTP image URLs can fail when the user goes offline or during vector export if CORS headers prevent canvas extraction. All remote URLs should be fetched and converted to local Base64/Blob storage upon insertion.

---

### Feature IMG-02: Robust Broken / Invalid Image Fallback State
* **Priority:** **Must Have**
* **User Story:**
  > *As an author, I want the editor and PDF exporter to handle broken or missing image links gracefully so that the app never crashes or exports blank pages.*
* **Acceptance Criteria:**
  1. If an image fails to load (`onError` event in DOM), the canvas renders a clean placeholder card displaying an `AlertCircle` icon, the image alt text or filename, and a message: *"Image unavailable"*.
  2. Provides an interactive "Replace Image" button on the broken placeholder.
  3. During PDF export, if an image source is invalid or unresolvable:
     - Vector compilation **does not throw an unhandled exception**.
     - Renders a light-gray bordered vector placeholder box with fallback text: `[Image: <alt>]`.
     - Logs a warning and continues compiling subsequent document pages.
* **Technical Constraints & Risks:**
  - jsPDF `addImage()` throws synchronous errors on malformed image data; must wrap each image compilation in a `try...catch` boundary with vector fallback rect.

---

### Feature IMG-03: Visual Resize Handles, Alignment & Captions
* **Priority:** **Must Have**
* **User Story:**
  > *As a layout designer, I want to resize images directly on the page, choose their alignment, and add descriptive captions so that my document looks professionally published.*
* **Acceptance Criteria:**
  1. Clicking an image displays a subtle selection border with interactive corner resize handles.
  2. Dragging a corner handle updates image width smoothly, snapping to $25\%$, $50\%$, $75\%$, or $100\%$ printable page width presets (or free drag with Shift key for aspect ratio lock).
  3. Floating context pill above selected image provides alignment toggles: **Left**, **Center**, **Right**.
  4. Supports an inline editable caption field immediately below the image (`caption` attribute).
  5. The PDF compiler respects the aligned horizontal offset and scales image width/height proportionally within margin boundaries.
* **Technical Constraints & Risks:**
  - Tiptap custom React NodeView required for image blocks to embed interactive resize overlays without interfering with ProseMirror selection transactions.

---

### Feature IMG-04: Client-Side Rectangular Crop UI
* **Priority:** **Must Have**
* **User Story:**
  > *As a user, I want to crop unwanted margins or backgrounds from an image inside the app so that I don't need external photo editing software.*
* **Acceptance Criteria:**
  1. Selecting an image displays a "Crop" button in the image action bar.
  2. Clicking "Crop" opens a focused client-side cropping modal displaying the full original image.
  3. User can drag a rectangular bounding box with 8 adjustment handles to select the desired crop region.
  4. Modal provides "Apply Crop", "Reset", and "Cancel" buttons.
  5. Applying crop renders the cropped pixel area to an offscreen HTML Canvas, generates a clean Base64 JPEG/PNG data URL, and updates the image node.
  6. The operation is 100% client-side with zero server latency or data leakage.
* **Technical Constraints & Risks:**
  - Preserving original vs destructive crop: To keep document JSON AST lightweight and under IndexedDB storage limits, cropped images replace the active Base64 payload, while a temporary undo buffer allows immediate reversal within the editing session.

---

### Feature IMG-05: Image Text Wrap Options (Inline, Square, Float)
* **Priority:** **Nice to Have**
* **User Story:**
  > *As a newsletter or memo writer, I want paragraphs to wrap neatly around floating images so that my layout looks like a magazine or formal newsletter.*
* **Acceptance Criteria:**
  1. Image settings popover provides Wrap options:
     - **Break Text (Default):** Image occupies full horizontal line block; text appears above and below.
     - **Wrap Left:** Image floats to the left margin; subsequent paragraph text wraps along its right edge with 16px gutter.
     - **Wrap Right:** Image floats to the right margin; text wraps along its left edge.
  2. Canvas editor reflects CSS float wrapping cleanly during interactive typing.
  3. In PDF export, the compiler calculates the rectangular bounding box of floated images and divides text lines into partial-width blocks until the image height is cleared.
* **Technical Constraints & Risks:**
  - jsPDF has no native CSS float engine. Implementing text wrap in PDF requires calculating custom line splices based on font metrics (`pdf.getStringUnitWidth()`), which is mathematically complex and carries high edge-case risk. Tagged as **Nice to Have** for Phase B.

---

### Feature BLK-01: Block Border Controls (Width, Style, Color)
* **Priority:** **Must Have**
* **User Story:**
  > *As an author, I want to apply decorative or callout borders to paragraphs, quotes, and images so that important callout boxes, warnings, and executive summaries look distinct.*
* **Acceptance Criteria:**
  1. Properties Sidebar provides a "Block Border & Box" section when a paragraph, blockquote, or image is focused.
  2. Controls include:
     - **Border Width:** `None (0px)`, `Thin (1px)`, `Medium (2px)`, `Thick (4px)`.
     - **Border Style:** `Solid`, `Dashed`, `Dotted`.
     - **Border Color:** Palette selector with custom Hex input.
     - **Background Fill:** Optional subtle background tint (e.g. alert warning yellow or info blue).
     - **Border Sides:** Toggle all 4 sides or left callout border only (common for quotes).
  3. Renders on canvas with matching CSS `border`, `padding: 12px 16px`, and `border-radius: 6px`.
  4. Stored in block attributes:
     ```json
     "attrs": { "border": { "width": 2, "style": "solid", "color": "#2563eb", "leftOnly": true } }
     ```
  5. The PDF compiler renders matching vector lines (`pdf.setLineWidth()`, `pdf.setDrawColor()`, `pdf.setLineDashPattern()`) and optional background fill rect behind the text.
* **Technical Constraints & Risks:**
  - Multi-line block pagination: If a bordered callout box spans across a page break, the vector compiler must cleanly close the border at the bottom margin of Page 1 and reopen it at the top of Page 2.

---

### Feature TBL-01: Table Header & Cell Background Color Fills
* **Priority:** **Must Have**
* **User Story:**
  > *As an accountant or project manager, I want to highlight table headers and specific status cells with background colors so that data tables are easy to scan.*
* **Acceptance Criteria:**
  1. Clicking inside any table displays a floating Table Formatting bar.
  2. Includes a "Header Style" toggle that fills the header row with selected color presets (Brand Blue, Dark Slate, Light Gray, Sage Green) and auto-contrasts text color.
  3. Includes a "Cell Background" color picker that applies a background color mark to the currently focused cell or selected range of cells.
  4. Serializes cell attributes: `{ "type": "tableCell", "attrs": { "backgroundColor": "#eff6ff" } }`.
  5. `jspdf-autotable` integration translates cell background attributes directly to `styles.fillColor: [r, g, b]`, producing matching colored PDF tables.
* **Technical Constraints & Risks:**
  - Auto-contrast rule: If a dark background is applied (e.g. `#1e293b`), cell text must automatically compile as white vector text in the PDF to prevent illegibility.

---

### Feature TBL-02: Table Border Width, Style & Color Customization
* **Priority:** **Must Have**
* **User Story:**
  > *As a user creating clean proposals, I want to customize table gridlines (minimalist, colored, or borderless) to match my document design.*
* **Acceptance Criteria:**
  1. Table settings menu provides border options:
     - **Gridline Visibility:** `All Borders`, `Outer Border Only`, `Horizontal Dividers Only`, `Borderless`.
     - **Border Color:** Color picker with theme presets.
     - **Border Width:** `Hairline (0.5pt)`, `Standard (1pt)`, `Heavy (2pt)`.
  2. Canvas table updates CSS custom properties (`--table-border-color`, `--table-border-width`, `--table-border-style`).
  3. Exported PDF translates settings into `jspdf-autotable` options:
     - `tableLineWidth: widthInPoints`
     - `tableLineColor: [r, g, b]`
     - Row divider hooks for horizontal-only grids.
* **Technical Constraints & Risks:**
  - `jspdf-autotable` handles cell borders via hook callbacks; must pass custom cell border options via `didDrawCell` or table theme options.

---

## Phase C: PDF Ingestion Fidelity, Scanned Workflow & Mobile Ergonomics

### Feature IMP-01: Enhanced Text-Based PDF Structural Ingestion
* **Priority:** **Must Have**
* **User Story:**
  > *As a user importing existing digital PDFs, I want headings, paragraphs, and bullet points to be accurately identified so that the document is immediately ready for editing without manual restructuring.*
* **Acceptance Criteria:**
  1. Statistical Font Size Clustering:
     - Analyzes font size distribution across all pages to establish the lower median body font size ($S_{body}$).
     - Automatically classifies text lines into reflowable blocks:
       - $S \ge 1.6 \times S_{body} \to \text{Heading 1}$
       - $1.25 \times S_{body} \le S < 1.6 \times S_{body} \to \text{Heading 2}$
       - $1.1 \times S_{body} \le S < 1.25 \times S_{body} \to \text{Heading 3}$
       - $S \le S_{body} \to \text{Paragraph}$
  2. Bullet & Numbered List Ingestion:
     - Detects standard bullet glyphs (`•`, `–`, `*`, `○`, `\u2022`) and regex number patterns (`^\d+[\.\)]\s+`).
     - Converts lines into native Tiptap `bulletList` and `orderedList` AST blocks, stripping raw bullet glyphs from text nodes.
  3. Paragraph Line Merging:
     - Detects soft line wraps within paragraphs and stitches broken lines into single reflowable strings, preserving intentional blank-line paragraph breaks.
* **Technical Constraints & Risks:**
  - PDF coordinate space: PDF text extraction returns discrete string chunks with bounding boxes, not semantic tags. Heuristics must handle varying DPI coordinates without splitting words.

---

### Feature IMP-02: PDF Text Color Preservation
* **Priority:** **Nice to Have**
* **User Story:**
  > *As a user importing branded PDFs, I want colorful titles and highlighted warnings in the original document to retain their colors in the editor.*
* **Acceptance Criteria:**
  1. PDF.js text item operator inspection extracts active RGB fill colors from the graphic state (`state.fillColor`).
  2. Maps distinct colors to inline `textStyle` color marks on the extracted AST text nodes.
  3. Default black/dark-gray text ($RGB \approx (0,0,0)$) is normalized to standard `--color-text-primary` to avoid dark mode contrast bugs.
* **Technical Constraints & Risks:**
  - PDF color spaces include RGB, CMYK, Grayscale, and Spot colors. Parser must normalize all color representations to standard 6-character Hex strings (`#RRGGBB`).

---

### Feature IMP-03: Basic Tabular Grid Detection & Reconstruction
* **Priority:** **Nice to Have**
* **User Story:**
  > *As a user importing invoices or financial summaries, I want simple tables in the PDF to convert into editable table blocks rather than jumbled text lines.*
* **Acceptance Criteria:**
  1. Detection Heuristic: Scans for 3 or more consecutive lines sharing identical horizontal X-coordinate columns ($\ge 2$ columns with consistent alignment).
  2. Groups aligned text tokens into rows and columns, constructing a structured `table` block in the document AST.
  3. The first row is assigned as `tableHeader` if font weight or capitalization indicates a header.
  4. If alignment is ambiguous or irregular, gracefully falls back to formatted tab-separated paragraphs rather than creating broken or overlapping table grids.
* **Technical Constraints & Risks:**
  - PDF tables have no semantic grid metadata; they are simply text strings floating near vector line rectangles. Multi-line table cell wrapping is notoriously difficult to reconstruct without OCR layout engines. Tagged as **Nice to Have**.

---

### Feature IMP-04: Scanned PDF Honest Notification & Review Gate
* **Priority:** **Must Have**
* **User Story:**
  > *As a user uploading a scanned paper document, I want an honest explanation that the PDF contains only images so that I understand why text cannot be edited and my original file is never corrupted.*
* **Acceptance Criteria:**
  1. Automatically detects scanned/image-only PDFs ($< 50$ extractable characters across document).
  2. Import Review Modal displays high-visibility alert card:
     - Status: `Scanned or Image-Based Document Detected`.
     - Explanation: *"This document contains scanned images with no extractable text layer. OCR conversion will be introduced in an upcoming release."*
  3. The "Open in Editor" button is **safely hidden** to prevent creating blank, broken, or uneditable documents.
  4. The original PDF file is completely untouched and preserved.
  5. Provides immediate "Choose Different File" or "Close" actions.
* **Technical Constraints & Risks:**
  - Handled cleanly in `PdfClassifier.ts`; must maintain rigorous automated tests against real image-only fixtures (`test_scanned.pdf`).

---

### Feature MOB-01: Touch-Optimized Color & Slider Controls ($44\text{px}$)
* **Priority:** **Must Have**
* **User Story:**
  > *As a user on a tablet or smartphone, I want color swatches, buttons, and sliders to be easy to tap with my fingers without accidentally triggering adjacent controls.*
* **Acceptance Criteria:**
  1. All toolbar buttons, modal selectors, and color swatches adhere to WCAG 2.1 AA touch target standards: minimum **$44 \times 44\text{ px}$** bounding hit-box.
  2. Color pickers on mobile open in a comfortable bottom-sheet drawer instead of small desktop dropdown popovers.
  3. Sliders for border width and image resizing have visible numeric value readouts and tactile touch thumbs ($28\text{px}$ diameter).
* **Technical Constraints & Risks:**
  - CSS safe-area insets (`env(safe-area-inset-bottom)`) must be respected on mobile iOS/Android devices to avoid touch collisions with system home bars.

---

### Feature MOB-02: Mobile Viewport Safety & Virtual Keyboard Caret Dock
* **Priority:** **Must Have**
* **User Story:**
  > *As a mobile user typing in the editor, I want the formatting toolbar to stay accessible and my typing cursor to remain visible above the software keyboard.*
* **Acceptance Criteria:**
  1. Page meta tag includes `interactive-widget=resizes-content, viewport-fit=cover`.
  2. When the virtual keyboard appears, the document canvas shrinks dynamically without causing whole-page horizontal scrolling.
  3. The formatting toolbar transforms into a compact, horizontally scrolling accessory bar pinned directly above the software keyboard.
  4. When typing near the bottom of a sheet, the editor canvas automatically scrolls the active cursor into view with at least $32\text{px}$ clearance above the keyboard toolbar.
  5. Pinch-to-zoom is enabled exclusively on the canvas sheet, while disabled on toolbars and modal dialogs.
* **Technical Constraints & Risks:**
  - Android Chrome vs. iOS Safari handle virtual keyboard resizing differently; testing across both WebKit and Blink mobile viewports is mandatory.

---

## Explicit Non-Goals (Future Milestones)

To keep PDFirst reliable, lightweight, and focused on its core reflowable PDF mission, the following capabilities are explicitly declared as **Non-Goals** for this roadmap:

1. **Full Microsoft Word (.docx) Reverse Engineering:**
   PDFirst is not an office suite clone. We will not parse proprietary OpenXML binary schemas, complex drawing shapes, or VBA macros.
2. **Complex Nested Tables & Mathematical Formulas:**
   No tables-within-tables, arbitrary multi-axis cell splitting, or dynamic spreadsheet math calculation engines ($=SUM()$).
3. **Multi-User Collaboration, Comments & Track Changes:**
   No real-time multiplayer WebSockets, operational transforms, margin comment threads, or markup redlining. The app is dedicated to focused personal authoring.
4. **Digital Signature Sealing & Cryptographic PKI:**
   No X.509 digital certificates, smart-card signing, or encrypted PDF password protection.
5. **Server-Side OCR Dependencies:**
   No third-party cloud vision API dependencies (AWS Textract, Google Cloud Vision, Azure OCR) that compromise user privacy or require remote server infrastructure. (Client-side WASM OCR remains an optional future milestone per `product.md` Section 5.4).

---

## Phased Implementation Execution Order

```
[ Phase A: Typography, Pages & Clipboard ]
  ├── RT-01: Text Color Picker (Presets + Hex)
  ├── RT-02: Text Highlight / Background Color
  ├── PG-01: Manual Page Break & Visual Page Sheets
  ├── PG-02: Document Page Settings Consistency
  ├── CP-01: Formatted Rich Text Copy-Paste
  └── CP-02: Direct Clipboard Image Paste & Duplication
                 │
                 ▼
[ Phase B: Media, Borders & Tables ]
  ├── IMG-01: Multi-Source Image Insertion (URL + Upload)
  ├── IMG-02: Broken / Invalid Image Fallback State
  ├── IMG-03: Visual Resize Handles, Alignment & Captions
  ├── IMG-04: Client-Side Rectangular Crop UI
  ├── IMG-05: Image Text Wrap Modes (Nice to Have)
  ├── BLK-01: Block Border Controls (Width, Style, Color)
  ├── TBL-01: Table Header & Cell Background Fills
  └── TBL-02: Table Border Width, Style & Color Customization
                 │
                 ▼
[ Phase C: PDF Ingestion Fidelity & Touch Ergonomics ]
  ├── IMP-01: Enhanced Text PDF Structural Ingestion
  ├── IMP-02: PDF Text Color Preservation (Nice to Have)
  ├── IMP-03: Basic Tabular Grid Detection (Nice to Have)
  ├── IMP-04: Scanned PDF Honest Notification & Review Gate
  ├── MOB-01: Touch-Optimized Color & Slider Controls (44px)
  └── MOB-02: Mobile Viewport Safety & Virtual Keyboard Caret Dock
```

---

*This document represents the single source of truth for all post-MVP development on PDFirst. No feature outside this specification will be implemented without explicit architectural review.*
