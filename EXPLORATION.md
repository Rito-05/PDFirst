# PDFirst — Project Exploration Report

**Date:** September 6, 2026  
**Document:** `EXPLORATION.md`  
**Status:** Awaiting User Approval  

---

## 1. Executive Summary

**PDFirst** is designed as a focused, intuitive document creation and editing application tailored for non-technical users. It addresses a common user pain point: traditional PDF editors are rigid, cumbersome, and treat PDFs as fixed vector coordinate sheets rather than readable, reflowable documents.

**Fundamental Architectural Rule:**
- **Source of Truth:** An internal, reflowable, structured document model (JSON AST).
- **Output Target:** High-quality, professional PDF documents generated from that internal model.
- **Import Philosophy:** Imported PDFs are parsed and mapped into the internal structured document model on a best-effort basis, with explicit categorization and expectation management. The PDF is **never** used directly as the internal editing format.

---

## 2. Current Workspace Inspection

An initial inspection of `c:\Users\ritol\OneDrive\Desktop\PDFirst` revealed the following state:

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Existing Files / Folders** | None | The workspace directory is completely empty. |
| **Framework & Package Manager** | None | No `package.json`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), or configs exist. |
| **Frontend Application** | Not present | No UI framework, bundler, or web app scaffold initialized. |
| **Backend / API** | Not present | No server-side code or API layer configured. |
| **Database** | Not present | No database or local schema defined. |
| **Test Suite** | Not present | No test runners (Vitest, Jest, Playwright) configured. |
| **Design System** | Not present | No CSS styling, design tokens, or component libraries exist. |
| **Documentation** | Not present | The requirements in the prompt are the first documented project specifications; no prior briefs or specs exist in the repository. |

---

## 3. Core Product Boundaries & PDF Taxonomy

To prevent non-technical users from expecting unrealistic "1:1 pixel-perfect reverse engineering" of arbitrary PDFs, the system establishes clear boundaries:

### 3.1 PDF Import Classification
All external PDF imports are categorized into one of three distinct classes upon ingestion:

1. **Text-Based PDFs (Standard Digital Documents):**
   - *Characteristics:* Contains extractable digital text streams, standard fonts, paragraphs, and headings.
   - *Strategy:* Parse text streams and basic structures (using tools like `pdfjs-dist`), map them into internal document blocks (headings, paragraphs, lists), and present them in the reflowable editor.
2. **Scanned / Image-Only PDFs (OCR Required):**
   - *Characteristics:* Pages are flattened raster images without embedded character streams.
   - *Strategy:* Detect image-heavy/scanned pages. For the first MVP, **this pipeline is mocked/stubbed** with clear UI feedback informing the user that OCR conversion is scheduled for subsequent phases.
3. **Complex Layout PDFs:**
   - *Characteristics:* Multi-column magazines, brochure-style floating graphics, intricate forms, or non-linear layouts.
   - *Strategy:* Extract linear content in a best-effort stream into clean document sections. Provide an in-app notice that complex vector positioning is simplified into a reflowable layout for effortless editing and clean re-exporting.

---

## 4. Recommended Implementation Approach

### 4.1 Architecture Overview
A modern, responsive, local-first web application:

```
[ PDF Import ] ──> [ PDF Classifier & Parser ] ──┐
                                                 ▼
[ New Document ] ─────────────────────────> [ Document Store ]
                                                 │
                                                 ▼
                                     [ Reflowable Editor (AST) ]
                                                 │
                                                 ▼
                                     [ PDF Generation Engine ] ──> [ Exported PDF ]
```

### 4.2 Recommended Tech Stack
- **Runtime / Bundler:** React 19 / 18 with **Vite** and **TypeScript** for fast development, type safety, and clean modular architecture.
- **Styling / Design System:** Modern Vanilla CSS / CSS Modules with custom design tokens (dark/light theme, typography, spacing, elevations, glassmorphism, responsive controls) adhering to high-end design aesthetics without bulky external dependencies.
- **Document Engine / Editor:**
  - Headless structured text engine such as **Tiptap (ProseMirror)** or **Lexical**.
  - *Rationale:* Naturally maintains a JSON-based Abstract Syntax Tree (AST), provides reflowable content blocks (headings, paragraphs, lists, blockquotes, tables, dividers), and cleanly separates content representation from presentation.
