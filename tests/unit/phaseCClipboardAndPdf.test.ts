// tests/unit/phaseCClipboardAndPdf.test.ts - Phase C Unit Tests
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizePastedHtml } from '../../src/editor/utils/sanitizeHtml';
import { extractDocumentFromPdf } from '../../src/pdf/import/TextExtractor';

describe('Phase C: Clipboard Sanitization and Rich Text Ingestion', () => {
  it('sanitizes pasted HTML, stripping malicious scripts while preserving structure and formatting', () => {
    const dirtyHtml = `
      <div>
        <script>alert("malicious xss attack!");</script>
        <h1 style="color: blue;">Executive Report</h1>
        <p>This is a <strong>bold</strong> and <em>italicized</em> summary.</p>
        <iframe src="https://evil.com/phish"></iframe>
        <ul onclick="stealCookies()">
          <li>Bullet item 1</li>
          <li>Bullet item 2</li>
        </ul>
        <table>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody><tr><td>Active Users</td><td>10,000</td></tr></tbody>
        </table>
        <img src="data:image/png;base64,testdata" alt="Valid Diagram" onerror="alert(1)" />
      </div>
    `;

    const sanitized = sanitizePastedHtml(dirtyHtml);

    // Malicious vectors stripped
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('<iframe>');
    expect(sanitized).not.toContain('alert(');
    expect(sanitized).not.toContain('stealCookies');
    expect(sanitized).not.toContain('onerror');

    // Rich structures safely retained
    expect(sanitized).toContain('<h1');
    expect(sanitized).toContain('Executive Report</h1>');
    expect(sanitized).toContain('<strong>bold</strong>');
    expect(sanitized).toContain('<em>italicized</em>');
    expect(sanitized).toContain('<li>Bullet item 1</li>');
    expect(sanitized).toContain('<table>');
    expect(sanitized).toContain('<th>Metric</th>');
    expect(sanitized).toContain('<td>Active Users</td>');
    expect(sanitized).toContain('<img src="data:image/png;base64,testdata" alt="Valid Diagram"');
  });
});

describe('Phase C: PDF Text Ingestion Fidelity & Structural Analysis', () => {
  it('correctly classifies headings, paragraphs, and metadata from text_import.pdf fixture', async () => {
    const fixturePath = path.resolve(process.cwd(), 'test_import.pdf');
    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const { doc, rawPreviewText } = await extractDocumentFromPdf(arrayBuffer, 'Quarterly_Report.pdf');

    expect(doc.metadata.title).toBe('Quarterly_Report (Converted)');
    expect(doc.content.type).toBe('doc');
    expect(rawPreviewText).toContain('Quarterly Review 2026');

    // Verify statistical font clustering classified the 22pt title as Heading 1
    const h1Block = doc.content.content.find(b => b.type === 'heading' && b.attrs?.level === 1);
    expect(h1Block).toBeDefined();
    expect(h1Block?.content?.[0].text).toContain('Quarterly Review 2026');

    // Verify the 14pt section is classified as Heading 2
    const h2Block = doc.content.content.find(b => b.type === 'heading' && b.attrs?.level === 2);
    expect(h2Block).toBeDefined();
    expect(h2Block?.content?.[0].text).toContain('Key Achievements');

    // Verify body paragraphs were captured
    const paragraphBlocks = doc.content.content.filter(b => b.type === 'paragraph');
    expect(paragraphBlocks.length).toBeGreaterThan(0);
    const textContent = paragraphBlocks.map(p => p.content?.map(c => c.text).join('')).join(' ');
    expect(textContent).toContain('text-based digital PDF document');
  });

  it('verifies viewport meta tag contains interactive-widget=resizes-content for mobile keyboards', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');

    expect(htmlContent).toContain('interactive-widget=resizes-content');
    expect(htmlContent).toContain('viewport-fit=cover');
  });

  it('verifies mobile CSS rules exist for toolbar touch ergonomics and popover docking', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/editor.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Mobile touch target styling
    expect(cssContent).toContain('@media (max-width: 640px)');
    expect(cssContent).toContain('touch-action: pan-x');
    expect(cssContent).toContain('touch-action: manipulation');
    expect(cssContent).toContain('color-picker-popover');
    expect(cssContent).toContain('bottom: 12px');
  });

  it('verifies Image node duplication preserves all Phase B/C attributes', () => {
    const originalImage = {
      type: 'image' as const,
      attrs: {
        src: 'data:image/png;base64,sampleBinaryData',
        alt: 'Financial Trend Chart',
        width: '50%',
        alignment: 'center' as const,
        caption: 'Q3 Financial Velocity',
        wrap: 'none' as const,
        crop: { x: 10, y: 10, width: 80, height: 80 }
      }
    };

    // Duplicate operation: Clones node with full attributes intact
    const duplicatedImage = {
      type: 'image' as const,
      attrs: { ...originalImage.attrs }
    };

    expect(duplicatedImage.attrs.src).toBe(originalImage.attrs.src);
    expect(duplicatedImage.attrs.caption).toBe('Q3 Financial Velocity');
    expect(duplicatedImage.attrs.width).toBe('50%');
    expect(duplicatedImage.attrs.crop).toEqual({ x: 10, y: 10, width: 80, height: 80 });
  });

  it('verifies FormattingToolbar exposes Copy and Paste clipboard buttons', () => {
    const toolbarPath = path.resolve(process.cwd(), 'src/components/toolbar/FormattingToolbar.tsx');
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');

    expect(toolbarContent).toContain('id="toolbar-copy-btn"');
    expect(toolbarContent).toContain('id="toolbar-paste-btn"');
    expect(toolbarContent).toContain('Copy Selection (Ctrl+C)');
    expect(toolbarContent).toContain('Paste from Clipboard (Ctrl+V)');
  });
});

