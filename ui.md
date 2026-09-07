# PDFirst — UI & Design System Specification

**Document Version:** 1.0.0  
**Status:** Source of Truth  
**Target Milestone:** MVP  

---

## 1. Visual Design Direction

PDFirst features a **modern, minimalist, distraction-free document editing workspace**. The user interface emphasizes high visual polish, crisp typography, and quiet elegance:

- **Surface Philosophy:** Neutral, layered surfaces with subtle micro-borders (`1px solid var(--color-border)`) and soft ambient shadows to separate the floating document sheet from the application frame.
- **Glassmorphism & Depth:** Translucent backdrops (`backdrop-filter: blur(12px)`) on floating toolbars, dropdowns, and modals to maintain visual context without clutter.
- **Micro-Interactions:** Snappy, delightful transitions (150ms–200ms cubic-bezier) on button hover states, modal entries, toggle switches, and autosave indicators.
- **Clarity over Complexity:** Controls are organized into distinct functional zones. The canvas looks and feels like a physical sheet of premium paper resting on a tailored workbench.

---

## 2. Color System & Design Tokens

The application supports seamless **Light** and **Dark** themes governed by CSS Custom Properties on the `:root` element.

### 2.1 Color Tokens Specification

| Token Name | Light Theme Value | Dark Theme Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--color-bg-app` | `#f8fafc` (slate-50) | `#0b0f17` (obsidian-950) | Main application background behind the canvas |
| `--color-bg-surface` | `#ffffff` (white) | `#131926` (surface-900) | Toolbars, sidebars, cards, headers |
| `--color-bg-surface-elevated`| `#ffffff` (white) | `#1c2436` (surface-800) | Modals, popovers, dropdown menus |
| `--color-bg-canvas` | `#ffffff` (pure white) | `#171e2e` (paper-dark) | Document page sheet background |
| `--color-border-subtle` | `#e2e8f0` (slate-200) | `#232d42` (slate-800) | Dividers, subtle item separators |
| `--color-border-strong` | `#cbd5e1` (slate-300) | `#334155` (slate-700) | Focused inputs, toolbar borders, sheet edges |
| `--color-text-primary` | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) | Primary headings, document text |
| `--color-text-secondary` | `#475569` (slate-600) | `#94a3b8` (slate-400) | Subtitles, labels, toolbar icons |
| `--color-text-muted` | `#94a3b8` (slate-400) | `#64748b` (slate-500) | Timestamps, placeholders, inactive hints |
| `--color-brand-primary` | `#2563eb` (blue-600) | `#3b82f6` (blue-500) | Primary actions, export buttons, active toggles |
| `--color-brand-hover` | `#1d4ed8` (blue-700) | `#60a5fa` (blue-400) | Hover state for primary buttons |
| `--color-brand-subtle` | `#eff6ff` (blue-50) | `rgba(59, 130, 246, 0.12)`| Active button background, selected block outline |
| `--color-accent` | `#0284c7` (sky-600) | `#38bdf8` (sky-400) | Selection highlight, links, active tab indicator |
| `--color-success` | `#10b981` (emerald-500)| `#34d399` (emerald-400)| Save complete indicator, verified status badge |
| `--color-warning` | `#f59e0b` (amber-500) | `#fbbf24` (amber-400) | Import fidelity warning, unsaved draft badge |
| `--color-danger` | `#ef4444` (red-500) | `#f87171` (red-400) | Delete actions, error messages, broken imports |
| `--color-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | Buttons, subtle controls |
| `--color-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, dropdown menus |
| `--color-shadow-sheet` | `0 12px 32px -4px rgba(15,23,42,0.1), 0 4px 8px -2px rgba(15,23,42,0.05)` | `0 16px 36px -4px rgba(0,0,0,0.6)` | Floating document sheet elevation |

---

## 3. Typography System

