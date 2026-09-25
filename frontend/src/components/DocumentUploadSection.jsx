import React, { useRef, useState } from 'react';
import { 
  UploadCloud, FileText, Image as ImageIcon, File, 
  Trash2, Eye, CheckCircle2, AlertCircle, Plus, Info 
} from 'lucide-react';
import { 
  getSlotsForIssueType, 
  formatFileSize, 
  getFileTypeCategory 
} from '../utils/documentStore';

export default function DocumentUploadSection({ 
  issueType, 
  uploadedFiles = [], 
  onFilesChange,
  onPreviewFile 
}) {
  const slots = getSlotsForIssueType(issueType);
  const [dragActiveSlot, setDragActiveSlot] = useState(null);

  // Read files and convert to staged document objects
  const handleAddFiles = (slotName, fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const newItems = [];

    let processedCount = 0;
    filesArray.forEach((file) => {
      const reader = new FileReader();
      const fileCategory = getFileTypeCategory(file.name, file.type);

      reader.onload = (e) => {
        newItems.push({
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          doc_type: slotName,
          file_type: fileCategory,
          size_bytes: file.size,
          size_formatted: formatFileSize(file.size),
          data_url: e.target.result,
          file_obj: file,
          timestamp: new Date().toISOString()
        });

        processedCount++;
        if (processedCount === filesArray.length) {
          onFilesChange([...uploadedFiles, ...newItems]);
        }
      };

      reader.onerror = () => {
        // Fallback for mock/binary read error
        newItems.push({
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          doc_type: slotName,
          file_type: fileCategory,
          size_bytes: file.size,
          size_formatted: formatFileSize(file.size),
          timestamp: new Date().toISOString()
        });

        processedCount++;
        if (processedCount === filesArray.length) {
          onFilesChange([...uploadedFiles, ...newItems]);
        }
      };

      // Read as DataURL for previews
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (fileId) => {
    onFilesChange(uploadedFiles.filter(f => f.id !== fileId));
  };

  // If no issue type selected, show directive guidance
  if (!issueType) {
    return (
      <div style={{
        background: 'var(--bg-panel-elevated)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: '3px',
        padding: '18px',
        textAlign: 'center',
        marginTop: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Info size={18} color="var(--signal-amber)" />
          <span style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Select an Issue Type to activate condition document upload slots
          </span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '440px', margin: '6px auto 0' }}>
          Document slots dynamically adapt according to Central Railway safety norms (e.g. USFD reports & photos for fractures, TRC charts for gauge defects, OHE logs for snag clearances).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Condition document dossier
          </span>
          <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>
            {slots.length} slots active
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {uploadedFiles.length} file{uploadedFiles.length === 1 ? '' : 's'} staged
        </span>
      </div>

      {/* Render Dynamic Slots for the selected issue type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {slots.map((slot) => {
          const slotFiles = uploadedFiles.filter(f => f.doc_type === slot.name);
          const isCatchAll = slot.id === 'additional_docs';
          const isDragging = dragActiveSlot === slot.id;

          return (
            <div 
              key={slot.id}
              style={{
                background: 'var(--bg-panel-elevated)',
                border: isDragging ? '1.5px dashed var(--signal-amber)' : '1px solid var(--border-subtle)',
                borderLeft: isCatchAll ? '3px solid var(--border-subtle)' : '3px solid var(--signal-green)',
                borderRadius: '3px',
                padding: '12px 14px',
                transition: 'all 0.15s ease'
              }}
              onDragOver={(e) => { e.preventDefault(); setDragActiveSlot(slot.id); }}
              onDragLeave={() => setDragActiveSlot(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActiveSlot(null);
                if (e.dataTransfer.files) {
                  handleAddFiles(slot.name, e.dataTransfer.files);
                }
              }}
            >
              {/* Slot Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {slot.name}
                    </span>
                    <span className={`badge ${isCatchAll ? 'badge-slate' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                      {isCatchAll ? 'Optional catch-all' : 'Recommended'}
                    </span>
                    {slot.multiple && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        (Multiple files allowed)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isCatchAll ? slot.description : `Accepts PDF, JPG, PNG format inspection evidence.`}
                  </div>
                </div>

                {/* Upload action button / trigger */}
                <label 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  className="upload-btn-hover"
                >
                  <UploadCloud size={13} color="var(--signal-amber)" />
                  <span>Attach file{slot.multiple ? 's' : ''}</span>
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg,.webp" 
                    multiple={slot.multiple} 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleAddFiles(slot.name, e.target.files);
                        e.target.value = ''; // reset so same file can be re-selected if removed
                      }
                    }}
                  />
                </label>
              </div>

              {/* Uploaded Files List for this slot */}
              {slotFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {slotFiles.map((file) => (
                    <div 
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '2px',
                        fontSize: '0.76rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        {file.file_type === 'pdf' ? (
                          <FileText size={15} color="var(--signal-red-text)" style={{ flexShrink: 0 }} />
                        ) : file.file_type === 'image' ? (
                          <ImageIcon size={15} color="var(--signal-green-text)" style={{ flexShrink: 0 }} />
                        ) : (
                          <File size={15} color="var(--signal-amber-text)" style={{ flexShrink: 0 }} />
                        )}

                        <span className="mono-text" style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-primary)', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {file.filename}
                        </span>

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          ({file.size_formatted})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {onPreviewFile && (
                          <button
                            type="button"
                            onClick={() => onPreviewFile(file)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Preview file"
                          >
                            <Eye size={14} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--signal-red-text)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.82rem',
                            fontWeight: '700'
                          }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
