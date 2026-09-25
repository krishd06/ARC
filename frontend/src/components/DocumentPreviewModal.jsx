import React from 'react';
import { 
  FileText, Image as ImageIcon, File, X, Download, 
  ExternalLink, Calendar, MapPin, Tag, HardDrive 
} from 'lucide-react';

export default function DocumentPreviewModal({ doc, onClose }) {
  if (!doc) return null;

  const isImage = doc.file_type === 'image' || 
    (doc.filename && /\.(jpg|jpeg|png|webp|svg)$/i.test(doc.filename));
  const isPdf = doc.file_type === 'pdf' || 
    (doc.filename && /\.pdf$/i.test(doc.filename));

  const handleDownload = () => {
    if (!doc.data_url) return;
    const link = document.createElement('a');
    link.href = doc.data_url;
    link.download = doc.filename || 'rail_document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(12, 20, 24, 0.88)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '24px'
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid var(--signal-amber)',
          borderRadius: '4px',
          boxShadow: 'var(--shadow-panel)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: 'var(--bg-panel-deep)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '2px',
              background: isPdf ? 'var(--signal-red-bg)' : (isImage ? 'var(--signal-green-bg)' : 'var(--bg-panel-elevated)'),
              border: `1px solid ${isPdf ? 'var(--signal-red-border)' : (isImage ? 'var(--signal-green-border)' : 'var(--border-subtle)')}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isPdf ? (
                <FileText size={18} color="var(--signal-red-text)" />
              ) : isImage ? (
                <ImageIcon size={18} color="var(--signal-green-text)" />
              ) : (
                <File size={18} color="var(--signal-amber-text)" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono-text" style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {doc.filename}
                </span>
                <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                  {doc.size_formatted || 'File'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--signal-amber-text)', fontWeight: '600', marginTop: '2px' }}>
                {doc.doc_type}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {doc.data_url && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownload}
                title="Download local file"
                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={13} />
                <span>Save</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-panel-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: '2px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close preview"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Main Content Preview Body */}
        <div style={{
          padding: '18px',
          overflowY: 'auto',
          background: 'var(--bg-main)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '360px'
        }}>
          {isImage ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img 
                src={doc.data_url} 
                alt={doc.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '440px',
                  objectFit: 'contain',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  boxShadow: 'var(--shadow-panel)'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Field photo visual inspection evidence &bull; Central Railway P-Way
              </span>
            </div>
          ) : isPdf ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {doc.data_url && doc.data_url.startsWith('data:image') ? (
                // SVG or graphic representation of the report
                <img 
                  src={doc.data_url} 
                  alt={doc.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '420px',
                    objectFit: 'contain',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    boxShadow: 'var(--shadow-panel)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  background: 'var(--bg-panel-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '30px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FileText size={48} color="var(--signal-red)" />
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {doc.filename}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Official P-Way Condition Document Dossier &bull; {doc.size_formatted}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              width: '100%',
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '30px',
              textAlign: 'center'
            }}>
              <File size={42} color="var(--signal-amber)" />
              <div style={{ marginTop: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {doc.filename}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supporting technical documentation for maintenance record.
              </div>
            </div>
          )}
        </div>

        {/* Modal Metadata Footer */}
        <div style={{
          padding: '12px 18px',
          background: 'var(--bg-panel-deep)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          fontSize: '0.74rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} /> Track block
            </span>
            <span className="mono-text" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
              {doc.track_id || 'Global'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={11} /> Issue type
            </span>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {doc.issue_type || 'Unspecified'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HardDrive size={11} /> Event ID
            </span>
            <span className="mono-text" style={{ fontWeight: '700', color: 'var(--signal-amber)' }}>
              {doc.event_id || 'N/A'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={11} /> Uploaded
            </span>
            <span className="mono-text" style={{ color: 'var(--text-primary)' }}>
              {doc.timestamp ? doc.timestamp.split('T')[0] : '2026-08-05'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