The typography is built on a clean dual-font hierarchy:
- **UI Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` for chrome, menus, buttons, and metadata.
- **Document Content Font Family (Switchable):**
  - **Modern Sans (Default):** `'Inter', sans-serif`
  - **Editorial Serif:** `'Merriweather', Georgia, serif`
  - **Technical Mono:** `'JetBrains Mono', monospace`

### 3.1 Type Scale Tokens

| Token | Size (px / rem) | Weight | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| `--font-doc-h1` | 32px / 2.0rem | 700 (Bold) | 1.25 | Main Document Title / H1 Heading |
| `--font-doc-h2` | 24px / 1.5rem | 600 (Semibold) | 1.3 | Major Section Headings |
| `--font-doc-h3` | 18px / 1.125rem | 600 (Semibold) | 1.4 | Subsections |
| `--font-doc-body` | 15px / 0.9375rem | 400 (Regular) | 1.65 | Standard Body Paragraphs |
| `--font-doc-caption`| 12px / 0.75rem | 400 (Regular) | 1.5 | Image Captions, Table Footnotes |
| `--font-ui-title` | 16px / 1.0rem | 600 (Semibold) | 1.2 | Modal headers, Document Title in Bar |
| `--font-ui-base` | 14px / 0.875rem | 500 (Medium) | 1.4 | Toolbar buttons, dropdown items |
| `--font-ui-small` | 12px / 0.75rem | 500 (Medium) | 1.3 | Status badges, autosave timestamp, hints |
| `--font-ui-micro` | 10px / 0.625rem | 600 (Semibold) | 1.2 | Keyboard shortcut tags, small pill tags |

---

## 4. Spacing & Sizing Scale

A standardized 8-point geometric scale is employed throughout the design system:

| Token | Dimension | Common Use Cases |
| :--- | :--- | :--- |
| `--space-1` | 4px | Micro-gaps between badge icons and text |
| `--space-2` | 8px | Button internal padding (vertical), gap in button groups |
| `--space-3` | 12px | Dropdown menu padding, toolbar item gap |
| `--space-4` | 16px | Standard button horizontal padding, card content padding |
| `--space-5` | 20px | Sidebar section spacing, modal internal padding |
| `--space-6` | 24px | Document page sheet standard margins (compact) |
| `--space-8` | 32px | Document page sheet standard margins (normal) |
| `--space-12`| 48px | Page canvas outer gutter, wide page margins |
| `--space-16`| 64px | Empty state container vertical padding |

---

## 5. Layout Architecture

### 5.1 Desktop Layout Structure
The primary desktop editing workspace consists of four structured zones:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Header Bar: Logo | Doc Title Input | Save Status | Theme Toggle | Export │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Formatting Toolbar: Undo/Redo | Style Dropdown | B I U | Align | Insert  │
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ 3. Sidebar    │ 4. Document Canvas Workspace                │ 5. Properties │
│    (Left)     │                                             │    (Right)    │
│  - Outline    │     ┌─────────────────────────────────┐     │  - Page Size  │
│  - Thumbnails │     │ [Document Sheet - A4 / Letter]  │     │  - Margins    │
│  - History    │     │                                 │     │  - Headers    │
│               │     │ H1 Title                        │     │  - Word Count │
│  (Collapsible)│     │ Paragraph body text...          │     │ (Collapsible) │
│               │     │ [ Table or Image ]              │     │               │
│               │     │                                 │     │               │
│               │     └─────────────────────────────────┘     │               │
└───────────────┴─────────────────────────────────────────────┴───────────────┘
```

1. **Header Bar (Height: 56px):** Sticky top bar containing brand identity, inline editable document title, live saving status indicator, theme toggle switch, and primary action buttons ("Export PDF", "Import").
2. **Formatting Toolbar (Height: 44px):** Docked below the header bar; grouped with accessible pill dividers:
   - *History:* Undo, Redo.
   - *Hierarchy:* Paragraph / H1 / H2 / H3 dropdown.
   - *Inline Marks:* Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Strike.
   - *Lists & Blocks:* Bulleted List, Numbered List, Blockquote, Code Block.
   - *Alignment:* Left, Center, Right, Justify.
   - *Insert Objects:* Insert Image, Insert Table, Insert Page Break.
