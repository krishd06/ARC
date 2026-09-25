import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Calendar, CheckCircle2, AlertCircle, 
  ShieldCheck, Zap, Filter, Plus, FileText
} from 'lucide-react';
import CreateBlockModal from './CreateBlockModal';

export default function BlockRecommender({ segments, onApplySlotToChecker, metaOptions }) {
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-08-05');
  const [minDuration, setMinDuration] = useState(60);
  const [windowScope, setWindowScope] = useState('night');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Block Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalData, setCreateModalData] = useState({});
  const [creationToast, setCreationToast] = useState(null);

  const handleOpenCreateModal = (initialData = {}) => {
    setCreateModalData({
      track_id: selectedTrackId,
      date: targetDate,
      start_time: '02:00',
      end_time: '04:00',
      ...initialData
    });
    setIsCreateModalOpen(true);
  };

  const handleBlockCreated = (newBlock, newDocs) => {
    setCreationToast(`Maintenance block ${newBlock.event_id} successfully created on ${newBlock.track_id} with ${newDocs.length} condition document(s) attached.`);
    setTimeout(() => setCreationToast(null), 6000);
  };

  useEffect(() => {
    if (segments.length > 0 && !selectedTrackId) {
      setSelectedTrackId(segments[2]?.track_id || segments[0].track_id); // T003 KYN-KJT
    }
  }, [segments, selectedTrackId]);

  const fetchRecommendations = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTrackId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/block-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: selectedTrackId,
          target_date: targetDate,
          min_duration_min: parseInt(minDuration, 10),
          window_scope: windowScope
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to fetch recommendations');
      }

      const resData = await res.json();
      setData(resData);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrackId) {
      fetchRecommendations();
    }
  }, [selectedTrackId, windowScope, minDuration]);

  const selectedSegment = segments.find(s => s.track_id === selectedTrackId);

  return (
    <section className="panel-recommender">
      {/* Panel Header */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ maxWidth: '780px' }}>
          <div className="panel-title">
            <Sparkles size={20} color="var(--signal-green)" />
            <span>Smart maintenance block recommender</span>
          </div>
          <p className="panel-desc">
            Scans scheduled train paths to identify maximum zero-conflict intervals and ranks feasible track possession windows by duration, nocturnal hours, and corridor congestion levels.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-green"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
          onClick={() => handleOpenCreateModal()}
        >
          <Plus size={15} />
          <span>Create maintenance block</span>
        </button>
      </div>

      {creationToast && (
        <div style={{
          background: 'var(--signal-green-bg)',
          border: '1px solid var(--signal-green-border)',
          color: 'var(--signal-green-text)',
          padding: '10px 16px',
          borderRadius: '2px',
          fontSize: '0.84rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{creationToast}</span>
        </div>
      )}

      {/* Main Form + Results Grid */}
      <div className="panels-grid-dual" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
        {/* Controls Column */}
        <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '16px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--signal-green)" />
            <span>Recommendation criteria</span>
          </div>

          <form onSubmit={fetchRecommendations} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Track segment</label>
              <select 
                className="form-select"
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
              >
                {segments.map((seg) => (
                  <option key={seg.track_id} value={seg.track_id}>
                    {seg.track_id}: {seg.from_station} → {seg.to_station} ({seg.corridor})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target date</label>
              <input 
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operational window scope</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${windowScope === 'night' ? 'btn-green' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '7px' }}
                  onClick={() => setWindowScope('night')}
                >
                  Night (22:00 - 07:00)
                </button>
                <button
                  type="button"
                  className={`btn ${windowScope === 'full_day' ? 'btn-green' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '7px' }}
                  onClick={() => setWindowScope('full_day')}
                >
                  Full 24 hours
                </button>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Minimum block duration</label>
                <span className="mono-text" style={{ color: 'var(--signal-green)', fontSize: '0.85rem' }}>{minDuration} min</span>
              </div>
              <input 
                type="range"
                min="45"
                max="240"
                step="15"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                style={{ accentColor: 'var(--signal-green)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Filters out gaps shorter than track machine mobilization threshold.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-green"
              disabled={loading}
              style={{ marginTop: '6px' }}
            >
              {loading ? 'Scanning safe gaps...' : 'Find feasible block windows'}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ border: '1px solid var(--signal-red-border)', background: 'var(--signal-red-bg)', padding: '12px 16px', borderRadius: '2px', color: '#e5736c' }}>
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Telemetry Snapshot Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Section</div>
                  <div style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {data.section_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{data.corridor}</div>
                </div>

                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Available safe slots</div>
                  <div className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--signal-green)', marginTop: '2px' }}>
                    {data.recommendations.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Gaps ≥ {minDuration} min</div>
                </div>

                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Terrain and traffic</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <span className={`badge ${data.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`}>
                      {data.terrain}
                    </span>
                    <span className="badge badge-slate">
                      {data.congestion_level} traffic
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Ranked block windows for {targetDate} ({data.window_scope === 'night' ? 'Night 22:00–07:00' : 'Full 24h'})
                </div>

                {data.recommendations.length === 0 ? (
                  <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', textAlign: 'left', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--signal-amber)' }}>
                      <AlertCircle size={20} />
                      <strong style={{ fontSize: '0.92rem' }}>No safe gaps ≥ {minDuration} minutes found in this timeframe</strong>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
                      Try reducing minimum duration or switching to Full 24 hours window scope.
                    </p>
                  </div>
                ) : (
                  data.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'var(--bg-panel-elevated)',
                        border: idx === 0 ? '1px solid var(--signal-green)' : '1px solid var(--border-subtle)',
                        borderLeft: idx === 0 ? '4px solid var(--signal-green)' : '4px solid var(--border-subtle)',
                        borderRadius: '3px',
                        padding: '16px',
                        position: 'relative'
                      }}
                    >
                      {idx === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '12px',
                          background: 'var(--signal-green-bg)',
                          border: '1px solid var(--signal-green-border)',
                          color: 'var(--signal-green-text)',
                          fontWeight: '600',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '2px'
                        }}>
                          Top feasibility score
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          {/* Feasibility Meter */}
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '3px',
                            background: rec.feasibility_score >= 80 ? 'var(--signal-green-bg)' : 'var(--signal-amber-bg)',
                            border: `1px solid ${rec.feasibility_score >= 80 ? 'var(--signal-green-border)' : 'var(--signal-amber-border)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <span className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: rec.feasibility_score >= 80 ? 'var(--signal-green-text)' : 'var(--signal-amber-text)' }}>
                              {rec.feasibility_score}
                            </span>
                            <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Score</span>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {rec.start_time} → {rec.end_time}
                              </span>
                              <span className={`badge ${rec.badge_color === 'emerald' ? 'badge-green' : (rec.badge_color === 'amber' ? 'badge-amber' : 'badge-red')}`}>
                                {rec.feasibility_label}
                              </span>
                              <span className="badge badge-slate">
                                {rec.duration_formatted} window
                              </span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                              {rec.reasoning}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (onApplySlotToChecker) {
                                onApplySlotToChecker(selectedTrackId, targetDate, rec.start_time, rec.end_time);
                              }
                            }}
                          >
                            Verify in conflict checker
                          </button>

                          <button 
                            type="button"
                            className="btn btn-green btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleOpenCreateModal({
                              track_id: selectedTrackId,
                              date: targetDate,
                              start_time: rec.start_time,
                              end_time: rec.end_time
                            })}
                          >
                            <Calendar size={13} />
                            <span>Schedule & attach docs</span>
                          </button>
                        </div>
                      </div>

                      {/* Surrounding Train Context */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(143, 163, 168, 0.1)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <div>
                          <span>Preceding clearance: </span>
                          <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{rec.preceding_train}</strong>
                        </div>
                        <div>
                          <span>Subsequent movement: </span>
                          <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{rec.following_train}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Maintenance Block & Dynamic Document Upload Modal */}
      <CreateBlockModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        segments={segments}
        metaOptions={metaOptions}
        initialData={createModalData}
        onBlockCreated={handleBlockCreated}
      />
    </section>
  );
}
