// src/editor/extensions/BlockBoxExtension.ts
import { Extension } from '@tiptap/core';

export const BlockBoxExtension = Extension.create({
  name: 'blockBox',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote'],
        attributes: {
          borderWidth: {
            default: null,
            parseHTML: element => {
              const val = element.getAttribute('data-border-width');
              return val ? parseInt(val, 10) : null;
            },
            renderHTML: attributes => {
              if (!attributes.borderWidth) return {};
              return { 'data-border-width': attributes.borderWidth };
            }
          },
          borderStyle: {
            default: 'solid',
            parseHTML: element => element.getAttribute('data-border-style') || 'solid',
            renderHTML: attributes => {
              if (!attributes.borderWidth) return {};
              return { 'data-border-style': attributes.borderStyle || 'solid' };
            }
          },
          borderColor: {
            default: '#2563eb',
            parseHTML: element => element.getAttribute('data-border-color') || '#2563eb',
            renderHTML: attributes => {
              if (!attributes.borderWidth) return {};
              return { 'data-border-color': attributes.borderColor || '#2563eb' };
            }
          },
          borderLeftOnly: {
            default: false,
            parseHTML: element => element.getAttribute('data-border-left-only') === 'true',
            renderHTML: attributes => {
              if (!attributes.borderWidth || !attributes.borderLeftOnly) return {};
              return { 'data-border-left-only': 'true' };
            }
          },
          backgroundColor: {
            default: null,
            parseHTML: element => element.getAttribute('data-bg-color') || null,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {};
              return { 'data-bg-color': attributes.backgroundColor };
            }
          }
        }
      }
    ];
  }
});
