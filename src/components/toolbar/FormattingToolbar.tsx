// src/components/toolbar/FormattingToolbar.tsx
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Palette,
  Highlighter,
  PaintBucket,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  FilePlus,
  Link as LinkIcon,
  Copy,
  Clipboard
} from 'lucide-react';
import { ColorPickerPopover } from '../common/ColorPickerPopover';

interface FormattingToolbarProps {
  editor: Editor | null;
  onOpenImageModal: () => void;
  onOpenTableModal: () => void;
  onOpenLinkModal: () => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  onOpenImageModal,
  onOpenTableModal,
  onOpenLinkModal
}) => {
  const [isTextColorOpen, setIsTextColorOpen] = React.useState(false);
  const [isHighlightOpen, setIsHighlightOpen] = React.useState(false);
  const [isTableCellBgOpen, setIsTableCellBgOpen] = React.useState(false);

  if (!editor) return null;

  const activeTextColor = editor.getAttributes('textStyle')?.color || '';
  const activeHighlight = editor.getAttributes('highlight')?.color || '';
  const activeCellBg = editor.getAttributes('tableCell')?.backgroundColor || editor.getAttributes('tableHeader')?.backgroundColor || '';
  const isInsideTable = editor.isActive('table');

  const currentStyle = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else if (val === 'h1') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === 'h2') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === 'h3') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  };

  const btnStyle = (isActive: boolean, isDisabled = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: isActive ? 'var(--color-brand-subtle)' : 'transparent',
    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
    opacity: isDisabled ? 0.4 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  });

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '20px',
    backgroundColor: 'var(--color-border-subtle)',
    margin: '0 4px'
  };

  return (
    <nav
      id="editor-toolbar"
      aria-label="Text Formatting Toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: 'var(--space-2) var(--space-4)',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        zIndex: 50
      }}
    >
      {/* History */}
      <button
        id="toolbar-undo-btn"
        type="button"
        aria-label="Undo Last Action (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        style={btnStyle(false, !editor.can().undo())}
      >
        <Undo size={16} />
      </button>

      <button
        id="toolbar-redo-btn"
        type="button"
        aria-label="Redo Last Action (Ctrl+Y)"
        title="Redo (Ctrl+Y)"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        style={btnStyle(false, !editor.can().redo())}
      >
        <Redo size={16} />
      </button>

      <button
        id="toolbar-copy-btn"
        type="button"
        aria-label="Copy Selection (Ctrl+C)"
        title="Copy Selection (Ctrl+C)"
        onClick={() => {
          const { from, to } = editor.state.selection;
          if (from !== to) {
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            navigator.clipboard?.writeText(selectedText).catch(() => {});
          }
        }}
        style={btnStyle(false, false)}
      >
        <Copy size={16} />
      </button>

      <button
        id="toolbar-paste-btn"
        type="button"
        aria-label="Paste from Clipboard (Ctrl+V)"
        title="Paste from Clipboard (Ctrl+V)"
        onClick={() => {
          if (navigator.clipboard?.readText) {
            navigator.clipboard.readText().then(text => {
              if (text) {
                editor.chain().focus().insertContent(text).run();
              }
            }).catch(() => {});
          }
        }}
        style={btnStyle(false, false)}
      >
        <Clipboard size={16} />
      </button>

      <div style={dividerStyle} />

      {/* Style Hierarchy Selector */}
      <select
        id="toolbar-style-select"
        aria-label="Text Style Hierarchy"
        value={currentStyle}
        onChange={handleStyleChange}
        style={{
          padding: '4px 8px',
          fontSize: 'var(--font-ui-small)',
          fontWeight: 500,
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          marginRight: '4px'
        }}
      >
        <option value="p">Normal Text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <div style={dividerStyle} />

      {/* Inline Marks */}
      <button
        id="toolbar-bold-btn"
        type="button"
        aria-label="Toggle Bold (Ctrl+B)"
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={btnStyle(editor.isActive('bold'))}
      >
        <Bold size={16} />
      </button>

      <button
        id="toolbar-italic-btn"
        type="button"
        aria-label="Toggle Italic (Ctrl+I)"
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={btnStyle(editor.isActive('italic'))}
      >
        <Italic size={16} />
      </button>

      <button
        id="toolbar-underline-btn"
        type="button"
        aria-label="Toggle Underline (Ctrl+U)"
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        style={btnStyle(editor.isActive('underline'))}
      >
        <UnderlineIcon size={16} />
      </button>

      <button
        id="toolbar-strike-btn"
        type="button"
        aria-label="Toggle Strikethrough"
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        style={btnStyle(editor.isActive('strike'))}
      >
        <Strikethrough size={16} />
      </button>

      {/* Text Color Picker */}
      <div style={{ position: 'relative' }}>
        <button
          id="toolbar-text-color"
          type="button"
          aria-label="Text Color"
          title="Text Color"
          onClick={() => {
            setIsTextColorOpen(!isTextColorOpen);
            setIsHighlightOpen(false);
            setIsTableCellBgOpen(false);
          }}
          style={{
            ...btnStyle(Boolean(activeTextColor)),
            flexDirection: 'column',
            gap: '2px',
            position: 'relative'
          }}
        >
          <Palette size={14} />
          <div
            style={{
              width: '14px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: activeTextColor || 'var(--color-text-primary, #0f172a)'
            }}
          />
        </button>

        {isTextColorOpen && (
          <ColorPickerPopover
            color={activeTextColor || '#2563eb'}
            presetType="text"
            title="Text Color"
            onChange={(color) => {
              editor.chain().focus().setColor(color).run();
            }}
            onClear={() => {
              editor.chain().focus().unsetColor().run();
            }}
            onClose={() => setIsTextColorOpen(false)}
          />
        )}
      </div>

      {/* Text Highlight / Background Picker */}
      <div style={{ position: 'relative' }}>
        <button
          id="toolbar-text-highlight"
          type="button"
          aria-label="Highlight Color"
          title="Highlight / Background Color"
          onClick={() => {
            setIsHighlightOpen(!isHighlightOpen);
            setIsTextColorOpen(false);
            setIsTableCellBgOpen(false);
          }}
          style={{
            ...btnStyle(Boolean(activeHighlight)),
            flexDirection: 'column',
            gap: '2px',
            position: 'relative'
          }}
        >
          <Highlighter size={14} />
          <div
            style={{
              width: '14px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: activeHighlight || 'transparent',
              border: activeHighlight ? 'none' : '1px solid var(--color-border-subtle, #cbd5e1)'
            }}
          />
        </button>

        {isHighlightOpen && (
          <ColorPickerPopover
            color={activeHighlight || '#fef08a'}
            presetType="highlight"
            title="Highlight Color"
            onChange={(color) => {
              editor.chain().focus().setHighlight({ color }).run();
            }}
            onClear={() => {
              editor.chain().focus().unsetHighlight().run();
            }}
            onClose={() => setIsHighlightOpen(false)}
          />
        )}
      </div>

      <button
        id="toolbar-link-btn"
        type="button"
        aria-label="Insert Link (Ctrl+K)"
        title="Hyperlink (Ctrl+K)"
        onClick={onOpenLinkModal}
        style={btnStyle(editor.isActive('link'))}
      >
        <LinkIcon size={16} />
      </button>

      <div style={dividerStyle} />

      {/* Lists & Quotes */}
      <button
        id="toolbar-bullet-list"
        type="button"
        aria-label="Bullet List"
        title="Bulleted List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={btnStyle(editor.isActive('bulletList'))}
      >
        <List size={16} />
      </button>

      <button
        id="toolbar-ordered-list"
        type="button"
        aria-label="Numbered List"
        title="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={btnStyle(editor.isActive('orderedList'))}
      >
        <ListOrdered size={16} />
      </button>

      <button
        id="toolbar-quote-btn"
        type="button"
        aria-label="Blockquote"
        title="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={btnStyle(editor.isActive('blockquote'))}
      >
        <Quote size={16} />
      </button>

      <div style={dividerStyle} />

      {/* Alignment */}
      <button
        id="toolbar-align-left"
        type="button"
        aria-label="Align Left"
        title="Align Left"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        style={btnStyle(editor.isActive({ textAlign: 'left' }))}
      >
        <AlignLeft size={16} />
      </button>

      <button
        id="toolbar-align-center"
        type="button"
        aria-label="Align Center"
        title="Align Center"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        style={btnStyle(editor.isActive({ textAlign: 'center' }))}
      >
        <AlignCenter size={16} />
      </button>

      <button
        id="toolbar-align-right"
        type="button"
        aria-label="Align Right"
        title="Align Right"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        style={btnStyle(editor.isActive({ textAlign: 'right' }))}
      >
        <AlignRight size={16} />
      </button>

      <button
        id="toolbar-align-justify"
        type="button"
        aria-label="Align Justify"
        title="Justify"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        style={btnStyle(editor.isActive({ textAlign: 'justify' }))}
      >
        <AlignJustify size={16} />
      </button>

      <div style={dividerStyle} />

      {/* Insert Objects */}
      <button
        id="toolbar-insert-image"
        type="button"
        aria-label="Insert Image"
        title="Insert Image"
        onClick={onOpenImageModal}
        style={btnStyle(false)}
      >
        <ImageIcon size={16} />
      </button>

      <button
        id="toolbar-insert-table"
        type="button"
        aria-label="Insert Table"
        title="Insert Table"
        onClick={onOpenTableModal}
        style={btnStyle(false)}
      >
        <TableIcon size={16} />
      </button>

      {/* Table Context Styling */}
      {isInsideTable && (
        <>
          <div style={{ position: 'relative' }}>
            <button
              id="toolbar-table-cell-bg"
              type="button"
              aria-label="Table Cell Background"
              title="Table Cell Background Color"
              onClick={() => {
                setIsTableCellBgOpen(!isTableCellBgOpen);
                setIsTextColorOpen(false);
                setIsHighlightOpen(false);
              }}
              style={{
                ...btnStyle(Boolean(activeCellBg)),
                flexDirection: 'column',
                gap: '2px',
                position: 'relative'
              }}
            >
              <PaintBucket size={14} />
              <div
                style={{
                  width: '14px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: activeCellBg || 'transparent',
                  border: activeCellBg ? 'none' : '1px solid var(--color-border-subtle, #cbd5e1)'
                }}
              />
            </button>

            {isTableCellBgOpen && (
              <ColorPickerPopover
                color={activeCellBg || '#eff6ff'}
                presetType="table"
                title="Cell Background"
                align="right"
                onChange={(color) => {
                  editor.chain().focus().setCellAttribute('backgroundColor', color).run();
                }}
                onClear={() => {
                  editor.chain().focus().setCellAttribute('backgroundColor', null).run();
                }}
                onClose={() => setIsTableCellBgOpen(false)}
              />
            )}
          </div>
        </>
      )}

      <button
        id="toolbar-page-break"
        type="button"
        aria-label="Insert Page Break (Ctrl+Enter)"
        title="Insert Page Break (Ctrl+Enter)"
        onClick={() => {
          if ((editor.commands as any).setPageBreak) {
            (editor.chain().focus() as any).setPageBreak().run();
          } else {
            editor.chain().focus().setHorizontalRule().run();
          }
        }}
        style={btnStyle(false)}
      >
        <FilePlus size={16} />
      </button>
    </nav>
  );
};
