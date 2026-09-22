import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Calendar, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Zap, Filter
} from 'lucide-react';

export default function BlockRecommender({ segments, onApplySlotToChecker }) {
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-08-05');
  const [minDuration, setMinDuration] = useState(60);
  const [windowScope, setWindowScope] = useState('night');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
              Smart Maintenance Block Recommender
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '2px' }}>
              Scans scheduled train paths to find the longest zero-conflict intervals and ranks feasible track possession windows by duration, time-of-night, and corridor congestion.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
        {/* Controls */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#f59e0b" />
            Recommendation Criteria
          </h3>

          <form onSubmit={fetchRecommendations} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Track Segment</label>
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
              <label className="form-label">Target Date</label>
              <input 
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operational Window Scope</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${windowScope === 'night' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => setWindowScope('night')}
                >
                  Night (22:00 - 07:00)
                </button>
                <button
                  type="button"
                  className={`btn ${windowScope === 'full_day' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => setWindowScope('full_day')}
                >
                  Full 24 Hours
                </button>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Minimum Block Duration</label>
                <span className="mono-text" style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{minDuration} min</span>
              </div>
              <input 
                type="range"
                min="45"
                max="240"
                step="15"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                style={{ accentColor: '#f59e0b' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Filter out gaps shorter than equipment mobilization threshold.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', marginTop: '8px' }}
            >
              {loading ? 'Finding Free Slots...' : 'Find Optimal Block Windows'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
              <div style={{ color: '#f87171' }}>{error}</div>
            </div>
          )}

          {data && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Section</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                    {data.section_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.corridor}</div>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Available Safe Slots</div>
                  <div className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                    {data.recommendations.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gaps ≥ {minDuration} min</div>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Terrain & Congestion</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span className={`badge ${data.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                      {data.terrain}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {data.congestion_level} Traffic
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                  Ranked Block Windows for {targetDate} ({data.window_scope === 'night' ? 'Night 22:00–07:00' : 'Full 24h'})
                </h4>

                {data.recommendations.length === 0 ? (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
                    <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#cbd5e1', fontWeight: '600' }}>No safe gaps ≥ {minDuration} minutes found in this timeframe.</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>Try reducing minimum duration or switching to Full 24 Hours window scope.</p>
                  </div>
                ) : (
                  data.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="glass-card"
                      style={{ 
                        border: idx === 0 ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: idx === 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 32, 70, 0.9) 100%)' : 'var(--bg-card)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {idx === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#10b981',
                          color: '#070d1e',
                          fontWeight: '800',
                          fontSize: '0.68rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Top Recommendation
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            background: rec.feasibility_score >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            border: `1px solid ${rec.feasibility_score >= 80 ? '#10b981' : '#f59e0b'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span className="mono-text" style={{ fontSize: '1.2rem', fontWeight: '800', color: rec.feasibility_score >= 80 ? '#34d399' : '#fbbf24' }}>
                              {rec.feasibility_score}
                            </span>
                            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: '#94a3b8' }}>Score</span>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="mono-text" style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff' }}>
                                {rec.start_time} → {rec.end_time}
                              </span>
                              <span className={`badge ${rec.badge_color === 'emerald' ? 'badge-green' : (rec.badge_color === 'amber' ? 'badge-amber' : 'badge-red')}`}>
                                {rec.feasibility_label}
                              </span>
                              <span className="badge badge-cyan">
                                {rec.duration_formatted} Window
                              </span>
                            </div>
                            <p style={{ color: '#cbd5e1', fontSize: '0.84rem', marginTop: '6px' }}>
                              {rec.reasoning}
                            </p>
                          </div>
                        </div>

                        <button 
                          className="btn btn-primary"
                          style={{ fontSize: '0.78rem', padding: '8px 14px' }}
                          onClick={() => {
                            if (onApplySlotToChecker) {
                              onApplySlotToChecker(selectedTrackId, targetDate, rec.start_time, rec.end_time);
                            }
                          }}
                        >
                          Verify in Conflict Checker
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Surrounding train context */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: '#94a3b8' }}>
                        <div>
                          <span>Preceding Clearance: </span>
                          <strong style={{ color: '#f8fafc' }}>{rec.preceding_train}</strong>
                        </div>
                        <div>
                          <span>Subsequent Movement: </span>
                          <strong style={{ color: '#f8fafc' }}>{rec.following_train}</strong>
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
    </div>
  );
}
