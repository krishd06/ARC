import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Filter, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Wrench, ShieldAlert, Train,
  Paperclip, FileText, Image as ImageIcon, File, Eye,
  Layers, Users, TrendingUp, Package, AlertOctagon,
  CalendarDays, ChevronLeft, ChevronRight, Activity, ArrowRight
} from 'lucide-react';
import { 
  hasDocumentsForEvent, 
  getDocumentsForEvent, 
  getCustomBlocks 
} from '../utils/documentStore';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function MaintenanceCalendar({ metaOptions }) {
  const [calendarView, setCalendarView] = useState('daily'); // 'daily', 'weekly', 'monthly'

  // Daily Register State
  const [logs, setLogs] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Filters for Daily Register
  const [corridorFilter, setCorridorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Weekly Plan State
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyStartDate, setWeeklyStartDate] = useState('2026-08-01');

  // Monthly Rollup State
  const [monthlyPlan, setMonthlyPlan] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Fetch Daily Register Logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (corridorFilter) params.append('corridor', corridorFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (issueTypeFilter) params.append('issue_type', issueTypeFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const res = await fetch(`/api/maintenance-logs?${params.toString()}`);
      const data = await res.json();
      const apiLogs = data.logs || [];

      // Merge custom user-created blocks from local storage matching filters
      const customBlocks = getCustomBlocks().filter(b => {
        if (corridorFilter && b.corridor !== corridorFilter) return false;
        if (statusFilter && b.status !== statusFilter) return false;
        if (severityFilter && b.severity !== severityFilter) return false;
        if (issueTypeFilter && b.issue_type !== issueTypeFilter) return false;
        if (departmentFilter && b.department !== departmentFilter) return false;
        return true;
      });

      const combined = [...customBlocks, ...apiLogs];
      setLogs(combined);
      setKpis(data.kpis || null);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Weekly Plan
  const fetchWeeklyPlan = async () => {
    setWeeklyLoading(true);
    try {
      const res = await fetch(`/api/weekly-plan?start_date=${weeklyStartDate}`);
      const data = await res.json();
      setWeeklyPlan(data);
    } catch (err) {
      console.error('Error fetching weekly plan:', err);
    } finally {
      setWeeklyLoading(false);
    }
  };

  // Fetch Monthly Plan
  const fetchMonthlyPlan = async () => {
    setMonthlyLoading(true);
    try {
      const res = await fetch('/api/monthly-plan');
      const data = await res.json();
      setMonthlyPlan(data);
    } catch (err) {
      console.error('Error fetching monthly plan:', err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [corridorFilter, statusFilter, severityFilter, issueTypeFilter, departmentFilter]);

  useEffect(() => {
    if (calendarView === 'weekly') {
      fetchWeeklyPlan();
    } else if (calendarView === 'monthly') {
      fetchMonthlyPlan();
    }
  }, [calendarView, weeklyStartDate]);

  // Re-fetch if a new block or document is added
  useEffect(() => {
    const handleDocChange = () => {
      fetchLogs();
      if (calendarView === 'weekly') fetchWeeklyPlan();
      if (calendarView === 'monthly') fetchMonthlyPlan();
    };
    window.addEventListener('rail_sentinel_doc_change', handleDocChange);
    return () => window.removeEventListener('rail_sentinel_doc_change', handleDocChange);
  }, [corridorFilter, statusFilter, severityFilter, issueTypeFilter, departmentFilter, calendarView]);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return <span className="badge badge-green"><CheckCircle2 size={11} /> Completed</span>;
      case 'Overrun':
        return <span className="badge badge-red"><AlertTriangle size={11} /> Overrun</span>;
      case 'Planned':
        return <span className="badge badge-amber"><Clock size={11} /> Planned</span>;
      case 'Cancelled-Rescheduled':
        return <span className="badge badge-amber"><XCircle size={11} /> Rescheduled</span>;
      default:
        return <span className="badge badge-slate">{st}</span>;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'High':
        return <span className="badge badge-red">High</span>;
      case 'Medium':
        return <span className="badge badge-amber">Medium</span>;
      case 'Low':
        return <span className="badge badge-green">Low</span>;
      default:
        return <span>{sev}</span>;
    }
  };

  const getDepartmentBadge = (dept) => {
    const d = dept || 'Civil Engineering';
    if (d.includes('Civil')) {
      return <span className="badge" style={{ background: 'rgba(79, 157, 105, 0.12)', border: '1px solid rgba(79, 157, 105, 0.3)', color: '#4F9D69', fontSize: '0.68rem' }}>P-Way / Civil</span>;
    }
    if (d.includes('Electrical') || d.includes('TRD')) {
      return <span className="badge" style={{ background: 'rgba(227, 166, 62, 0.12)', border: '1px solid rgba(227, 166, 62, 0.3)', color: '#E3A63E', fontSize: '0.68rem' }}>Electrical (TRD)</span>;
    }
    if (d.includes('Signal') || d.includes('S&T')) {
      return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.68rem' }}>Signal & Telecom</span>;
    }
    return <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>{d}</span>;
  };

  return (
    <section className="panel-calendar">
      {/* Panel Header & View Switcher */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ maxWidth: '660px' }}>
          <div className="panel-title">
            <CalendarIcon size={20} color="var(--signal-amber)" />
            <span>Maintenance Block Planning & Operational Calendars</span>
          </div>
          <p className="panel-desc">
            Integrated multi-tier scheduling console: Daily execution register with document dossiers, 7-day corridor timeline with multi-department coordination flags, and 5-week monthly forecast rollups aligned with FOIS freight pipeline.
          </p>
        </div>

        {/* View Switcher Tabs (Daily / Weekly / Monthly) */}
        <div style={{ display: 'flex', background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '3px', gap: '4px' }}>
          <button
            type="button"
            className={`btn btn-sm ${calendarView === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setCalendarView('daily')}
          >
            <CalendarIcon size={14} />
            <span>Daily Register</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${calendarView === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setCalendarView('weekly')}
          >
            <CalendarDays size={14} />
            <span>Weekly Corridor Plan</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${calendarView === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setCalendarView('monthly')}
          >
            <TrendingUp size={14} />
            <span>Monthly Rollup & Freight</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DAILY REGISTER */}
      {/* ========================================================================= */}
      {calendarView === 'daily' && (
        <>
          {/* Operational KPIs */}
          {kpis && (
            <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="kpi-card">
                <div>
                  <div className="kpi-val">{kpis.total_blocks}</div>
                  <div className="kpi-lbl">Total events</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Filtered records</div>
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-val" style={{ color: 'var(--signal-green)' }}>{kpis.on_time_rate_pct}%</div>
                  <div className="kpi-lbl">On-time rate</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kpis.completed_count} on time</div>
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-val" style={{ color: 'var(--signal-red)' }}>{kpis.overrun_rate_pct}%</div>
                  <div className="kpi-lbl">Overrun rate</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kpis.overrun_count} exceeded slot</div>
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-val" style={{ color: '#c084fc' }}>{kpis.coordination_count || 0}</div>
                  <div className="kpi-lbl">Multi-Dept Coordinated</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Joint block opportunities</div>
                </div>
              </div>

              <div className="kpi-card">
                <div>
                  <div className="kpi-val" style={{ color: 'var(--signal-amber)' }}>{kpis.total_trains_affected}</div>
                  <div className="kpi-lbl">Trains regulated</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Services delayed</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                <Filter size={15} />
                <strong style={{ color: 'var(--text-primary)' }}>Filters:</strong>
              </div>

              {/* Corridor */}
              <select 
                className="form-select" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                value={corridorFilter}
                onChange={(e) => setCorridorFilter(e.target.value)}
              >
                <option value="">All corridors</option>
                {metaOptions?.corridors?.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              {/* Department Filter */}
              <select 
                className="form-select" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All departments</option>
                {metaOptions?.departments?.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>

              {/* Status */}
              <select 
                className="form-select" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {metaOptions?.statuses?.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>

              {/* Severity */}
              <select 
                className="form-select" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All severities</option>
                {metaOptions?.severities?.map((s, i) => (
                  <option key={i} value={s}>{s}</option>
                ))}
              </select>

              {/* Issue Type */}
              <select 
                className="form-select" 
                style={{ padding: '5px 10px', fontSize: '0.8rem', maxWidth: '220px' }}
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value)}
              >
                <option value="">All issue types</option>
                {metaOptions?.issue_types?.map((it, i) => (
                  <option key={i} value={it}>{it}</option>
                ))}
              </select>

              {(corridorFilter || statusFilter || severityFilter || issueTypeFilter || departmentFilter) && (
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCorridorFilter('');
                    setStatusFilter('');
                    setSeverityFilter('');
                    setIssueTypeFilter('');
                    setDepartmentFilter('');
                  }}
                >
                  Reset filters
                </button>
              )}

              <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{logs.length}</strong> events
              </div>
            </div>
          </div>

          {/* Main Register Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Date</th>
                  <th>Track & Section</th>
                  <th>Department & Resource</th>
                  <th>Issue Type</th>
                  <th>Severity</th>
                  <th>Window</th>
                  <th>Duration</th>
                  <th>Coordination / Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const diff = log.actual_duration_min > 0 ? (log.actual_duration_min - log.planned_duration_min) : 0;
                  const isOverrun = log.status === 'Overrun';
                  const hasDocs = hasDocumentsForEvent(log.event_id);
                  const isCoord = log.coordination_needed;

                  return (
                    <tr key={log.event_id} style={{ background: isOverrun ? 'var(--signal-red-bg)' : (isCoord ? 'rgba(192, 132, 252, 0.05)' : 'transparent') }}>
                      <td className="mono-text" style={{ fontWeight: '700', color: isOverrun ? 'var(--signal-red-text)' : 'var(--signal-amber-text)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{log.event_id}</span>
                          {hasDocs && (
                            <span 
                              title="Condition documents attached to this block"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--signal-amber-bg)',
                                border: '1px solid var(--signal-amber-border)',
                                borderRadius: '2px',
                                padding: '1px 4px',
                                color: 'var(--signal-amber-text)',
                                fontSize: '0.68rem',
                                cursor: 'help'
                              }}
                            >
                              <Paperclip size={11} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="mono-text" style={{ fontSize: '0.78rem' }}>{log.date}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{log.track_id} ({log.section})</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.corridor}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {getDepartmentBadge(log.department)}
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)' }}>{log.machine_resource}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{log.issue_type}</td>
                      <td>{getSeverityBadge(log.severity)}</td>
                      <td className="mono-text" style={{ fontSize: '0.78rem' }}>
                        {log.block_start?.split(' ')[1] || log.block_start} ➔ {log.block_end?.split(' ')[1] || log.block_end}
                      </td>
                      <td>
                        <div className="mono-text" style={{ fontSize: '0.8rem' }}>
                          {log.planned_duration_min}m / {log.actual_duration_min}m
                        </div>
                        {diff > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--signal-red)', fontWeight: '700' }}>
                            +{diff}m overrun
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          {getStatusBadge(log.status)}
                          {isCoord && (
                            <span 
                              className="badge" 
                              style={{ 
                                background: 'rgba(192, 132, 252, 0.15)', 
                                border: '1px solid rgba(192, 132, 252, 0.4)', 
                                color: '#c084fc',
                                fontSize: '0.66rem',
                                cursor: 'pointer'
                              }}
                              title="Multi-department simultaneous possession opportunity"
                              onClick={() => setSelectedEvent(log)}
                            >
                              🤝 Coordination needed
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
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
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: WEEKLY CORRIDOR PLAN */}
      {/* ========================================================================= */}
      {calendarView === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Week Selector Bar */}
          <div style={{ 
            background: 'var(--bg-panel-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '2px', 
            padding: '12px 18px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={18} color="var(--signal-amber)" />
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                  Next 7 Days Corridor Maintenance Plan
                </strong>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {weeklyPlan ? `${weeklyPlan.start_date} through ${weeklyPlan.end_date}` : 'Loading window...'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Window Start:</span>
              <input 
                type="date"
                className="form-input mono-text"
                style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
                value={weeklyStartDate}
                onChange={(e) => setWeeklyStartDate(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchWeeklyPlan}
              >
                Refresh Plan
              </button>
            </div>
          </div>

          {weeklyLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Generating corridor-level 7-day schedule rollup...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {weeklyPlan?.corridors?.map((cp, cIdx) => (
                <div 
                  key={cIdx} 
                  style={{ 
                    background: 'var(--bg-panel)', 
                    border: '1px solid var(--border-subtle)', 
                    borderTop: '3px solid var(--signal-amber)',
                    borderRadius: '2px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Corridor Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Train size={18} color="var(--signal-amber)" />
                      <h3 style={{ fontSize: '1.02rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                        {cp.corridor}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-slate" style={{ fontSize: '0.74rem' }}>
                        {cp.planned_blocks_count} Planned Blocks ({cp.planned_hours} hrs)
                      </span>
                      {cp.coordination_needed_count > 0 && (
                        <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', fontSize: '0.74rem' }}>
                          🤝 {cp.coordination_needed_count} Joint Blocks Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Planned Blocks in this Corridor */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Scheduled Maintenance Possession Blocks (Next 7 Days)
                    </div>

                    {cp.planned_blocks.length === 0 ? (
                      <div style={{ background: 'var(--bg-panel-elevated)', padding: '10px 14px', borderRadius: '2px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        No scheduled possession blocks in this corridor for the selected 7-day window.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                        {cp.planned_blocks.map(b => (
                          <div 
                            key={b.event_id} 
                            style={{ 
                              background: 'var(--bg-panel-elevated)', 
                              border: b.coordination_needed ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid var(--border-subtle)', 
                              borderRadius: '2px', 
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span className="mono-text" style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--signal-amber)' }}>
                                  {b.date} • {b.block_start?.split(' ')[1] || b.block_start}
                                </span>
                                <div style={{ fontWeight: '600', fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                                  {b.track_id}: {b.section}
                                </div>
                              </div>
                              <span className={`badge ${b.severity === 'High' ? 'badge-red' : (b.severity === 'Medium' ? 'badge-amber' : 'badge-green')}`} style={{ fontSize: '0.66rem' }}>
                                {b.severity}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {b.issue_type} • <strong style={{ color: 'var(--text-primary)' }}>{b.machine_resource}</strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
                              {getDepartmentBadge(b.department)}
                              {b.coordination_needed ? (
                                <span style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: '700' }}>
                                  🤝 Joint Block Coordination
                                </span>
                              ) : (
                                <span className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {b.planned_duration_min} min window
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top Unscheduled Priority Items in this Corridor */}
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertOctagon size={13} color="var(--signal-amber)" />
                      <span>Top Unscheduled Priority Items Ready for Slot Grant</span>
                    </div>

                    {cp.top_unscheduled_priority_items.length === 0 ? (
                      <div style={{ background: 'var(--bg-panel-elevated)', padding: '8px 12px', borderRadius: '2px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        All safety-critical work orders in this corridor currently have allocated slots.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
                        {cp.top_unscheduled_priority_items.map(p => (
                          <div 
                            key={p.event_id} 
                            style={{ 
                              background: 'var(--bg-panel-deep)', 
                              border: '1px solid var(--border-subtle)', 
                              borderLeft: '3px solid var(--signal-red)',
                              borderRadius: '2px', 
                              padding: '8px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="mono-text" style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--signal-red)' }}>
                                  Priority {p.priority_score}
                                </span>
                                <span style={{ fontSize: '0.76rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {p.issue_type}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {p.track_id} ({p.section_name}) • {p.days_overdue > 0 ? `${p.days_overdue}d overdue` : `${p.days_pending}d pending`}
                              </div>
                            </div>

                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                              onClick={() => setSelectedEvent(p)}
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MONTHLY STRATEGIC ROLLUP & GOODS TRAIN FORECAST */}
      {/* ========================================================================= */}
      {calendarView === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header Info Note */}
          <div style={{ 
            background: 'var(--bg-panel-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderLeft: '4px solid #c084fc',
            borderRadius: '2px', 
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ maxWidth: '820px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Monthly Rollup & Freight Pipeline Integration: </strong>
              Cross-references <strong>FOIS Goods Train Forecasts (`goods_train_forecast.csv`)</strong> across 5 weeks to highlight corridor capacity constraints, high-density freight rushes (Containers, Coal, Automobiles, POL), and optimal windows for large-scale Track Relaying & Mega Blocks.
            </div>

            <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', fontSize: '0.76rem' }}>
              FOIS Forward Pipeline Active
            </span>
          </div>

          {monthlyLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Calculating multi-week freight forecasts and maintenance rollups...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {monthlyPlan?.weeks?.map((w, wIdx) => (
                <div 
                  key={wIdx} 
                  style={{ 
                    background: 'var(--bg-panel)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '2px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDays size={16} color="var(--signal-amber)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                        {w.week_label} ({w.week_starting} → {w.week_ending})
                      </strong>
                    </div>
                  </div>

                  {/* Corridor Rollup Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {w.corridors.map((c, cIdx) => (
                      <div 
                        key={cIdx} 
                        style={{ 
                          background: 'var(--bg-panel-elevated)', 
                          border: c.is_heavy_freight ? '1px solid var(--signal-red-border)' : '1px solid var(--border-subtle)', 
                          borderTop: c.is_heavy_freight ? '3px solid var(--signal-red)' : '3px solid var(--signal-green)',
                          borderRadius: '2px', 
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                              {c.corridor}
                            </strong>
                            {c.is_heavy_freight ? (
                              <span className="badge badge-red" style={{ fontSize: '0.64rem' }}>
                                Heavy Freight
                              </span>
                            ) : (
                              <span className="badge badge-green" style={{ fontSize: '0.64rem' }}>
                                Normal Pipeline
                              </span>
                            )}
                          </div>

                          {/* Planned vs Backlog */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', background: 'var(--bg-panel-deep)', padding: '6px 8px', borderRadius: '2px' }}>
                            <div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planned Blocks</div>
                              <div className="mono-text" style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--signal-green)' }}>
                                {c.planned_blocks} ({c.planned_hours}h)
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Backlog</div>
                              <div className="mono-text" style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--signal-amber)' }}>
                                {c.backlog_items_count} items
                              </div>
                            </div>
                          </div>

                          {/* Freight Forecast */}
                          <div style={{ marginTop: '8px', fontSize: '0.74rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                              <span>Forecast Freight:</span>
                              <strong className="mono-text" style={{ color: c.is_heavy_freight ? 'var(--signal-red)' : 'var(--text-primary)' }}>
                                {c.forecast_freight_trains} trains/wk
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span>Dominant Commodity:</span>
                              <span className="badge badge-slate" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                {c.dominant_commodity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Planner Guidance */}
                        <div style={{ 
                          fontSize: '0.72rem', 
                          color: c.is_heavy_freight ? 'var(--signal-red-text)' : 'var(--text-muted)', 
                          background: c.is_heavy_freight ? 'var(--signal-red-bg)' : 'transparent',
                          padding: c.is_heavy_freight ? '6px 8px' : '0',
                          borderRadius: '2px',
                          lineHeight: 1.3
                        }}>
                          {c.planner_guidance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Event Details Dossier Modal */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 18, 22, 0.85)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }} onClick={() => setSelectedEvent(null)}>
          <div 
            style={{ 
              maxWidth: '560px', 
              width: '100%', 
              background: 'var(--bg-panel)', 
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid var(--signal-amber)',
              borderRadius: '2px',
              padding: '20px',
              boxShadow: 'var(--shadow-panel)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={18} color="var(--signal-amber)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Maintenance event dossier: {selectedEvent.event_id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                {getStatusBadge(selectedEvent.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Owning Department</span>
                {getDepartmentBadge(selectedEvent.department)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Issue classification</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedEvent.issue_type}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity level</span>
                {getSeverityBadge(selectedEvent.severity)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Corridor & section</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.corridor} ({selectedEvent.section})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chainage</span>
                <span className="mono-text" style={{ color: 'var(--signal-amber)' }}>KM {selectedEvent.track_position_km}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned machine resource</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.machine_resource}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled window</span>
                <span className="mono-text">{selectedEvent.block_start} to {selectedEvent.block_end}</span>
              </div>

              {/* Multi-Department Coordination Section if present */}
              {selectedEvent.coordination_needed && selectedEvent.coordination_info && (
                <div style={{
                  background: 'rgba(192, 132, 252, 0.1)',
                  border: '1px solid rgba(192, 132, 252, 0.35)',
                  borderRadius: '2px',
                  padding: '10px 12px',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontWeight: '700', fontSize: '0.82rem' }}>
                    <Users size={14} />
                    <span>Multi-Department Coordination Needed</span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {selectedEvent.coordination_info.directive}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Co-located block: <strong style={{ color: 'var(--text-primary)' }}>{selectedEvent.coordination_info.partner_event_id} ({selectedEvent.coordination_info.partner_department})</strong></span>
                    <span>{selectedEvent.coordination_info.relationship}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Planned vs actual</span>
                <span className="mono-text">
                  {selectedEvent.planned_duration_min}m plan / {selectedEvent.actual_duration_min}m act
                  {selectedEvent.actual_duration_min > selectedEvent.planned_duration_min && (
                    <strong style={{ color: 'var(--signal-red)' }}> (+{selectedEvent.actual_duration_min - selectedEvent.planned_duration_min}m overrun)</strong>
                  )}
                </span>
              </div>

              {/* Attached Condition Documents Section */}
              {(() => {
                const eventDocs = getDocumentsForEvent(selectedEvent.event_id);
                return (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        <Paperclip size={14} color="var(--signal-amber)" />
                        <span>Attached condition documents ({eventDocs.length})</span>
                      </div>
                    </div>

                    {eventDocs.length === 0 ? (
                      <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        No condition documents attached to this maintenance event.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                        {eventDocs.map(doc => (
                          <div 
                            key={doc.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '6px 10px', 
                              background: 'var(--bg-panel-elevated)', 
                              border: '1px solid var(--border-subtle)', 
                              borderRadius: '2px', 
                              fontSize: '0.74rem' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              {doc.file_type === 'pdf' ? (
                                <FileText size={13} color="var(--signal-red-text)" style={{ flexShrink: 0 }} />
                              ) : doc.file_type === 'image' ? (
                                <ImageIcon size={13} color="var(--signal-green-text)" style={{ flexShrink: 0 }} />
                              ) : (
                                <File size={13} color="var(--signal-amber-text)" style={{ flexShrink: 0 }} />
                              )}
                              <span className="mono-text" style={{ fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.filename}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                ({doc.size_formatted})
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye size={11} />
                              <span>View</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Condition Document Lightbox Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
    </section>
  );
}
