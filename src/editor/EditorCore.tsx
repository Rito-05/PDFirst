// src/editor/EditorCore.tsx - Tiptap Integration & Keyboard Shortcuts
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TableRow from '@tiptap/extension-table-row';
import Link from '@tiptap/extension-link';

import { BlockBoxExtension } from './extensions/BlockBoxExtension';
import { CustomTable, CustomTableCell, CustomTableHeader } from './extensions/CustomTableExtensions';
import { DocumentModel } from '../types/document';
import { autosaveManager } from '../storage/autosaveManager';

interface EditorCoreProps {
  document: DocumentModel;
  onDocChange: (updatedDoc: DocumentModel) => void;
  onOpenLinkModal: () => void;
  onSaveShortcut: () => void;
  setEditorInstance: (editor: any) => void;
}

export const EditorCore: React.FC<EditorCoreProps> = ({
  document,
  onDocChange,
  onOpenLinkModal,
  onSaveShortcut,
  setEditorInstance
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      BlockBoxExtension,
      Image.configure({
        allowBase64: true,
        inline: false
      }),
      CustomTable.configure({
        resizable: true
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      Link.configure({
        openOnClick: false,
        autolink: true
      })
    ],
    content: document.content,
    editorProps: {
      attributes: {
        id: 'editor-content-editable',
        'aria-label': 'Document Text Editor',
        role: 'textbox',
        'aria-multiline': 'true'
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const updatedDoc: DocumentModel = {
        ...document,
        metadata: {
          ...document.metadata,
          updatedAt: Date.now()
        },
        content: json as any
      };
      onDocChange(updatedDoc);
      autosaveManager.markDirty(updatedDoc);
    }
  });

  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
    return () => {
      setEditorInstance(null);
    };
  }, [editor, setEditorInstance]);

  // Update editor content when active document changes
  useEffect(() => {
    if (editor && document) {
      const currentJson = editor.getJSON();
      // Only set if different to prevent cursor jumps
      if (JSON.stringify(currentJson) !== JSON.stringify(document.content)) {
        editor.commands.setContent(document.content);
      }
    }
  }, [document.metadata.id]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveShortcut();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenLinkModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveShortcut, onOpenLinkModal]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <EditorContent editor={editor} />
    </div>
  );
};
