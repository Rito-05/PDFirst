// src/editor/utils/sanitizeHtml.ts - Safe Client-Side HTML Sanitizer
import DOMPurify from 'dompurify';

const ALLOWED_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'hr', 'br',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img', 'figure', 'figcaption'
  ],
  ALLOWED_ATTRS: [
    'href', 'src', 'alt', 'title', 'width', 'height',
    'style', 'class', 'colspan', 'rowspan', 'target', 'rel'
  ]
};

/**
 * Sanitizes rich HTML pasted from external sources into the editor.
 * Strips executable scripts, iframes, and malicious attributes while
 * preserving legitimate document structures.
 */
export function sanitizePastedHtml(html: string): string {
  if (!html) return html;

  if (typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify.sanitize(html, ALLOWED_CONFIG);
  }

  if (typeof window !== 'undefined') {
    try {
      const purify = (DOMPurify as any)(window);
      if (typeof purify?.sanitize === 'function') {
        return purify.sanitize(html, ALLOWED_CONFIG);
      }
    } catch {
      // Fallback below
    }
  }

  // Safe fallback regex stripping dangerous elements
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, '');
}
