// src/editor/extensions/CustomImageExtension.ts
import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from '../views/ImageBlockView';

export const CustomImageExtension = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: element => element.getAttribute('data-caption') || null,
        renderHTML: attributes => attributes.caption ? { 'data-caption': attributes.caption } : {}
      },
      width: {
        default: '75%',
        parseHTML: element => element.getAttribute('data-width') || element.style.width || '75%',
        renderHTML: attributes => attributes.width ? { 'data-width': attributes.width } : {}
      },
      alignment: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-alignment') || 'center',
        renderHTML: attributes => attributes.alignment ? { 'data-alignment': attributes.alignment } : {}
      },
      wrap: {
        default: 'none',
        parseHTML: element => element.getAttribute('data-wrap') || 'none',
        renderHTML: attributes => attributes.wrap ? { 'data-wrap': attributes.wrap } : {}
      },
      cropRegion: {
        default: null,
        parseHTML: element => {
          const raw = element.getAttribute('data-crop-region');
          try {
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        renderHTML: attributes => {
          if (!attributes.cropRegion) return {};
          return { 'data-crop-region': JSON.stringify(attributes.cropRegion) };
        }
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  }
});
