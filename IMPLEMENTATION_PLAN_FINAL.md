# PDFirst — Final Engineering Implementation Plan

**Document Version:** 1.0.0  
**Target:** Safe, Staged Rollout Beyond MVP  
**Status:** Approved Architectural Blueprint (Pending Implementation)  
**References:** [`FEATURE_SPEC_FINAL.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/FEATURE_SPEC_FINAL.md), [`product.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/product.md), [`ui.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/ui.md), [`engineering.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/engineering.md), [`E2E_CHECKLIST.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/E2E_CHECKLIST.md)

---

## 1. Executive Summary & Core Architectural Invariants

The goal of this implementation plan is to outline the exact technical execution strategy for expanding **PDFirst** from its verified MVP baseline into a production-grade personal document authoring platform.

Every phase and feature detailed in this plan strictly adheres to four unyielding architectural invariants:

1. **DocumentModel AST as Single Source of Truth:**
   All formatting (text colors, block borders, table styles, image crop regions, page breaks) must exist as declarative attributes within the reflowable JSON AST (`DocumentModel`). Neither exported PDFs nor external imported files are ever the internal editing state.
2. **Deterministic Dual Rendering (DOM Canvas $\longleftrightarrow$ Vector PDF):**
   No visual property may be added to the rich-text DOM canvas without an exact, verified vector compilation mapping in `PdfExporter.ts` (`jspdf` and `jspdf-autotable`).
3. **100% Local-First & Client-Side Execution:**
   All image cropping, color transformations, PDF vector compilation, and text extraction execute entirely client-side. Zero external backend servers, accounts, or paid cloud APIs.
4. **Zero Regression Against MVP Baseline:**
   All 7 core user flows verified in [`E2E_CHECKLIST.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/E2E_CHECKLIST.md) (document creation, rich formatting, table insertion, offline PWA storage, PDF export, honest scanned PDF rejection, text-based PDF conversion) must continue to pass throughout all phases.

---

## 2. Architecture Overview

### 2.1 Document Model (`DocumentModel` AST) Extensions

