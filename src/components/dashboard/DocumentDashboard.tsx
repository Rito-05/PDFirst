// src/components/dashboard/DocumentDashboard.tsx - Document Library & Management
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Copy,
  Trash2,
  Search,
  Clock,
  FileDown,
  Sun,
  Moon
} from 'lucide-react';
import { DocumentMetadataRecord } from '../../storage/db';
import {
  getAllMetadata,
  deleteDocument,
  duplicateDocument,
  createDocument
} from '../../storage/documentRepository';

interface DocumentDashboardProps {
  onOpenDocument: (id: string) => void;
  onOpenImportModal: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({
  onOpenDocument,
  onOpenImportModal,
  isDarkTheme,
  onToggleTheme
}) => {
  const [documents, setDocuments] = useState<DocumentMetadataRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const records = await getAllMetadata();
      setDocuments(records);
    } catch (err) {
      console.error('Failed to load documents list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleCreateNew = async () => {
    try {
      const newDoc = await createDocument('Untitled Document');
      onOpenDocument(newDoc.metadata.id);
    } catch (err) {
      console.error('Failed to create new document:', err);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await duplicateDocument(id);
      await loadDocs();
    } catch (err) {
      console.error('Failed to duplicate document:', err);
    }
  };

  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setDocToDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id);
      setDocToDelete(null);
      await loadDocs();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--color-bg-app)',
        overflowY: 'auto'
      }}
    >
      {/* Dashboard Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          padding: '0 var(--space-8)',
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '18px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <FileText size={16} />
          </div>
          <span style={{ letterSpacing: '-0.02em' }}>PDFirst</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-brand-subtle)',
              color: 'var(--color-brand-primary)',
              marginLeft: '4px'
            }}
          >
            MVP
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            aria-label="Toggle Theme"
            onClick={onToggleTheme}
            style={{ padding: '8px', color: 'var(--color-text-secondary)' }}
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            id="btn-dashboard-import-pdf"
            type="button"
            aria-label="Import PDF"
            onClick={onOpenImportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-ui-base)',
              fontWeight: 500
            }}
          >
            <Upload size={16} />
            <span>Import PDF</span>
          </button>

          <button
            id="btn-dashboard-new-doc"
            type="button"
            aria-label="New Document"
            onClick={handleCreateNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-brand-primary)',
              color: '#ffffff',
              fontSize: 'var(--font-ui-base)',
              fontWeight: 600,
              boxShadow: 'var(--color-shadow-sm)'
            }}
          >
            <Plus size={16} />
            <span>New Document</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Banner & Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
              Document Library
            </h1>
            <p style={{ fontSize: 'var(--font-ui-base)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Reflowable documents compiled directly to professional PDFs.
            </p>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              id="search-documents-input"
              type="text"
              aria-label="Search documents"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0', color: 'var(--color-text-muted)' }}>
            Loading your document library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-16) var(--space-4)',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--color-border-strong)'
            }}
          >
            <FileDown size={48} color="var(--color-brand-primary)" style={{ marginBottom: 'var(--space-3)' }} />
            <h2 style={{ fontSize: 'var(--font-doc-h3)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
              No documents found
            </h2>
            <p style={{ fontSize: 'var(--font-ui-base)', color: 'var(--color-text-secondary)', maxWidth: '360px', margin: '0 auto var(--space-6)' }}>
              {searchQuery ? 'Try a different search term.' : 'Create your first document or import a text-based PDF to start writing.'}
            </p>
            <button
              type="button"
              onClick={handleCreateNew}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: 'var(--space-2) var(--space-5)',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              <Plus size={16} />
              <span>Create New Document</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-5)'
            }}
          >
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenDocument(doc.id)}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  boxShadow: 'var(--color-shadow-sm)',
                  padding: 'var(--space-5)',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '150px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        <FileText size={18} color="var(--color-brand-primary)" />
                      </div>
                      <h3
                        style={{
                          fontSize: 'var(--font-ui-title)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          lineHeight: 1.3,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
                        }}
                        title={doc.title || 'Untitled Document'}
                      >
                        {doc.title || 'Untitled Document'}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        id="btn-duplicate-doc"
                        type="button"
                        aria-label={`Duplicate ${doc.title}`}
                        title="Duplicate"
                        onClick={(e) => handleDuplicate(e, doc.id)}
                        style={{ padding: '4px', color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brand-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        id="btn-delete-doc"
                        type="button"
                        aria-label={`Delete ${doc.title}`}
                        title="Delete"
                        onClick={(e) => handleDeleteClick(e, doc.id, doc.title)}
                        style={{ padding: '4px', color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-3)', fontSize: 'var(--font-ui-small)', color: 'var(--color-text-secondary)' }}>
                    <span>{doc.wordCount || 0} words</span>
                    <span>•</span>
                    <span>~{doc.pageCount || 1} page{doc.pageCount === 1 ? '' : 's'}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: 'var(--font-ui-small)',
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--color-border-subtle)'
                  }}
                >
                  <Clock size={12} />
                  <span>Modified {formatDate(doc.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* In-App Delete Confirmation Modal */}
      {docToDelete && (
        <div
          id="modal-confirm-delete"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Document Deletion"
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--color-shadow-md)',
              border: '1px solid var(--color-border-strong)',
              width: '100%',
              maxWidth: '400px',
              padding: 'var(--space-6)'
            }}
          >
            <h3 style={{ fontSize: 'var(--font-ui-title)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
              Delete Document?
            </h3>
            <p style={{ fontSize: 'var(--font-ui-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
              Are you sure you want to delete <strong>"{docToDelete.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                style={{ padding: 'var(--space-2) var(--space-4)', border: '1px solid var(--color-border-subtle)' }}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-doc"
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  fontWeight: 600
                }}
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
