// src/editor/extensions/PageBreakExtension.ts
import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreakExtension = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id') || null,
        renderHTML: attributes => attributes.id ? { 'data-id': attributes.id } : {}
      }
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="page-break"]' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'page-break',
        class: 'page-break-divider',
        ...HTMLAttributes
      }
    ];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: { id: 'pb_' + Date.now().toString(36) }
          })
          .run();
      }
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak()
    };
  }
});
