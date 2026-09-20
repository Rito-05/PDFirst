// src/editor/extensions/CustomTableExtensions.ts
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || element.getAttribute('data-cell-bg') || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-cell-bg': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`
          };
        }
      }
    };
  }
});

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || element.getAttribute('data-cell-bg') || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-cell-bg': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`
          };
        }
      }
    };
  }
});

export const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderWidth: {
        default: null,
        parseHTML: element => {
          const val = element.getAttribute('data-border-width');
          return val ? parseFloat(val) : null;
        },
        renderHTML: attributes => attributes.borderWidth ? { 'data-border-width': attributes.borderWidth } : {}
      },
      borderColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-color') || null,
        renderHTML: attributes => attributes.borderColor ? { 'data-border-color': attributes.borderColor } : {}
      },
      borderGrid: {
        default: 'all',
        parseHTML: element => element.getAttribute('data-border-grid') || 'all',
        renderHTML: attributes => attributes.borderGrid ? { 'data-border-grid': attributes.borderGrid } : {}
      },
      headerBackgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-header-bg') || null,
        renderHTML: attributes => attributes.headerBackgroundColor ? { 'data-header-bg': attributes.headerBackgroundColor } : {}
      }
    };
  }
});
