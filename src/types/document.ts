// src/types/document.ts - Internal Document Schema (Source of Truth)

export type PageSize = 'A4' | 'LETTER';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginPreset = 'normal' | 'compact' | 'wide';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export interface DocumentMargins {
  top: number;    // points
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  size: PageSize;
  orientation: PageOrientation;
  marginPreset: MarginPreset;
  margins: DocumentMargins;
  showPageNumbers: boolean;
  headerText?: string;
  footerText?: string;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: number;       // Unix timestamp ms
  updatedAt: number;       // Unix timestamp ms
  version: number;         // Schema version
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
  | 'tableHeader'
  | 'tableCell'
  | 'image'
  | 'blockquote'
  | 'horizontalRule'
  | 'codeBlock';

export interface TextMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'textStyle' | 'highlight';
  attrs?: Record<string, any>;
}

export interface InlineContent {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

export interface DocumentBlock {
  type: string;
  attrs?: Record<string, any>;
  content?: any[];
  text?: string;
  marks?: TextMark[];
}

export interface DocumentModel {
  schemaVersion: 1;
  metadata: DocumentMetadata;
  settings: PageSettings;
  content: {
    type: 'doc';
    content: DocumentBlock[];
  };
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  size: 'A4',
  orientation: 'portrait',
  marginPreset: 'normal',
  margins: {
    top: 54,
    right: 54,
    bottom: 54,
    left: 54
  },
  showPageNumbers: true,
  headerText: '',
  footerText: ''
};
