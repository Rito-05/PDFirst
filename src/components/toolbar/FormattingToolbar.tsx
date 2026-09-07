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
  Link as LinkIcon
} from 'lucide-react';

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
  if (!editor) return null;

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

      <button
        id="toolbar-page-break"
        type="button"
        aria-label="Insert Page Break"
        title="Insert Page Break (Horizontal Divider)"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        style={btnStyle(false)}
      >
        <Minus size={16} />
      </button>
    </nav>
  );
};
