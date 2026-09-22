import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Filter, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Wrench, ShieldAlert, Train, ChevronRight
} from 'lucide-react';

export default function MaintenanceCalendar({ metaOptions }) {
  const [logs, setLogs] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filters
  const [corridorFilter, setCorridorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (corridorFilter) params.append('corridor', corridorFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (issueTypeFilter) params.append('issue_type', issueTypeFilter);

      const res = await fetch(`/api/maintenance-logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setKpis(data.kpis || null);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [corridorFilter, statusFilter, severityFilter, issueTypeFilter]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return <span className="badge badge-green"><CheckCircle2 size={12} /> Completed</span>;
      case 'Overrun':
        return <span className="badge badge-red"><AlertTriangle size={12} /> Overrun</span>;
      case 'Planned':
        return <span className="badge badge-cyan"><Clock size={12} /> Planned</span>;
      case 'Cancelled-Rescheduled':
        return <span className="badge badge-amber"><XCircle size={12} /> Rescheduled</span>;
      default:
        return <span className="badge badge-purple">{st}</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'High':
        return <span className="badge badge-red" style={{ fontSize: '0.68rem' }}>High</span>;
      case 'Medium':
        return <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Medium</span>;
      case 'Low':
        return <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>Low</span>;
      default:
        return <span>{sev}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarIcon size={22} color="#a855f7" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
              Maintenance Calendar & Operations Dashboard
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '2px' }}>
              Comprehensive 30-day simulated maintenance event history across Maharashtra Central Railway (August 2026). Tracks execution reliability, machine mobilization, and overruns.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Total Events</span>
            <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              {kpis.total_blocks}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Filtered logs</span>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>On-Time Rate</span>
            <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {kpis.on_time_rate_pct}%
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{kpis.completed_count} completed on time</span>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Overrun Rate</span>
            <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
              {kpis.overrun_rate_pct}%
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{kpis.overrun_count} blocks exceeded slot</span>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Cancelled / Rescheduled</span>
            <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>
              {kpis.cancelled_count}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Deferred for traffic relief</span>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Trains Affected</span>
            <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
              {kpis.total_trains_affected}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Scheduled services regulated</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
            <Filter size={16} />
            <strong style={{ color: '#cbd5e1' }}>Filters:</strong>
          </div>

          {/* Corridor */}
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            value={corridorFilter}
            onChange={(e) => setCorridorFilter(e.target.value)}
          >
            <option value="">All Corridors</option>
            {metaOptions?.corridors?.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Status */}
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {metaOptions?.statuses?.map((st, i) => (
              <option key={i} value={st}>{st}</option>
            ))}
          </select>

          {/* Severity */}
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            {metaOptions?.severities?.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          {/* Issue Type */}
          <select 
            className="form-select" 
            style={{ padding: '6px 12px', fontSize: '0.82rem', maxWidth: '240px' }}
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
          >
            <option value="">All Issue Types</option>
            {metaOptions?.issue_types?.map((it, i) => (
              <option key={i} value={it}>{it}</option>
            ))}
          </select>

          {(corridorFilter || statusFilter || severityFilter || issueTypeFilter) && (
            <button 
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => {
                setCorridorFilter('');
                setStatusFilter('');
                setSeverityFilter('');
                setIssueTypeFilter('');
              }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8' }}>
            Showing <strong>{logs.length}</strong> events
          </div>
        </div>
      </div>

      {/* Main Table + Event Details Modal */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Date</th>
                <th>Track & Section</th>
                <th>Chainage KM</th>
                <th>Issue Type</th>
                <th>Severity</th>
                <th>Machine Resource</th>
                <th>Scheduled Window</th>
                <th>Duration (Plan / Act)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const diff = log.actual_duration_min > 0 ? (log.actual_duration_min - log.planned_duration_min) : 0;
                const isOverrun = log.status === 'Overrun';

                return (
                  <tr key={log.event_id}>
                    <td className="mono-text" style={{ fontWeight: '700', color: '#38bdf8' }}>
                      {log.event_id}
                    </td>
                    <td className="mono-text" style={{ fontSize: '0.8rem' }}>{log.date}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{log.track_id} ({log.section})</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.corridor}</div>
                    </td>
                    <td className="mono-text" style={{ fontSize: '0.8rem' }}>{log.track_position_km} km</td>
                    <td style={{ fontSize: '0.84rem' }}>{log.issue_type}</td>
                    <td>{getSeverityBadge(log.severity)}</td>
                    <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{log.machine_resource}</td>
                    <td className="mono-text" style={{ fontSize: '0.8rem' }}>
                      {log.block_start?.split(' ')[1] || log.block_start} ➔ {log.block_end?.split(' ')[1] || log.block_end}
                    </td>
                    <td>
                      <div className="mono-text" style={{ fontSize: '0.82rem' }}>
                        {log.planned_duration_min}m / {log.actual_duration_min}m
                      </div>
                      {diff > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>
                          +{diff}m overrun
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        onClick={() => setSelectedEvent(log)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer for Event Details */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }} onClick={() => setSelectedEvent(null)}>
          <div 
            className="glass-card" 
            style={{ 
              maxWidth: '560px', 
              width: '100%', 
              background: '#0d1733', 
              border: '1px solid #2a488a',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
                  Maintenance Event Dossier: {selectedEvent.event_id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                {getStatusBadge(selectedEvent.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Issue Classification:</span>
                <strong style={{ color: '#ffffff' }}>{selectedEvent.issue_type}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Severity Level:</span>
                {getSeverityBadge(selectedEvent.severity)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Corridor & Section:</span>
                <span style={{ color: '#f8fafc' }}>{selectedEvent.corridor} ({selectedEvent.section})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Exact Chainage:</span>
                <span className="mono-text" style={{ color: '#38bdf8' }}>KM {selectedEvent.track_position_km}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Assigned Machine Resource:</span>
                <span style={{ color: '#f8fafc' }}>{selectedEvent.machine_resource}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Scheduled Time Window:</span>
                <span className="mono-text">{selectedEvent.block_start} to {selectedEvent.block_end}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Planned vs Actual Duration:</span>
                <span className="mono-text">
                  {selectedEvent.planned_duration_min} min planned / {selectedEvent.actual_duration_min} min actual
                  {selectedEvent.actual_duration_min > selectedEvent.planned_duration_min && (
                    <strong style={{ color: '#ef4444' }}> (+{selectedEvent.actual_duration_min - selectedEvent.planned_duration_min}m overrun)</strong>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Scheduled Trains Affected:</span>
                <span className="mono-text" style={{ color: selectedEvent.trains_affected > 0 ? '#f59e0b' : '#10b981', fontWeight: '700' }}>
                  {selectedEvent.trains_affected} trains
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
