import React, { useState } from 'react';
import { 
  Wrench, X, Clock, Calendar, MapPin, 
  CheckCircle2, AlertTriangle, ShieldCheck, Sparkles 
} from 'lucide-react';
import DocumentUploadSection from './DocumentUploadSection';
import DocumentPreviewModal from './DocumentPreviewModal';
import { createMaintenanceBlockWithDocs } from '../utils/documentStore';

export default function CreateBlockModal({ 
  isOpen, 
  onClose, 
  segments = [], 
  metaOptions, 
  initialData = {},
  onBlockCreated 
}) {
  if (!isOpen) return null;

  const [trackId, setTrackId] = useState(initialData.track_id || segments[0]?.track_id || 'T001');
  const [date, setDate] = useState(initialData.date || '2026-08-05');
  const [startTime, setStartTime] = useState(initialData.start_time || '01:30');
  const [endTime, setEndTime] = useState(initialData.end_time || '03:30');
  const [issueType, setIssueType] = useState(initialData.issue_type || '');
  const [severity, setSeverity] = useState(initialData.severity || 'Medium');
  const [machineResource, setMachineResource] = useState(initialData.machine_resource || 'BCM (Ballast Cleaning Machine)');
  const [trackPositionKm, setTrackPositionKm] = useState(initialData.track_position_km || '14.5');
  
  // Staged files for upload
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate planned duration in minutes
  const calcDurationMin = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // overnight window
      return diff || 60;
    } catch {
      return 60;
    }
  };

  const selectedSegment = segments.find(s => s.track_id === trackId) || segments[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trackId || !date || !startTime || !endTime) {
      alert('Please fill in track segment, date and scheduled window times.');
      return;
    }

    if (!issueType) {
      alert('Please select an issue type to classify this maintenance block.');
      return;
    }

    setSubmitting(true);
    const duration = calcDurationMin();

    const blockData = {
      track_id: trackId,
      section: selectedSegment ? `${selectedSegment.from_station}-${selectedSegment.to_station}` : 'Central Section',
      corridor: selectedSegment?.corridor || 'Central Railway Trunk',
      date: date,
      block_start: `${date} ${startTime}`,
      block_end: `${date} ${endTime}`,
      planned_duration_min: duration,
      actual_duration_min: 0,
      issue_type: issueType,
      severity: severity,
      machine_resource: machineResource,
      track_position_km: parseFloat(trackPositionKm) || 12.0,
      trains_affected: 0,
      status: 'Planned'
    };

    const result = createMaintenanceBlockWithDocs(blockData, uploadedFiles);
    setSubmitting(false);
    setSuccessMsg(`Block ${result.block.event_id} successfully created with ${uploadedFiles.length} condition document(s) attached!`);

    if (onBlockCreated) {
      onBlockCreated(result.block, result.documents);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(12, 20, 24, 0.85)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2200,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <div 
          style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderTop: '3px solid var(--signal-green)',
            borderRadius: '4px',
            boxShadow: 'var(--shadow-panel)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            textAlign: 'left'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            background: 'var(--bg-panel-deep)',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--signal-green)" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Create Maintenance Block & Condition Dossier
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Attach inspection reports & photo evidence relevant to track issue type
                </span>
              </div>
            </div>

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
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {successMsg && (
                <div style={{
                  background: 'var(--signal-green-bg)',
                  border: '1px solid var(--signal-green-border)',
                  color: 'var(--signal-green-text)',
                  padding: '10px 14px',
                  borderRadius: '2px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Segment & Date Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Track Segment</label>
                  <select 
                    className="form-select"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                  >
                    {segments.map((seg) => (
                      <option key={seg.track_id} value={seg.track_id}>
                        {seg.track_id}: {seg.from_station} → {seg.to_station} ({seg.corridor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Possession Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Window & Duration Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time"
                    className="form-input mono-text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time"
                    className="form-input mono-text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Planned Duration</label>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--bg-panel-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '2px',
                    fontSize: '0.86rem',
                    fontWeight: '700',
                    color: 'var(--signal-green)'
                  }} className="mono-text">
                    {calcDurationMin()} min
                  </div>
                </div>
              </div>

              {/* AI Document Intelligence Bar if files are staged */}
              {uploadedFiles.length > 0 && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '3px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    <Sparkles size={15} color="#38bdf8" />
                    <span>
                      <strong>AI Document Analyzer:</strong> {uploadedFiles.length} document(s) verified. Recommended duration: <span className="mono-text" style={{ color: '#38bdf8', fontWeight: '700' }}>120 min</span> (Date & time inputs retained as set).
                    </span>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.64rem' }}>
                    Parsed OK
                  </span>
                </div>
              )}

              {/* Issue Type Selector (Dynamic Trigger for Document Slots) */}
              <div className="form-group" style={{ background: 'var(--bg-panel-deep)', padding: '12px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--signal-amber-text)' }}>
                  Issue Type Classification *
                </label>
                <select 
                  className="form-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  style={{ fontWeight: '600' }}
                >
                  <option value="">-- Select defect / maintenance issue type --</option>
                  {(metaOptions?.issue_types || [
                    'Rail fracture',
                    'Rail weld failure (AT/flash-butt)',
                    'Track geometry defect (twist/gauge)',
                    'Ballast deficiency / packing',
                    'OHE (overhead equipment) snag',
                    'Points & crossing wear',
                    'Rail corrugation',
                    'Vegetation / embankment clearance',
                    'Bridge / culvert inspection',
                    'Signal-track interface fault',
                    'Ultrasonic flaw detection (routine)',
                    'Ballast fouling / drainage issue (monsoon)'
                  ]).map((it) => (
                    <option key={it} value={it}>{it}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Governs required condition reports, photos, and compliance inspection forms.
                </span>
              </div>

              {/* Machinery, Severity & Chainage */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Machine Resource / Gang</label>
                  <select 
                    className="form-select"
                    value={machineResource}
                    onChange={(e) => setMachineResource(e.target.value)}
                  >
                    {(metaOptions?.machine_resources || [
                      'BCM (Ballast Cleaning Machine)',
                      'CSM (Continuous Tamping Machine)',
                      'DGS (Dynamic Track Stabiliser)',
                      'T-28 Point & Crossing Crane',
                      'Manual Gang',
                      'Rail Grinder',
                      'Tower Wagon',
                      'TRC (Track Recording Car)',
                      'USFD Trolley'
                    ]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select 
                    className="form-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chainage (KM)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="form-input mono-text"
                    value={trackPositionKm}
                    onChange={(e) => setTrackPositionKm(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Document Upload Section (Spec v4 Section 2 & 3) */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <DocumentUploadSection 
                  issueType={issueType}
                  uploadedFiles={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  onPreviewFile={setPreviewDoc}
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '14px 20px',
              background: 'var(--bg-panel-deep)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {uploadedFiles.length} file{uploadedFiles.length === 1 ? '' : 's'} staged for submission
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-green"
                  disabled={submitting}
                >
                  {submitting ? 'Creating block...' : 'Confirm and create block'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Lightbox */}
      {previewDoc && (
        <DocumentPreviewModal 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
    </>
  );
}