The core TypeScript interface [`DocumentModel`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/types/document.ts) and schema serializer [`documentSerializer.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/editor/schema/documentSerializer.ts) will be extended backward-compatibly.

```
DocumentModel (schemaVersion: 1)
  ├── metadata (id, title, timestamps, telemetry)
  ├── settings (PageSettings: size, orientation, margins, headers/footers)
  └── content (ProseMirror Doc Node)
        ├── Heading / Paragraph / Blockquote
        │     ├── attrs: { align, border?, backgroundColor? }
        │     └── marks: [bold, italic, textStyle(color), highlight(color), link]
        ├── PageBreak Node: { type: 'pageBreak', attrs: { id } }
        ├── Image Node: { type: 'image', attrs: { src, width, alignment, caption, wrap, cropRegion } }
        └── Table Node: { type: 'table', attrs: { borderStyle, borderWidth, borderColor } }
              └── TableRow -> TableCell / TableHeader
                    └── attrs: { backgroundColor?, colwidth? }
```

#### Detailed Attribute Schemas:

1. **Text Color & Highlight Marks:**
   - Handled via Tiptap's `@tiptap/extension-text-style`, `@tiptap/extension-color`, and `@tiptap/extension-highlight`.
   - Text color mark: `{ "type": "textStyle", "attrs": { "color": "#2563eb" } }`
   - Highlight mark: `{ "type": "highlight", "attrs": { "color": "#fef08a" } }`

2. **Block Borders & Backgrounds (Paragraphs, Blockquotes, Headings):**
   - Extended via a custom Tiptap extension `BlockBoxExtension`:
     ```typescript
     export interface BlockBoxAttrs {
       borderWidth?: number;          // 0, 1, 2, 4 (points/pixels)
       borderStyle?: 'solid' | 'dashed' | 'dotted';
       borderColor?: string;          // Hex #RRGGBB
       borderLeftOnly?: boolean;      // True for callout quote style
       backgroundColor?: string;      // Hex #RRGGBB
       padding?: number;              // Default 12
     }
     ```

3. **Table Cell Backgrounds & Grid Styles:**
   - Table node attributes:
     ```typescript
     export interface TableAttrs {
       borderWidth?: number;          // 0, 0.5, 1, 2
       borderColor?: string;          // Hex #RRGGBB
       borderGrid?: 'all' | 'outer' | 'horizontal' | 'none';
     }
     ```
   - TableCell & TableHeader node attributes:
     ```typescript
     export interface TableCellAttrs {
       backgroundColor?: string;      // Hex #RRGGBB
       colwidth?: number[];
     }
     ```

4. **Image Node Attributes:**
   - Extended image node schema:
     ```typescript
     export interface ImageNodeAttrs {
       src: string;                   // Base64 data URL or local object URL
       alt?: string;
       caption?: string;              // Editable text caption below image
       width?: number;                // Pixel width or percentage string (e.g. "50%")
       alignment?: 'left' | 'center' | 'right';
       wrap?: 'break' | 'left' | 'right';
       cropRegion?: {
         x: number;
         y: number;
         width: number;
         height: number;
       };
     }
     ```

5. **Explicit Page Breaks:**
   - New custom Tiptap Node `PageBreakNode`:
     ```typescript
     // Node definition: name: 'pageBreak', group: 'block', atom: true, selectable: true
     { "type": "pageBreak", "attrs": { "id": "pb_1726848000" } }
     ```

6. **Defensive Schema Migration (`validateAndMigrate`):**
   - Missing attributes automatically resolve to standard defaults. Existing documents without new attributes load cleanly with 100% backward compatibility.

---

### 2.2 Editor UI Component Hierarchy & Design System

The editor UI will integrate new controls into the existing component tree while strictly respecting the Design System defined in [`ui.md`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/ui.md):

```
App.tsx
 ├── HeaderBar.tsx (Title, Back, Save status, Export, Import)
 ├── FormattingToolbar.tsx
 │    ├── Text Styles (Bold, Italic, Underline, Strikethrough)
 │    ├── Heading Dropdown (Normal, H1, H2, H3)
 │    ├── Alignment (Left, Center, Right, Justify)
 │    ├── List Controls (Bullet, Numbered)
 │    ├── [NEW] TextColorPicker.tsx (Popover: 10 Presets + Hex input)
 │    ├── [NEW] HighlightColorPicker.tsx (Popover: 6 Pastels + Hex input)
 │    ├── [NEW] InsertPageBreakButton.tsx (Toolbar button + Ctrl+Enter)
 │    ├── InsertImageModal.tsx (Tabs: File Upload / Direct URL)
 │    └── Table Controls (Insert Table + Table Context Bar)
 ├── Main Layout Container (Flex row)
 │    ├── DocumentCanvas.tsx
 │    │     ├── [NEW] PageSheetContainer.tsx (Visual A4/Letter sheets with simulated shadows)
 │    │     │     ├── EditorCore.tsx (Tiptap ContentEditable)
 │    │     │     │     ├── [NEW] ImageNodeView.tsx (Resize handles, alignment pill, crop trigger)
 │    │     │     │     └── [NEW] PageBreakNodeView.tsx (Visual divider badge)
 │    │     │     └── [NEW] SheetDivider.tsx (Simulated page margins & pagination markers)
 │    └── PropertiesSidebar.tsx
 │          ├── Document Properties (Word, Char, Page telemetry)
 │          ├── Page Setup (A4/Letter, Portrait/Landscape, Margins)
 │          ├── [NEW] BlockBoxSidebarSection.tsx (Border width/style/color, background fill)
 │          └── [NEW] TableStylingSidebarSection.tsx (Table border grid, cell background fills)
 └── Modals
       ├── LinkModal.tsx
       ├── ExportPdfModal.tsx
       ├── ImportReviewModal.tsx
       ├── InsertImageModal.tsx
       ├── [NEW] ImageCropModal.tsx (Client-side HTML5 canvas rectangle crop)
       └── [NEW] MobileColorDrawer.tsx (Touch-friendly bottom sheet for mobile viewports)
```

#### Color Picker Component Architecture:
- To keep the app ultra-fast and avoid bulky NPM libraries, we will build a dedicated, zero-dependency `ColorPickerPopover.tsx` component:
  - Curated high-contrast palette swatches ($24 \times 24\text{px}$ touch targets).
  - Native `<input type="color">` trigger with synchronized 6-digit `#RRGGBB` text input.
  - "Reset / Clear Mark" button to strip the color attribute.
  - Popover positioning using floating coordinates with click-outside listener.

---

### 2.3 Clipboard & Copy-Paste Engine Architecture

To fulfill **CP-01** and **CP-02** seamlessly:

```
User Action: Ctrl+V / Cmd+V / Context Menu Paste
                 │
                 ▼
     [EditorCore.tsx: handlePaste]
                 │
   ┌─────────────┴────────────────────────┐
   ▼                                      ▼
[Clipboard contains Image?]          [Clipboard contains Text/HTML?]
   │                                      │
   ├─► Read item.getAsFile()              ├─► ProseMirror Parse & DOMPurify
   ├─► Check binary size ($>5\text{MB}$)   ├─► Filter unsafe tags (<script>, <iframe>)
   ├─► Client-side Canvas compression     ├─► Map valid tags (H1-H3, p, lists, tables)
   ├─► Convert to Base64 data URL         ├─► Preserve marks (bold, italic, color)
   └─► Insert Image Node at cursor        └─► Insert reflowable fragment at cursor
```

- **HTML Sanitization:** DOMPurify cleans external HTML before ProseMirror transforms it into document nodes.
- **Image Safeguard:** Pasted images exceeding $5\text{MB}$ are dynamically compressed to JPEG/WebP (max width $1920\text{px}$, quality $0.85$) using an offscreen canvas to prevent overwhelming IndexedDB storage quotas.

---

### 2.4 PDF Ingestion & Classification Pipeline

To fulfill **IMP-01**, **IMP-02**, **IMP-03**, and **IMP-04**:

```
Uploaded PDF File (ArrayBuffer)
          │
          ▼
   [PdfClassifier.ts]
          │
    Is Scanned? (<50 text characters across all pages)
    ├── YES ──► Route to ImportReviewModal.tsx (Scanned Alert Card)
    │           (Hide "Open in Editor"; preserve original file cleanly)
    │
    └── NO  ──► Text-Based PDF Extraction Pipeline
                  │
                  ▼
         [TextExtractor.ts]
                  │
                  ├── Step 1: Extract Text Items with (x, y, fontSize, fontName, transform)
                  ├── Step 2: Line Reconstruction & Y-bucket grouping (within 3pt tolerance)
                  ├── Step 3: Statistical Body Size ($S_{body}$) Calculation
                  │           └── Classify Heading 1 / Heading 2 / Heading 3 / Paragraph
                  ├── Step 4: List Item Heuristic (bullet glyphs •, –, * or \d+[\.\)])
                  ├── Step 5: Table Grid Heuristic (multi-column aligned X-coordinates)
                  ├── Step 6: Color Extraction (PDF operator graphic state RGB)
                  └── Step 7: Emit valid reflowable DocumentModel AST
```

---

### 2.5 Vector PDF Export Compilation Engine (`PdfExporter.ts`)

The vector PDF compiler in [`PdfExporter.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/pdf/export/PdfExporter.ts) will be updated to translate all new AST attributes into precise jsPDF drawing instructions:

1. **Text Color & Highlight Rendering:**
   ```typescript
   // Highlight vector fill (drawn BEFORE text glyphs to prevent occlusion)
   if (mark.type === 'highlight') {
     const [r, g, b] = hexToRgb(mark.attrs.color);
     pdf.setFillColor(r, g, b);
     pdf.rect(cursorX, cursorY - textHeight + 2, textWidth, textHeight, 'F');
   }
   // Text glyph vector painting
   if (mark.type === 'textStyle' && mark.attrs.color) {
     const [r, g, b] = hexToRgb(mark.attrs.color);
     pdf.setTextColor(r, g, b);
   }
   ```

2. **Block Border & Callout Box Rendering:**
   - When a paragraph, heading, or blockquote has `attrs.border`:
   - Calculate total block height (including text wrapping).
   - If `borderLeftOnly`: draw vector line `pdf.line(margins.left, cursorY, margins.left, cursorY + blockHeight)`.
   - If 4-sided border: draw `pdf.rect(margins.left, cursorY, contentWidth, blockHeight, 'S')` with specified `setLineWidth()` and `setDrawColor()`.
   - If `backgroundColor` present: render filled vector rect before text.

3. **Table Customization via `jspdf-autotable`:**
   - Map `attrs.borderColor` and `attrs.borderWidth` to `styles.lineColor` and `styles.lineWidth`.
   - Map cell-specific `attrs.backgroundColor` to `didParseCell` / `styles.fillColor`.
   - Automatically contrast text color to white if cell background luminance is $< 0.4$.

4. **Image Alignment, Wrap & Fallback:**
   - Calculate horizontal alignment offset:
     - Left: $X = margins.left$
     - Center: $X = margins.left + (contentWidth - imgWidth) / 2$
     - Right: $X = margins.left + contentWidth - imgWidth$
   - Wrapped in robust `try...catch`: if image fails to render, draw a light gray vector box with text `[Image: <alt>]` without throwing exceptions.

5. **Explicit Page Breaks:**
   - When block is `pageBreak`:
     ```typescript
     pdf.addPage(pageSize.toLowerCase() as 'a4' | 'letter', orientation);
     cursorY = margins.top;
     ```

---

## 3. Phased Implementation Plan

We will deliver the specification in three strictly ordered phases. Each phase will be independently verifiable and non-breaking.

---

### Phase A: Core Editing Enhancements (Typography, Borders & Table Styling)

**Focus:** Complete in-editor styling controls for typography, block callout borders, and table formatting, with full vector PDF export parity.

#### Features Included:
- **RT-01:** Text Color Picker (Presets + Hex).
- **RT-02:** Text Highlight / Background Color.
- **BLK-01:** Block Border Controls (Width, Style, Color, Left-Only callout) for paragraphs, blockquotes, and headings.
- **TBL-01:** Table Header & Cell Background Color Fills.
- **TBL-02:** Table Border Width, Style & Color Customization.

#### Files Created or Modified:
- `[MODIFY]` [`src/types/document.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/types/document.ts): Extend `TextMark`, `BlockBoxAttrs`, `TableAttrs`, `TableCellAttrs`.
- `[MODIFY]` [`src/editor/EditorCore.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/editor/EditorCore.tsx): Register `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extension-highlight`, and custom block attribute extension.
- `[NEW]` `src/components/toolbar/ColorPickerPopover.tsx`: Reusable, lightweight popover with 10 presets, native color picker, hex input, and clear button.
- `[MODIFY]` [`src/components/toolbar/FormattingToolbar.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/components/toolbar/FormattingToolbar.tsx): Add Text Color and Highlight buttons with popovers.
- `[NEW]` `src/components/sidebar/BlockBoxSection.tsx`: Border width, style, color, and background fill controls in the properties sidebar.
- `[NEW]` `src/components/sidebar/TableStylingSection.tsx`: Table gridlines, border stroke, and cell fill color controls.
- `[MODIFY]` [`src/components/sidebar/PropertiesSidebar.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/components/sidebar/PropertiesSidebar.tsx): Mount block and table styling sections dynamically based on editor selection.
- `[MODIFY]` [`src/pdf/export/PdfExporter.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/pdf/export/PdfExporter.ts): Vector compilation for text colors, highlights, block border rects, and table cell/border styles.
- `[MODIFY]` [`src/styles/global.css`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/styles/global.css): Canvas styling classes for bordered blocks and colored table cells.

#### Dependencies Evaluation:
- `@tiptap/extension-color`, `@tiptap/extension-highlight`, and `@tiptap/extension-text-style` are **already installed** in `package.json`.
- Zero new runtime NPM packages required. (Color picker is implemented with clean Vanilla React/CSS).

#### Testing Strategy:
- **Unit Tests:** `test/editor/colorPersistence.test.ts` (verifies text style marks serialize and deserialize cleanly in `DocumentModel`).
- **PDF Vector Tests:** `test/pdf/exportColorAndBorders.test.ts` (verifies `PdfExporter` calls `setTextColor`, `setFillColor`, and `rect` with expected RGB values).
- **Manual Verification:** Select text $\to$ apply color $\to$ export PDF $\to$ inspect vector text and background rectangles in PDF viewer.

#### Risks & Mitigations:
- *Risk:* Illegible text in Dark Mode if a user selects dark text colors.
  - *Mitigation:* In dark canvas mode, apply CSS `filter` or contrast thresholding to ensure readability on screen while preserving authentic print RGB for PDF export.

---

### Phase B: Image Architecture & Page Management

**Focus:** Complete media suite (upload, direct URL, resize, alignment, client-side crop, wrap) and true visual page sheets with explicit page breaks.

#### Features Included:
- **IMG-01:** Multi-Source Image Insertion (URL + File Upload).
- **IMG-02:** Broken / Invalid Image Fallback State.
- **IMG-03:** Visual Resize Handles, Alignment & Captions.
- **IMG-04:** Client-Side Rectangular Crop UI.
- **IMG-05:** Image Text Wrap Modes (Break Text, Float Left, Float Right).
- **PG-01:** Manual Page Break & Visual Page Sheets.
- **PG-02:** Document Page Settings Consistency (A4/Letter, Margins, Orientation).

#### Files Created or Modified:
- `[NEW]` `src/editor/extensions/PageBreakExtension.ts`: Custom Tiptap Node for manual page breaks (`Ctrl+Enter`).
- `[NEW]` `src/editor/extensions/CustomImageExtension.ts`: Extended image node with alignment, caption, wrap, and crop attributes.
- `[NEW]` `src/editor/views/ImageBlockView.tsx`: React NodeView for images featuring interactive corner resize handles, alignment context pill, caption input, and crop button.
- `[NEW]` `src/components/modals/ImageCropModal.tsx`: Client-side rectangular cropping modal using HTML5 Canvas with drag handles.
- `[MODIFY]` [`src/components/modals/InsertImageModal.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/components/modals/InsertImageModal.tsx): Add "Upload File" drag-and-drop tab alongside existing "Direct URL" tab.
- `[MODIFY]` [`src/components/canvas/DocumentCanvas.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/components/canvas/DocumentCanvas.tsx): Visual page sheet divider rendering (`.page-sheet`) reflecting real page dimensions and margin padding.
- `[MODIFY]` [`src/pdf/export/PdfExporter.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/pdf/export/PdfExporter.ts):
  - Handle `pageBreak` nodes (`pdf.addPage()`).
  - Calculate image horizontal alignment offsets (left, center, right).
  - Handle image text wrapping geometry.
  - Non-crashing image vector placeholder fallback on failed image loading.

#### Dependencies Evaluation:
- To keep the application 100% client-side and lightweight, image cropping will use standard HTML5 `<canvas>` 2D context rather than heavy external libraries like `cropperjs` or `react-image-crop`.
- Zero additional dependencies required.

#### Testing Strategy:
- **Unit Tests:** `test/editor/pageBreak.test.ts` (verifies page break node insertion and serialization).
- **Integration Tests:** `test/pdf/imageExportFallback.test.ts` (verifies corrupted image URLs render vector placeholder without throwing unhandled exceptions).
- **Manual Verification:** Insert image $\to$ resize to $50\%$ $\to$ align center $\to$ crop top $20\%$ $\to$ export PDF $\to$ verify dimensions and positioning.

#### Risks & Mitigations:
- *Risk:* Large Base64 images exhausting IndexedDB storage quotas.
  - *Mitigation:* Automatically downscale images $>1920\text{px}$ or $>5\text{MB}$ via canvas to JPEG quality 0.85 before committing to AST.
- *Risk:* Floating text wrap in jsPDF is mathematically complex.
  - *Mitigation:* Implement "Break Text" and simple Margin Float first; if line-splicing wrap encounters edge cases, safely fallback to block flow during PDF export.

---

### Phase C: Clipboard Engine, PDF Ingestion Fidelity & Mobile Ergonomics

**Focus:** Flawless clipboard paste (text formatting + images), intelligent structural PDF text ingestion, honest scanned-PDF review gate, and $44\text{px}$ touch-friendly mobile UI.

#### Features Included:
- **CP-01:** Formatted Rich Text Copy-Paste & HTML Sanitization (DOMPurify).
- **CP-02:** Direct Clipboard Image Paste & Duplication (`Ctrl+V`).
- **IMP-01:** Enhanced Text-Based PDF Structural Ingestion (Statistical font clustering, list detection, line stitching).
- **IMP-02:** PDF Text Color Preservation.
- **IMP-03:** Basic Tabular Grid Detection & Reconstruction.
- **IMP-04:** Scanned PDF Honest Notification & Review Gate.
- **MOB-01:** Touch-Optimized Color & Slider Controls ($44\text{px}$ hit boxes).
- **MOB-02:** Mobile Viewport Safety & Virtual Keyboard Caret Dock.

#### Files Created or Modified:
- `[MODIFY]` [`src/editor/EditorCore.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/editor/EditorCore.tsx): Add `handlePaste` interceptor for image files and sanitized HTML clipboard fragments.
- `[MODIFY]` [`src/pdf/import/TextExtractor.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/pdf/import/TextExtractor.ts):
  - Statistical font size clustering for H1/H2/H3/Paragraphs.
  - Regex and glyph list detection (`•`, `–`, `\d+\.`).
  - Coordinate column alignment heuristic for table reconstruction.
  - Graphic state operator fill color extraction.
- `[MODIFY]` [`src/pdf/import/PdfClassifier.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/pdf/import/PdfClassifier.ts): Scanned vs. text-based PDF boundary verification ($<50$ char threshold).
- `[MODIFY]` [`src/components/modals/ImportReviewModal.tsx`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/components/modals/ImportReviewModal.tsx): Visual scanned alert banner, safe review gate, and suppression of "Open in Editor" on scanned files.
- `[NEW]` `src/components/mobile/MobileAccessoryBar.tsx`: Horizontally scrolling toolbar pinned above mobile software keyboards.
- `[NEW]` `src/components/mobile/MobileBottomSheet.tsx`: Drawer for color pickers and page settings on mobile screens.
- `[MODIFY]` [`src/styles/global.css`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/styles/global.css): Mobile responsive touch target media queries ($44\text{px}$ minimums, `safe-area-inset` padding).
- `[MODIFY]` [`index.html`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/index.html): Update viewport meta for `interactive-widget=resizes-content, viewport-fit=cover`.

#### Dependencies Evaluation:
- `dompurify` is already available or can be added if needed for deep clipboard sanitization (`npm install dompurify @types/dompurify`), or we can use the browser's native `DOMParser` with strict tag allow-listing to avoid external dependencies.

#### Testing Strategy:
- **Unit Tests:** `test/pdf/clusteringExtractor.test.ts` (verifies font size clustering maps to correct heading levels and detects lists).
- **E2E & Mobile Tests:** Emulate mobile devices in Vitest/Playwright; verify $44\text{px}$ button hit areas and virtual keyboard viewport resizing.
- **Manual Verification:** Copy rich article from Wikipedia $\to$ paste $\to$ verify headings and lists preserved; take screenshot $\to$ press `Ctrl+V` $\to$ verify image inserted.

#### Risks & Mitigations:
- *Risk:* Browser clipboard API permissions blocking programmatic read on Safari/iOS.
  - *Mitigation:* Rely on standard browser `paste` DOM event (`e.clipboardData.items`), which has universal cross-browser permissions without requiring the async `navigator.clipboard.read()` prompt.

---

## 4. Cross-Phase Technical Reference Matrix

| Feature | DocumentModel Attribute | DOM Canvas Rendering | Vector PDF Mapping |
| :--- | :--- | :--- | :--- |
| **Text Color** | `marks: [{ type: 'textStyle', attrs: { color } }]` | CSS `color: var(...)` | `pdf.setTextColor(r, g, b)` |
| **Highlight** | `marks: [{ type: 'highlight', attrs: { color } }]` | CSS `background-color: var(...)` | `pdf.setFillColor(r, g, b); pdf.rect(...)` |
| **Block Border** | `attrs: { border: { width, style, color, leftOnly } }` | CSS `border: 2px solid ...; padding: 12px` | `pdf.setDrawColor(); pdf.line(...) / pdf.rect(...)` |
| **Table Cell Fill** | `attrs: { backgroundColor }` | CSS `background-color` on `<td>` | `jspdf-autotable` `didParseCell` `fillColor` |
| **Table Borders** | `attrs: { borderWidth, borderColor, borderGrid }` | CSS custom table borders | `jspdf-autotable` `styles.lineWidth, lineColor` |
| **Image Alignment** | `attrs: { alignment: 'left' \| 'center' \| 'right' }` | CSS `margin-left: auto; ...` | `pdf.addImage(src, format, alignedX, y, w, h)` |
| **Image Crop** | `attrs: { src: croppedBase64 }` | Direct image rendering | Direct vector image rendering |
| **Page Break** | Node `{ type: 'pageBreak' }` | Visual divider `── Page Break ──` | `pdf.addPage(size, orientation); cursorY = top` |

---

## 5. Compatibility Constraints & Non-Regression Guarantees

1. **Non-breaking AST Migrations:**
   The `validateAndMigrate` function in [`documentSerializer.ts`](file:///c:/Users/ritol/OneDrive/Desktop/PDFirst/src/editor/schema/documentSerializer.ts) ensures that older documents lacking new attributes (such as `border` or `caption`) will continue to open and save without errors or data loss.
2. **Offline & PWA Continuity:**
   All newly added components and styles are part of the static bundle. No external font CDNs or remote image proxies are required, preserving 100% offline functionality.
3. **Automated Test Suite Integrity:**
   The existing 17 test files and 66 test cases must remain green after each phase. Every phase will introduce new corresponding unit and integration tests.
4. **Mobile First-Class Usability:**
   No desktop-only mouse-hover interactions will be introduced. Every feature must have a direct, tap-friendly touch target ($44\text{px}$) accessible on phone screens.

---

*This document is the approved technical implementation roadmap. Development will proceed phase-by-phase upon explicit instruction.*
