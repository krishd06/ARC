import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, 
  Train, ArrowRight, Calendar, Sliders, Info, Zap
} from 'lucide-react';

export default function ConflictChecker({ segments, prefill, onSelectSlotForRecommender }) {
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [targetDate, setTargetDate] = useState('2026-08-05');
  const [startTime, setStartTime] = useState('07:10');
  const [endTime, setEndTime] = useState('07:45');
  const [bufferMin, setBufferMin] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Apply prefill if provided
  useEffect(() => {
    if (prefill) {
      if (prefill.trackId) setSelectedTrackId(prefill.trackId);
      if (prefill.date) setTargetDate(prefill.date);
      if (prefill.start) setStartTime(prefill.start);
      if (prefill.end) setEndTime(prefill.end);
    }
  }, [prefill]);

  // Set default segment on load
  useEffect(() => {
    if (segments.length > 0 && !selectedTrackId) {
      setSelectedTrackId(segments[0].track_id);
    }
  }, [segments, selectedTrackId]);

  // Quick preset handlers
  const applyPreset = (start, end, label) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTrackId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: selectedTrackId,
          target_date: targetDate,
          start_time: startTime,
          end_time: endTime,
          buffer_minutes: parseInt(bufferMin, 10)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to check conflicts');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial check when segments load
  useEffect(() => {
    if (selectedTrackId) {
      handleCheck();
    }
  }, [selectedTrackId]);

  const selectedSegment = segments.find(s => s.track_id === selectedTrackId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Explainer */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={22} color="#38bdf8" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
                Track Occupancy & Maintenance Conflict Engine
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '6px', maxWidth: '850px' }}>
              Cross-references the Indian Railways timetable (<code className="mono-text">train_routes.csv</code>) against physical chainage sections (<code className="mono-text">track_segments.csv</code>) to verify whether any express, passenger, or freight train occupies the track during the requested maintenance block.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => { setSelectedTrackId('T001'); applyPreset('07:10', '07:35'); }}
            >
              Demo Conflict (T001 @ 07:10)
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => { setSelectedTrackId('T001'); applyPreset('03:00', '05:00'); }}
            >
              Demo Safe Slot (T001 @ 03:00)
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '380px 1fr', alignItems: 'start' }}>
        {/* Controls Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#38bdf8" />
            Block Request Parameters
          </h3>

          <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Segment Selector */}
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

            {/* Segment Info Capsule */}
            {selectedSegment && (
              <div style={{ background: '#09132b', border: '1px solid #1e3264', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Corridor:</span>
                  <span style={{ color: '#f8fafc', fontWeight: '600' }}>{selectedSegment.corridor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#94a3b8' }}>
                  <span>Stations:</span>
                  <span style={{ color: '#f8fafc' }}>{selectedSegment.from_station_name} to {selectedSegment.to_station_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#94a3b8' }}>
                  <span>Chainage / Speed:</span>
                  <span style={{ color: '#f8fafc' }}>{selectedSegment.length_km} km • Max {selectedSegment.max_speed_kmph} km/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#94a3b8' }}>
                  <span>Terrain:</span>
                  <span className={`badge ${selectedSegment.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    {selectedSegment.terrain}
                  </span>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Target Maintenance Date</label>
              <input 
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {/* Time Window */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Block Start (HH:MM)</label>
                <input 
                  type="time"
                  className="form-input mono-text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Block End (HH:MM)</label>
                <input 
                  type="time"
                  className="form-input mono-text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Presets */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.72rem' }}>Quick Window Presets</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button 
                  type="button" 
                  className="badge badge-cyan" 
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => applyPreset('01:30', '04:30')}
                >
                  Night (01:30–04:30)
                </button>
                <button 
                  type="button" 
                  className="badge badge-amber" 
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => applyPreset('23:45', '02:45')}
                >
                  Overnight (23:45–02:45)
                </button>
                <button 
                  type="button" 
                  className="badge badge-purple" 
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => applyPreset('12:00', '14:30')}
                >
                  Midday (12:00–14:30)
                </button>
              </div>
            </div>

            {/* Safety Buffer */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Safety Clearance Buffer</label>
                <span className="mono-text" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{bufferMin} min</span>
              </div>
              <input 
                type="range"
                min="0"
                max="30"
                step="5"
                value={bufferMin}
                onChange={(e) => setBufferMin(e.target.value)}
                style={{ accentColor: '#38bdf8' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Adds pre/post margin around train arrival & departure events.
              </span>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px', padding: '12px' }}
            >
              {loading ? 'Evaluating Corridor...' : 'Run Conflict Check'}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Verdict Banner */}
              <div 
                className="glass-card" 
                style={{
                  background: result.verdict === 'CLEAR' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(13, 23, 51, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(13, 23, 51, 0.8) 100%)',
                  border: `2px solid ${result.verdict === 'CLEAR' ? '#10b981' : '#ef4444'}`,
                  boxShadow: result.verdict === 'CLEAR' ? 'var(--shadow-glow-green)' : 'var(--shadow-glow-red)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '12px',
                      background: result.verdict === 'CLEAR' ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                    }}>
                      {result.verdict === 'CLEAR' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
                          {result.verdict === 'CLEAR' ? 'CLEAR: NO CONFLICTS' : `CONFLICT DETECTED: ${result.conflict_count} TRAIN(S) AFFECTED`}
                        </h3>
                        <span className={`badge ${result.verdict === 'CLEAR' ? 'badge-green' : 'badge-red'}`}>
                          {result.verdict}
                        </span>
                      </div>
                      <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginTop: '4px' }}>
                        {result.verdict === 'CLEAR' 
                          ? `Proposed ${result.planned_duration_min}-minute block is safe to grant. No scheduled trains occupy this segment during this window.`
                          : `Maintenance block overlaps with scheduled revenue trains. Immediate rescheduling or train path regulation required.`}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                      Planned Window
                    </div>
                    <div className="mono-text" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8' }}>
                      {result.start_time} → {result.end_time}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Duration: {result.planned_duration_min} min ({Math.floor(result.planned_duration_min/60)}h {result.planned_duration_min%60}m)
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflicting Trains Table */}
              {result.conflict_count > 0 && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f87171', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} />
                    Directly Conflicting Train Services ({result.conflict_count})
                  </h4>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Train #</th>
                          <th>Train Name</th>
                          <th>Type</th>
                          <th>Direction</th>
                          <th>Segment Entry</th>
                          <th>Segment Exit</th>
                          <th>Direct Overlap</th>
                          <th>Impact Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.conflicts.map((c, idx) => (
                          <tr key={idx} style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                            <td className="mono-text" style={{ fontWeight: '700', color: '#f87171' }}>
                              {c.train_number}
                            </td>
                            <td style={{ fontWeight: '600' }}>
                              {c.train_name}
                            </td>
                            <td>
                              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                                {c.train_type}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                {c.direction} ({c.from_station} → {c.to_station})
                              </span>
                            </td>
                            <td className="mono-text">{c.scheduled_entry_time}</td>
                            <td className="mono-text">{c.scheduled_exit_time}</td>
                            <td className="mono-text" style={{ color: '#ef4444', fontWeight: '700' }}>
                              {c.overlap_minutes} min
                            </td>
                            <td>
                              <span className="badge badge-red">
                                {c.buffer_breach ? 'Buffer Breach' : 'Direct Occupancy'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Corridor Context Timeline */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#38bdf8" />
                    Scheduled Trains Nearby Window (±12h Context)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Total {result.timeline_context.length} train movements recorded on this segment
                  </span>
                </div>

                {result.timeline_context.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No scheduled trains recorded in the immediate ±12h timeframe.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Train #</th>
                          <th>Train Name</th>
                          <th>Direction</th>
                          <th>Segment Entry</th>
                          <th>Segment Exit</th>
                          <th>Status relative to Proposed Block</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.timeline_context.map((t, idx) => {
                          const isConf = t.is_conflict;
                          return (
                            <tr key={idx} style={{ background: isConf ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                              <td className="mono-text" style={{ fontWeight: '600', color: isConf ? '#f87171' : '#38bdf8' }}>
                                {t.train_number}
                              </td>
                              <td>{t.train_name}</td>
                              <td>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {t.from_station} → {t.to_station}
                                </span>
                              </td>
                              <td className="mono-text">{t.scheduled_entry_time}</td>
                              <td className="mono-text">{t.scheduled_exit_time}</td>
                              <td>
                                {isConf ? (
                                  <span className="badge badge-red">Conflicting ({t.overlap_minutes}m)</span>
                                ) : (
                                  <span className="badge badge-green">Clear ({t.scheduled_exit_time < result.start_time ? 'Prior' : 'Subsequent'})</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
