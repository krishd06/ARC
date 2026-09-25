import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, 
  Train, Sliders, Info, Zap
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

  const applyPreset = (start, end) => {
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

  useEffect(() => {
    if (selectedTrackId) {
      handleCheck();
    }
  }, [selectedTrackId]);

  const selectedSegment = segments.find(s => s.track_id === selectedTrackId);
  const isConflict = result && result.conflict_count > 0;
  const isClear = result && result.verdict === 'CLEAR';

  return (
    <section className={`panel-conflict ${isConflict ? 'conflict-active' : ''} ${isClear ? 'clear-active' : ''}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <ShieldAlert size={20} color={isConflict ? 'var(--signal-red)' : 'var(--signal-amber)'} />
          <span>Track occupancy and maintenance conflict engine</span>
        </div>
        <p className="panel-desc">
          Cross-references scheduled timetable movements (<span className="mono-text">train_routes.csv</span>) against physical track chainages (<span className="mono-text">track_segments.csv</span>) to identify route overlaps, headways, and corridor clearance.
        </p>

        {/* Tactical Quick Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={() => { setSelectedTrackId('T001'); applyPreset('07:10', '07:35'); }}
          >
            Demo conflict: T001 at 07:10
          </button>
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={() => { setSelectedTrackId('T001'); applyPreset('03:00', '05:00'); }}
          >
            Demo safe window: T001 at 03:00
          </button>
        </div>
      </div>

      <div className="panels-grid-dual" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
        {/* Controls Column */}
        <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--signal-amber)" />
            <span>Block request parameters</span>
          </div>

          <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Segment Selector */}
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

            {/* Segment Specs Telemetry */}
            {selectedSegment && (
              <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 12px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Corridor</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedSegment.corridor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)' }}>
                  <span>Section</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedSegment.from_station_name} to {selectedSegment.to_station_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)' }}>
                  <span>Chainage / Speed</span>
                  <span className="mono-text" style={{ color: 'var(--text-primary)' }}>{selectedSegment.length_km} km • Max {selectedSegment.max_speed_kmph} km/h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--text-muted)' }}>
                  <span>Terrain</span>
                  <span className={`badge ${selectedSegment.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`}>
                    {selectedSegment.terrain}
                  </span>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Target maintenance date</label>
              <input 
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {/* Time Window */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Block start (HH:MM)</label>
                <input 
                  type="time"
                  className="form-input mono-text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Block end (HH:MM)</label>
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
              <label className="form-label">Standard operational windows</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => applyPreset('01:30', '04:30')}
                >
                  Night (01:30–04:30)
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => applyPreset('23:45', '02:45')}
                >
                  Late night (23:45–02:45)
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => applyPreset('12:00', '14:30')}
                >
                  Midday dip (12:00–14:30)
                </button>
              </div>
            </div>

            {/* Safety Clearance Buffer */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Headway safety clearance buffer</label>
                <span className="mono-text" style={{ fontSize: '0.8rem', color: 'var(--signal-amber)' }}>{bufferMin} min</span>
              </div>
              <input 
                type="range"
                min="0"
                max="30"
                step="5"
                value={bufferMin}
                onChange={(e) => setBufferMin(e.target.value)}
                style={{ accentColor: 'var(--signal-amber)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Enforces safety interval between train clearance and maintenance block entry.
              </span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Evaluating timetable movements...' : 'Check track occupancy'}
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ border: '1px solid var(--signal-red-border)', background: 'var(--signal-red-bg)', padding: '12px 16px', borderRadius: '2px', color: '#e5736c', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <>
              {/* Verdict Indicator */}
              <div 
                style={{
                  background: isClear ? 'var(--signal-green-bg)' : 'var(--signal-red-bg)',
                  border: `1px solid ${isClear ? 'var(--signal-green-border)' : 'var(--signal-red-border)'}`,
                  borderLeft: `5px solid ${isClear ? 'var(--signal-green)' : 'var(--signal-red)'}`,
                  borderRadius: '2px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '3px',
                    background: isClear ? 'var(--signal-green)' : 'var(--signal-red)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}>
                    {isClear ? <CheckCircle2 size={28} color="#FFFFFF" /> : <AlertTriangle size={28} color="#FFFFFF" />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {isClear ? 'Clear: No conflicts detected' : `Conflict detected: ${result.conflict_count} train(s) affected`}
                      </h3>
                      <span className={`badge ${isClear ? 'badge-green' : 'badge-red'}`}>
                        {result.verdict}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
                      {isClear 
                        ? `Proposed ${result.planned_duration_min}-minute block is safe to grant. No scheduled trains occupy this section during this window.`
                        : `Maintenance block conflicts with scheduled revenue trains. Operational regulation or rescheduling required before granting.`}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'left', minWidth: '150px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                    Requested window
                  </div>
                  <div className="mono-text" style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--signal-amber)' }}>
                    {result.start_time} → {result.end_time}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Duration: {result.planned_duration_min} min ({Math.floor(result.planned_duration_min/60)}h {result.planned_duration_min%60}m)
                  </div>
                </div>
              </div>

              {/* Conflicting Trains Table */}
              {result.conflict_count > 0 && (
                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--signal-red-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    <span>Directly conflicting train services ({result.conflict_count})</span>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Train #</th>
                          <th>Train name</th>
                          <th>Type</th>
                          <th>Direction</th>
                          <th>Entry</th>
                          <th>Exit</th>
                          <th>Overlap</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.conflicts.map((c, idx) => (
                          <tr key={idx} style={{ background: 'var(--signal-red-bg)' }}>
                            <td className="mono-text" style={{ fontWeight: '700', color: 'var(--signal-red-text)' }}>
                              {c.train_number}
                            </td>
                            <td style={{ fontWeight: '500' }}>
                              {c.train_name}
                            </td>
                            <td>
                              <span className="badge badge-slate">
                                {c.train_type}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {c.from_station} → {c.to_station}
                              </span>
                            </td>
                            <td className="mono-text">{c.scheduled_entry_time}</td>
                            <td className="mono-text">{c.scheduled_exit_time}</td>
                            <td className="mono-text" style={{ color: 'var(--signal-red)', fontWeight: '700' }}>
                              {c.overlap_minutes} min
                            </td>
                            <td>
                              <span className="badge badge-red">
                                {c.buffer_breach ? 'Buffer breach' : 'Direct occupancy'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline Context Table */}
              <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--signal-amber)" />
                    <span>Scheduled trains nearby window (±12h context)</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {result.timeline_context.length} movements recorded
                  </span>
                </div>

                {result.timeline_context.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No scheduled trains recorded in the immediate timeframe.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Train #</th>
                          <th>Train name</th>
                          <th>Route</th>
                          <th>Entry</th>
                          <th>Exit</th>
                          <th>Status relative to block</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.timeline_context.map((t, idx) => {
                          const isConf = t.is_conflict;
                          return (
                            <tr key={idx} style={{ background: isConf ? 'var(--signal-red-bg)' : 'transparent' }}>
                              <td className="mono-text" style={{ fontWeight: '600', color: isConf ? 'var(--signal-red-text)' : 'var(--text-primary)' }}>
                                {t.train_number}
                              </td>
                              <td>{t.train_name}</td>
                              <td>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
    </section>
  );
}