3. **Left Sidebar (Width: 260px, Collapsible):** Displays document structure outline, page thumbnail navigation, and quick jump points. Can be collapsed with a single click (`Ctrl+\`).
4. **Right Properties Sidebar (Width: 240px, Collapsible):** Page setup (A4 vs. US Letter), page orientation, margin presets (Normal, Compact, Wide), and live document telemetry (word count, reading time, page count).
5. **Main Document Canvas (Fluid Area):** Scrollable workspace containing the centered virtual sheet.

### 5.2 Mobile & Responsive Layout
- **Breakpoints:**
  - Desktop: `>= 1024px` (Full 3-column workspace with dual sidebars).
  - Tablet: `768px – 1023px` (Sidebars auto-collapse into off-canvas sliding drawers; toolbar shifts to horizontally scrollable bar).
  - Mobile: `< 768px` (Header simplifies to Title + Export button; formatting toolbar docks to the bottom above the virtual keyboard; document sheet fits 100% viewport width with comfortable touch padding).

---

## 6. Component Behavior & Interaction Specs

### 6.1 Document Canvas Behavior
- **Sheet Representation:** The document is visually presented as physical pages with standard print aspect ratios:
  - **A4:** `210mm x 297mm` (scaled to `794px x 1123px` at 96 DPI).
  - **US Letter:** `8.5in x 11in` (scaled to `816px x 1056px` at 96 DPI).
- **Page Break Visualization:** Continuous reflowable text flows with a subtle dotted dividing line and a discreet page indicator ("Page 1", "Page 2") showing where automatic PDF pagination will occur.
- **Canvas Zoom Control:** Docked in the bottom-right corner of the viewport: `50%`, `75%`, `100%`, `125%`, `150%`, and "Fit to Width".

### 6.2 Toolbar Behavior
- **Sticky Affordance:** Remains pinned to the top of the viewport when scrolling through multi-page documents.
- **Selection Synchronized:** Toolbar icons highlight immediately reflecting the active selection state (e.g., if cursor is on an H2 heading, the style selector shows "Heading 2" and Bold is highlighted if active).
- **Disabled States:** Undo/Redo visually dim when history stacks are empty.

### 6.3 Sidebar Behavior
- **Smooth Drawer Animation:** Expands and collapses in 200ms with no layout jitter on the main document sheet.
- **Outline Navigation:** Automatically generates an interactive table of contents from document H1, H2, and H3 blocks; clicking any entry scrolls the canvas directly to that block.

---

## 7. State Specifications

### 7.1 Empty States
- **Home Dashboard (No Documents):**
  - Illustration: Minimal vector icon of a clean document sheet.
  - Headline: *"Create your first document"*.
  - Subtext: *"Start from a clean slate or import a text-based PDF to edit."*
  - Actions: Primary button `btn-dashboard-new-doc` ("New Document"), Secondary button `btn-dashboard-import-pdf` ("Import PDF").
- **Blank Document Canvas:**
  - Title shows placeholder *"Untitled Document"*.
  - Body displays subtle placeholder prompt: *"Start typing your document, or press '/' for commands..."*

### 7.2 Loading States
- **Document Rehydration:** Subtle pulsing skeleton blocks matching the page margins while reading from IndexedDB.
- **PDF Import Processing:** Full-screen modal with animated progress bar:
  - *"Analyzing PDF structure..."*
  - *"Extracting text layers..."*
  - *"Reconstructing document blocks..."*
- **PDF Export Generating:** Spinner on the "Export PDF" button with text *"Compiling vector PDF..."* (button disabled during compilation).

### 7.3 Error States
- **Storage Write Failure:** Toast notification in top-right corner with amber warning icon:
  - *"Unable to save to browser storage. Your browser storage might be full."*
  - Action: "Download JSON Backup".
- **Corrupt File Import:** Modal alert:
  - Headline: *"Cannot Open PDF"*.
  - Body: *"This file is corrupted, password-protected, or not a valid PDF document."*
  - Action: "Try Another File".

### 7.4 Export Success State
- Upon successful PDF compilation:
  - File download initiates automatically via the browser.
  - Subtle floating confirmation toast appears for 4 seconds:
    - Icon: Green checkmark badge.
    - Message: *"Document exported successfully as [Title].pdf"*.
    - Quick actions: "Open Again", "Show in Folder".

### 7.5 PDF Import Review State (The Honesty Modal)
When an imported PDF contains formatting or scanned elements, an **Import Review Modal** is presented before committing content to the canvas:
- **Header:** Quality Inspection Summary.
- **Classification Badges:**
  - *Standard Text (Green):* "High Confidence — Reflowable Text Extracted".
  - *Complex Layout (Amber):* "Layout Simplified — Multi-column or graphic layout reflowed to single column".
  - *Scanned / Image-Only (Red/Amber):* "Scanned Document Detected — OCR is not yet active in this MVP".
- **Visual Callout:** Transparently lists what was preserved (text, headings, lists) and what was simplified (columns, custom backgrounds, floating vector shapes).
- **Preview Pane:** Scrollable preview showing the reconstructed reflowable text.
- **Decision Controls:**
  - `btn-import-confirm`: "Proceed to Editor"
  - `btn-import-cancel`: "Cancel Import"

---

## 8. Accessibility & Keyboard Navigation

- **WCAG Compliance:** All color combinations meet WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text and UI components).
- **Visible Focus Rings:** Every interactive element has a high-contrast focus indicator: `outline: 2px solid var(--color-brand-primary); outline-offset: 2px;`.
- **Keyboard Navigation:** Full Tab and Shift+Tab traversal across toolbar, sidebars, modal controls, and editor canvas.
- **Screen Reader Announcements:** Dynamic live region (`aria-live="polite"`) for autosave state transitions ("Saving document...", "Document saved").
- **Shortcut Registry:**
  - `Ctrl+S` / `Cmd+S`: Manual save trigger.
  - `Ctrl+P` / `Cmd+P` or `Ctrl+E`: Open PDF Export dialog.
  - `Ctrl+B` / `Cmd+B`: Toggle Bold.
  - `Ctrl+I` / `Cmd+I`: Toggle Italic.
  - `Ctrl+U` / `Cmd+U`: Toggle Underline.
  - `Ctrl+Z` / `Cmd+Z`: Undo.
  - `Ctrl+Y` / `Cmd+Shift+Z`: Redo.
  - `Ctrl+\`: Toggle Outline Sidebar.

---

## 9. Interactive Controls Catalog (IDs & ARIA Labels)

To support automated testing, accessibility auditing, and robust user interaction, all key interactive elements must implement the following unique IDs and ARIA labels:

### 9.1 Header & Global Controls
| Element ID | Tag | Accessible Label (`aria-label`) | Purpose |
| :--- | :--- | :--- | :--- |
| `app-header` | `<header>` | `"Application Header"` | Global navigation header |
| `doc-title-input` | `<input>` | `"Document Title"` | Inline editable document title |
| `save-status-indicator` | `<div>` | `"Document Save Status"` | Live autosave status badge |
| `theme-toggle-btn` | `<button>` | `"Toggle Light and Dark Theme"`| Theme switch |
| `btn-export-pdf-modal`| `<button>` | `"Export Document to PDF"` | Opens export modal |
| `btn-import-pdf` | `<button>` | `"Import PDF Document"` | Opens file picker for PDF |
| `btn-nav-dashboard` | `<button>` | `"Back to Documents Dashboard"`| Navigates to doc list |

### 9.2 Formatting Toolbar
| Element ID | Tag | Accessible Label (`aria-label`) | Purpose |
| :--- | :--- | :--- | :--- |
| `editor-toolbar` | `<nav>` | `"Text Formatting Toolbar"` | Formatting controls container |
| `toolbar-undo-btn` | `<button>` | `"Undo Last Action (Ctrl+Z)"` | Undo |
| `toolbar-redo-btn` | `<button>` | `"Redo Last Action (Ctrl+Y)"` | Redo |
| `toolbar-style-select` | `<select>` | `"Text Style Hierarchy"` | Paragraph / H1 / H2 / H3 |
| `toolbar-bold-btn` | `<button>` | `"Toggle Bold (Ctrl+B)"` | Bold |
| `toolbar-italic-btn` | `<button>` | `"Toggle Italic (Ctrl+I)"` | Italic |
| `toolbar-underline-btn`| `<button>`| `"Toggle Underline (Ctrl+U)"` | Underline |
| `toolbar-strike-btn` | `<button>` | `"Toggle Strikethrough"` | Strikethrough |
| `toolbar-bullet-list` | `<button>` | `"Bullet List"` | Unordered list |
| `toolbar-ordered-list`| `<button>` | `"Numbered List"` | Ordered list |
| `toolbar-quote-btn` | `<button>` | `"Blockquote"` | Quotation callout block |
| `toolbar-align-left` | `<button>` | `"Align Left"` | Left align text |
| `toolbar-align-center`| `<button>`| `"Align Center"` | Center align text |
| `toolbar-align-right` | `<button>` | `"Align Right"` | Right align text |
| `toolbar-insert-image`| `<button>` | `"Insert Image"` | Open image upload dialog |
| `toolbar-insert-table`| `<button>` | `"Insert Table"` | Insert 3x3 table grid |
| `toolbar-page-break` | `<button>` | `"Insert Page Break"` | Insert manual page divider |

### 9.3 Document Canvas & Sidebar
| Element ID | Tag | Accessible Label (`aria-label`) | Purpose |
| :--- | :--- | :--- | :--- |
| `document-canvas-container` | `<main>` | `"Document Canvas Workspace"` | Scrollable canvas container |
| `document-page-sheet` | `<article>`| `"Document Page Canvas"` | Virtual paper sheet container |
| `editor-content-editable` | `<div>` | `"Document Text Editor"` | Main contenteditable element |
| `sidebar-toggle-btn` | `<button>` | `"Toggle Document Outline Sidebar"` | Open/close outline |
| `sidebar-outline-panel` | `<aside>` | `"Document Outline"` | Structural navigation panel |
| `zoom-controls-container` | `<div>` | `"Canvas Zoom Settings"` | Zoom widget |
| `btn-zoom-in` | `<button>` | `"Zoom In"` | Increase canvas magnification |
| `btn-zoom-out` | `<button>` | `"Zoom Out"` | Decrease canvas magnification |
| `btn-zoom-reset` | `<button>` | `"Reset Zoom to 100%"` | Standard 100% view |

### 9.4 Modals & Dialogs
| Element ID | Tag | Accessible Label (`aria-label`) | Purpose |
| :--- | :--- | :--- | :--- |
| `modal-export-pdf` | `<dialog>` | `"Export PDF Configuration"` | PDF export settings dialog |
| `select-page-size` | `<select>` | `"Select PDF Page Size"` | Choose A4 or US Letter |
| `select-margins` | `<select>` | `"Select PDF Margins"` | Choose Normal, Compact, Wide |
| `toggle-page-numbers` | `<input>` | `"Include Page Numbers"` | Checkbox for footer numbers |
| `btn-confirm-download-pdf` | `<button>` | `"Download Vector PDF"` | Triggers PDF compilation |
| `btn-cancel-export-pdf`| `<button>` | `"Cancel Export"` | Closes export modal |
| `modal-import-review` | `<dialog>` | `"PDF Import Review Assessment"` | Import fidelity review dialog |
| `btn-import-confirm` | `<button>` | `"Confirm and Edit Document"` | Commits imported draft |
| `btn-import-cancel` | `<button>` | `"Cancel PDF Import"` | Discards imported draft |
