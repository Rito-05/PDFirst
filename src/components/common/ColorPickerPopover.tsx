// src/components/common/ColorPickerPopover.tsx
import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { X, Check } from 'lucide-react';

export interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  onClose: () => void;
  title?: string;
  presetType?: 'text' | 'highlight' | 'table';
  customPresets?: string[];
  align?: 'left' | 'right';
}

const TEXT_COLOR_PRESETS = [
  '#000000', '#1e293b', '#374151', '#1e3a8a', '#2563eb',
  '#0d9488', '#059669', '#d97706', '#dc2626', '#7c3aed'
];

const HIGHLIGHT_COLOR_PRESETS = [
  '#fef08a', '#bbf7d0', '#a5f3fc', '#fbcfe8', '#fed7aa', '#ddd6fe'
];

const TABLE_BG_PRESETS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#eff6ff', '#f0fdf4',
  '#fefce8', '#fef2f2', '#faf5ff', '#e2e8f0', '#cbd5e1'
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  onClear,
  onClose,
  title = 'Select Color',
  presetType = 'text',
  customPresets,
  align = 'left'
}) => {
  const [internalColor, setInternalColor] = useState(color || '#2563eb');
  const [hexInput, setHexInput] = useState(color ? color.replace('#', '') : '2563eb');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (color) {
      setInternalColor(color);
      setHexInput(color.replace('#', ''));
    }
  }, [color]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.document.addEventListener('mousedown', handleClickOutside);
    window.document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const presets = customPresets || (
    presetType === 'highlight'
      ? HIGHLIGHT_COLOR_PRESETS
      : presetType === 'table'
      ? TABLE_BG_PRESETS
      : TEXT_COLOR_PRESETS
  );

  const handlePickerChange = (newColor: string) => {
    setInternalColor(newColor);
    setHexInput(newColor.replace('#', ''));
    onChange(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(val);
    if (val.length === 6) {
      const full = `#${val}`;
      setInternalColor(full);
      onChange(full);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="color-picker-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [align === 'right' ? 'right' : 'left']: 0,
        zIndex: 1000,
        background: 'var(--color-bg-elevated, #ffffff)',
        border: '1px solid var(--color-border-subtle, #e2e8f0)',
        borderRadius: '10px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '12px',
        width: '230px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary, #64748b)' }}>
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: 'var(--color-text-muted, #94a3b8)',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Preset Swatches */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94a3b8)', marginBottom: '6px' }}>
          Presets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {presets.map(p => {
            const isSelected = (color || '').toLowerCase() === p.toLowerCase();
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePickerChange(p)}
                title={p}
                style={{
                  width: '100%',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: p,
                  border: isSelected ? '2px solid var(--color-brand-primary, #2563eb)' : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                  boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.25)' : 'none'
                }}
              >
                {isSelected && (
                  <Check size={12} color={p === '#ffffff' || p === '#fef08a' || p === '#bbf7d0' ? '#000000' : '#ffffff'} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Color Picker */}
      <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
        <HexColorPicker
          color={internalColor}
          onChange={handlePickerChange}
          style={{ width: '100%', height: '120px' }}
        />
      </div>

      {/* Hex Text Input & Clear Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            border: '1px solid var(--color-border-subtle, #cbd5e1)',
            borderRadius: '6px',
            padding: '4px 6px',
            background: 'var(--color-bg-base, #ffffff)'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)', marginRight: '2px' }}>
            #
          </span>
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            maxLength={6}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              width: '100%',
              background: 'transparent',
              fontFamily: 'monospace',
              color: 'var(--color-text-primary, #0f172a)'
            }}
          />
        </div>

        {onClear && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              background: 'var(--color-bg-subtle, #f1f5f9)',
              border: '1px solid var(--color-border-subtle, #cbd5e1)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary, #475569)',
              whiteSpace: 'nowrap'
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