- **PDF Generation Engine:**
  - Client-side structured generation via **`@react-pdf/renderer`** or **`pdfmake`**.
  - *Rationale:* Generates high-fidelity vector PDFs directly from the internal document AST with precise control over margins, page breaks, typography, headers, and footers, completely avoiding blurry HTML-canvas screen captures.
- **PDF Ingestion / Extraction:**
  - Client-side parsing using **`pdfjs-dist`**.
  - Extracts text layers, font styles, and page bounds to reconstruct readable paragraph blocks.
- **Persistence (MVP):**
  - Local-first storage using **IndexedDB** (via `idb` or local state storage) so documents persist reliably across sessions without requiring early backend infrastructure.

---

## 5. Risks and Unknowns

1. **User Expectation Gap Regarding PDF Fidelity:**
   - *Risk:* Users often confuse a "reflowable document editor" with an Adobe Acrobat vector coordinate modifier.
   - *Mitigation:* Explicit in-app messaging on import explaining that PDFirst converts files into clean, editable documents optimized for professional re-exporting.
2. **Page-Break Parity (Editor vs. PDF Output):**
   - *Risk:* Content flow on a fluid web canvas differs from fixed A4/Letter print dimensions.
   - *Mitigation:* Implement a "Page Preview" mode or paginated editor view showing real-time page breaks and margins based on the chosen print format.
3. **Complex PDF Text Extraction Order:**
   - *Risk:* Multi-column text in raw PDFs can sometimes be read horizontally across columns rather than vertically down each column.
   - *Mitigation:* Employ bounding-box spatial clustering during PDF text stream extraction to group text into correct column sequences.
4. **Font Licensing & Embedding:**
   - *Risk:* Exported PDFs must look crisp and render correctly on any viewer or operating system without missing glyphs.
   - *Mitigation:* Bundle standard open-source typography (e.g., Inter, Roboto Serif, JetBrains Mono) directly into the PDF compilation engine.

---

## 6. MVP Scope & Mocked Components

To deliver a working, high-quality product swiftly while adhering to product constraints:

| Component | MVP Status | Implementation Strategy |
| :--- | :--- | :--- |
| **Document Editor** | **Core Implementation** | Rich, reflowable block editor with formatting (headings, lists, bold/italic, alignment). |
| **Internal Document Model** | **Core Implementation** | JSON AST representation as single source of truth. |
| **PDF Export** | **Core Implementation** | Deterministic vector PDF generation compiled from AST (page numbers, margins, clean typography). |
| **Text-Based PDF Import** | **Core Implementation** | Ingestion of standard text PDFs into editable document blocks. |
| **Scanned / OCR PDF Import** | **Mocked / Stubbed** | Detection of image-only pages; displays an informative modal/banner explaining OCR processing is in development, offering sample extracted text. |
| **Complex Layout Ingestion** | **Simplified / Best-Effort** | Flattens multi-column content into linear reflowable sections with a user notice. |
| **User Accounts & Cloud Sync** | **Mocked / Local** | Local-first storage via IndexedDB; mock user profile settings. |
| **Backend Services** | **Deferred** | Zero backend required for initial MVP; full client-side processing keeps zero API costs and high privacy. |

---

## 7. Open Questions for Approval

Before initializing the workspace and scaffold, please confirm:

1. **Project Tooling:** Are you comfortable using **React + TypeScript + Vite** for the frontend application?
2. **Editor Framework:** Do you have a preference between **Tiptap (ProseMirror)** or **Lexical** for the internal document model, or should we proceed with the recommended Tiptap stack?
3. **Default Export Standard:** Should the default PDF output format be standard **A4** or **US Letter** (with switchable settings in the document options)?
4. **Initial Scaffolding Approval:** May we proceed to initialize the project structure (package manager setup, dependencies, and core directories) once this report is reviewed?
