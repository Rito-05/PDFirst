// src/components/sidebar/PropertiesSidebar.tsx
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Sliders, X, FileText, Hash, Clock, Square, TableProperties, Palette } from 'lucide-react';
import { DocumentModel } from '../../types/document';
import { calculateTelemetry } from '../../editor/schema/documentSerializer';

interface PropertiesSidebarProps {
  document: DocumentModel;
  editor?: Editor | null;
  isOpen: boolean;
  onUpdateSettings: (updatedSettings: any) => void;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  '#2563eb', '#1e293b', '#64748b', '#dc2626', '#d97706', '#059669', '#7c3aed'
];

const BG_SWATCHES = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#eff6ff', '#fefce8', '#f0fdf4', '#fef2f2'
];

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  document,
  editor,
  isOpen,
  onUpdateSettings,
  onClose
}) => {
  if (!isOpen) return null;

  const telemetry = calculateTelemetry(document.content);
  const readingTimeMinutes = Math.max(1, Math.ceil(telemetry.wordCount / 200));

  // Determine active block node in editor
  const isTableActive = editor ? editor.isActive('table') : false;
  const isHeadingActive = editor ? editor.isActive('heading') : false;
  const isParagraphActive = editor ? editor.isActive('paragraph') : false;
  const isBlockquoteActive = editor ? editor.isActive('blockquote') : false;
  const hasBlockSelected = isParagraphActive || isHeadingActive || isBlockquoteActive;

  const activeNodeType = isHeadingActive ? 'heading' : isBlockquoteActive ? 'blockquote' : 'paragraph';
  const blockAttrs = editor && hasBlockSelected ? editor.getAttributes(activeNodeType) : {};
  const tableAttrs = editor && isTableActive ? editor.getAttributes('table') : {};

  // Handlers for block styling
  const updateBlockAttrs = (attrs: Record<string, any>) => {
    if (!editor || !hasBlockSelected) return;
    editor.chain().focus().updateAttributes(activeNodeType, attrs).run();
  };

  const updateTableAttrs = (attrs: Record<string, any>) => {
    if (!editor || !isTableActive) return;
    editor.chain().focus().updateAttributes('table', attrs).run();
  };

  const setHeaderBgColor = (color: string | null) => {
    if (!editor || !isTableActive) return;
    updateTableAttrs({ headerBackgroundColor: color });
  };

  const setCellBgColor = (color: string | null) => {
    if (!editor || !isTableActive) return;
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
  };

  return (
    <aside
      id="sidebar-properties-panel"
      aria-label="Document Properties and Layout"
      style={{
        width: '260px',
        backgroundColor: 'var(--color-bg-surface)',
        borderLeft: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        zIndex: 30
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: 'var(--font-ui-small)' }}>
          <Sliders size={16} color="var(--color-brand-primary)" />
          <span>Properties & Styling</span>
        </div>
        <button onClick={onClose} aria-label="Close Properties Sidebar">
          <X size={16} color="var(--color-text-secondary)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
        {/* Active Block Box Borders & Styling */}
        {hasBlockSelected && (
          <div style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-brand-primary)' }}>
              <Square size={14} />
              <span>Block Border & Box</span>
            </div>

            {/* Border Width */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="prop-border-width" style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Border Width
              </label>
              <select
                id="prop-border-width"
                value={blockAttrs.borderWidth || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateBlockAttrs({ borderWidth: val || null });
                }}
                style={{ width: '100%', fontSize: '12px' }}
              >
                <option value={0}>None (0px)</option>
                <option value={1}>Thin (1px)</option>
                <option value={2}>Medium (2px)</option>
                <option value={4}>Thick (4px)</option>
              </select>
            </div>

            {Boolean(blockAttrs.borderWidth) && (
              <>
                {/* Border Style */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label htmlFor="prop-border-style" style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Border Style
                  </label>
                  <select
                    id="prop-border-style"
                    value={blockAttrs.borderStyle || 'solid'}
                    onChange={(e) => updateBlockAttrs({ borderStyle: e.target.value })}
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>

                {/* Callout Left-only Toggle */}
                <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    id="prop-border-left-only"
                    checked={Boolean(blockAttrs.borderLeftOnly)}
                    onChange={(e) => updateBlockAttrs({ borderLeftOnly: e.target.checked })}
                  />
                  <label htmlFor="prop-border-left-only" style={{ fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    Left callout border only
                  </label>
                </div>

                {/* Border Color */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Border Color
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_SWATCHES.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateBlockAttrs({ borderColor: c })}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '3px',
                          backgroundColor: c,
                          border: blockAttrs.borderColor === c ? '2px solid #000' : '1px solid rgba(0,0,0,0.2)',
                          padding: 0
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={blockAttrs.borderColor || '#2563eb'}
                      onChange={(e) => updateBlockAttrs({ borderColor: e.target.value })}
                      style={{ width: '22px', height: '22px', padding: 0, border: 'none', cursor: 'pointer' }}
                      title="Custom Color"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Background Fill */}
            <div style={{ marginTop: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Box Background Fill
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {BG_SWATCHES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateBlockAttrs({ backgroundColor: c === '#ffffff' ? null : c })}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      backgroundColor: c,
                      border: blockAttrs.backgroundColor === c ? '2px solid var(--color-brand-primary)' : '1px solid var(--color-border-subtle)',
                      padding: 0
                    }}
                  />
                ))}
                {blockAttrs.backgroundColor && (
                  <button
                    type="button"
                    onClick={() => updateBlockAttrs({ backgroundColor: null })}
                    style={{ fontSize: '10px', color: 'var(--color-text-muted)', textDecoration: 'underline', background: 'none' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Table Styling */}
        {isTableActive && (
          <div style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-brand-primary)' }}>
              <TableProperties size={14} />
              <span>Table Styling</span>
            </div>

            {/* Table Gridlines */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="prop-table-grid" style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Gridlines
              </label>
              <select
                id="prop-table-grid"
                value={tableAttrs.borderGrid || 'all'}
                onChange={(e) => updateTableAttrs({ borderGrid: e.target.value })}
                style={{ width: '100%', fontSize: '12px' }}
              >
                <option value="all">All Borders</option>
                <option value="horizontal">Horizontal Dividers Only</option>
                <option value="outer">Outer Border Only</option>
                <option value="none">Borderless (Clean)</option>
              </select>
            </div>

            {/* Table Border Width */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="prop-table-border-width" style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Border Stroke
              </label>
              <select
                id="prop-table-border-width"
                value={tableAttrs.borderWidth || 1}
                onChange={(e) => updateTableAttrs({ borderWidth: parseFloat(e.target.value) })}
                style={{ width: '100%', fontSize: '12px' }}
              >
                <option value={0.5}>Hairline (0.5pt)</option>
                <option value={1}>Standard (1pt)</option>
                <option value={2}>Heavy (2pt)</option>
              </select>
            </div>

            {/* Header Fill Presets */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Header Row Fill
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['#1e293b', '#2563eb', '#eff6ff', '#f1f5f9', '#0d9488'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHeaderBgColor(c)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      backgroundColor: c,
                      border: '1px solid rgba(0,0,0,0.15)',
                      padding: 0
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setHeaderBgColor(null)}
                  style={{ fontSize: '10px', color: 'var(--color-text-muted)', background: 'none' }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Focused Cell Fill */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Focused Cell Fill
              </label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {BG_SWATCHES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCellBgColor(c === '#ffffff' ? null : c)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      backgroundColor: c,
                      border: '1px solid var(--color-border-subtle)',
                      padding: 0
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page Dimensions */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label htmlFor="prop-page-size" style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Page Format
          </label>
          <select
            id="prop-page-size"
            value={document.settings.size || 'A4'}
            onChange={(e) => onUpdateSettings({ size: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="LETTER">US Letter (8.5 × 11 in)</option>
          </select>
        </div>

        {/* Page Orientation */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label htmlFor="prop-page-orientation" style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Page Orientation
          </label>
          <select
            id="prop-page-orientation"
            value={document.settings.orientation || 'portrait'}
            onChange={(e) => onUpdateSettings({ orientation: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        {/* Margin Preset */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <label htmlFor="prop-page-margins" style={{ display: 'block', fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            Sheet Margins
          </label>
          <select
            id="prop-page-margins"
            value={document.settings.marginPreset || 'normal'}
            onChange={(e) => onUpdateSettings({ marginPreset: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="normal">Normal (0.75 in)</option>
            <option value="compact">Compact (0.5 in)</option>
            <option value="wide">Wide (1.0 in)</option>
          </select>
        </div>

        {/* Telemetry Stats Card */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            marginTop: 'var(--space-6)'
          }}
        >
          <div style={{ fontSize: 'var(--font-ui-small)', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
            Document Telemetry
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <FileText size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Pages:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.pageCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Hash size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Word Count:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.wordCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Hash size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Characters:</span>
            <strong style={{ marginLeft: 'auto' }}>{telemetry.characterCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-ui-small)' }}>
            <Clock size={14} color="var(--color-text-muted)" />
            <span style={{ color: 'var(--color-text-secondary)' }}>Reading Time:</span>
            <strong style={{ marginLeft: 'auto' }}>~{readingTimeMinutes} min</strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
