import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, ShieldAlert, CheckCircle2, AlertTriangle, 
  TrendingUp, Clock, Wrench, Shield, Activity, Zap,
  ListOrdered, Layers, Filter, ArrowUpRight, Calendar
} from 'lucide-react';

export default function RiskPredictor({ segments, metaOptions, onSelectForBlock }) {
  const [activeTab, setActiveTab] = useState('prioritization'); // 'prioritization' or 'overrun'

  // Prioritization Engine State
  const [priorityItems, setPriorityItems] = useState([]);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityCorridorFilter, setPriorityCorridorFilter] = useState('');
  const [prioritySeverityFilter, setPrioritySeverityFilter] = useState('');

  // Overrun Predictor State
  const [issueType, setIssueType] = useState('Points & crossing wear');
  const [severity, setSeverity] = useState('High');
  const [machineResource, setMachineResource] = useState('P&C Maintenance Gang');
  const [selectedTrackId, setSelectedTrackId] = useState('T003');
  const [plannedDuration, setPlannedDuration] = useState(120);
  const [startTime, setStartTime] = useState('02:00');

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [animScore, setAnimScore] = useState(0);

  // Fetch Prioritized Maintenance List
  const fetchPrioritizedList = async () => {
    setPriorityLoading(true);
    try {
      const res = await fetch('/api/prioritized-maintenance?limit=50');
      const data = await res.json();
      setPriorityItems(data.items || []);
    } catch (err) {
      console.error('Failed to load prioritized maintenance queue:', err);
    } finally {
      setPriorityLoading(false);
    }
  };

  useEffect(() => {
    fetchPrioritizedList();
  }, []);

  // Set default values when metaOptions load
  useEffect(() => {
    if (metaOptions) {
      if (metaOptions.issue_types?.length > 0 && !issueType) {
        setIssueType(metaOptions.issue_types[0]);
      }
      if (metaOptions.machine_resources?.length > 0 && !machineResource) {
        setMachineResource(metaOptions.machine_resources[0]);
      }
    }
  }, [metaOptions]);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/predict-overrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: issueType,
          severity: severity,
          machine_resource: machineResource,
          track_id: selectedTrackId,
          planned_duration_min: parseInt(plannedDuration, 10),
          block_start_time: startTime
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Prediction failed');
      }

      const data = await res.json();
      setPrediction(data);

      // Animate score counter into view on calculation (interaction-triggered motion)
      let current = 0;
      const target = data.ai_risk_score || 0;
      const step = Math.max(1, Math.round(target / 20));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          setAnimScore(target);
          clearInterval(timer);
        } else {
          setAnimScore(current);
        }
      }, 20);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePredict();
  }, [issueType, severity, machineResource, selectedTrackId, plannedDuration]);

  const getScoreColor = (score) => {
    if (score >= 60) return 'var(--signal-red)';
    if (score >= 35) return 'var(--signal-amber)';
    return 'var(--signal-green)';
  };

  const getPriorityScoreColor = (score) => {
    if (score >= 80) return 'var(--signal-red)';
    if (score >= 60) return 'var(--signal-amber)';
    if (score >= 40) return '#eab308';
    return 'var(--signal-green)';
  };

  // Filter prioritized items
  const filteredPriorityItems = priorityItems.filter(item => {
    if (priorityCorridorFilter && !item.corridor.toLowerCase().includes(priorityCorridorFilter.toLowerCase())) return false;
    if (prioritySeverityFilter && item.severity.toLowerCase() !== prioritySeverityFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <section className="panel-predictor">
      {/* Panel Header & Dual Tab Navigation */}
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ maxWidth: '640px' }}>
          <div className="panel-title">
            <BrainCircuit size={20} color="var(--signal-amber)" />
            <span>Maintenance Prioritization Engine & Overrun Risk Analytics</span>
          </div>
          <p className="panel-desc">
            Dual AI decision-support module: ranks open defect work orders by operational urgency & safety criticality (0–100), and computes historical Bayesian overrun risk for proposed block warrants.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '3px', gap: '4px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'prioritization' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('prioritization')}
          >
            <Zap size={14} color={activeTab === 'prioritization' ? '#16242A' : 'var(--signal-amber)'} />
            <span>Top Priority Maintenance ({priorityItems.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'overrun' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('overrun')}
          >
            <Clock size={14} color={activeTab === 'overrun' ? '#16242A' : 'var(--signal-amber)'} />
            <span>Overrun Risk Predictor</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MAINTENANCE PRIORITIZATION ENGINE */}
      {activeTab === 'prioritization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Method Explainer Card */}
          <div style={{ 
            background: 'var(--bg-panel-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderLeft: '4px solid var(--signal-amber)',
            borderRadius: '2px', 
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '780px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Priority Score Formula (0–100): </strong>
              <span className="mono-text" style={{ color: 'var(--signal-amber)' }}>
                Score = Severity (0–35) + Urgency/Overdue (0–30) + Congestion (0–20) + Trains Affected (0–15)
              </span>
              <div style={{ marginTop: '2px', fontSize: '0.74rem' }}>
                Ranks safety-critical track defects to decide <em>which section receives immediate track possession</em>, separate from duration overrun likelihood.
              </div>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                className="form-select"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                value={priorityCorridorFilter}
                onChange={(e) => setPriorityCorridorFilter(e.target.value)}
              >
                <option value="">All Corridors</option>
                {metaOptions?.corridors?.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <select 
                className="form-select"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                value={prioritySeverityFilter}
                onChange={(e) => setPrioritySeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Ranked Priority Table */}
          <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th style={{ width: '130px' }}>Priority Score</th>
                  <th>Defect / Issue</th>
                  <th>Section & Corridor</th>
                  <th>Severity & Dept</th>
                  <th>Urgency / SLA</th>
                  <th>Congestion</th>
                  <th>Overrun Prob.</th>
                  <th>Action Directive</th>
                </tr>
              </thead>
              <tbody>
                {priorityLoading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Calculating multi-factorial priority rankings...
                    </td>
                  </tr>
                ) : filteredPriorityItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No items matching active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPriorityItems.map((item, idx) => {
                    const scoreColor = getPriorityScoreColor(item.priority_score);
                    return (
                      <tr key={item.event_id || idx} style={{ background: item.priority_score >= 80 ? 'rgba(193, 68, 60, 0.06)' : 'transparent' }}>
                        <td className="mono-text" style={{ fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center' }}>
                          #{idx + 1}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '3px',
                              background: 'var(--bg-panel-deep)',
                              border: `2px solid ${scoreColor}`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <span className="mono-text" style={{ fontSize: '1rem', fontWeight: '700', color: scoreColor }}>
                                {item.priority_score}
                              </span>
                            </div>
                            <div>
                              <span className={`badge ${item.priority_tier === 'Critical Priority' ? 'badge-red' : (item.priority_tier === 'High Priority' ? 'badge-amber' : 'badge-green')}`} style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                                {item.priority_tier}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                            {item.issue_type}
                          </div>
                          <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.event_id} • KM {item.track_position_km}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                            {item.track_id}: {item.section_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.corridor}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className={`badge ${item.severity === 'High' ? 'badge-red' : (item.severity === 'Medium' ? 'badge-amber' : 'badge-green')}`} style={{ width: 'fit-content', fontSize: '0.68rem' }}>
                              {item.severity}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {item.department || 'Civil Engineering'}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.78rem' }}>
                            {item.days_overdue > 0 ? (
                              <span style={{ color: 'var(--signal-red)', fontWeight: '700' }}>
                                ⚠️ {item.days_overdue}d Overdue
                              </span>
                            ) : (
                              <span style={{ color: 'var(--signal-green)' }}>
                                Within SLA ({item.days_pending}d / {item.sla_target_days}d target)
                              </span>
                            )}
                          </div>
                          <div className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Logged: {item.date}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                            {item.congestion_level} ({item.trains_affected || 0} trains)
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="mono-text" style={{ fontSize: '0.82rem', fontWeight: '700', color: getScoreColor(item.overrun_probability_pct) }}>
                              {item.overrun_probability_pct}%
                            </span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {item.overrun_risk_tier}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {item.action_recommendation}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: OVERRUN RISK PREDICTOR */}
      {activeTab === 'overrun' && (
        <div className="panels-grid-dual" style={{ gridTemplateColumns: '380px 1fr', alignItems: 'start' }}>
          {/* Controls Column */}
          <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '16px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--signal-amber)" />
              <span>Maintenance request parameters</span>
            </div>

            <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Issue classification</label>
                <select 
                  className="form-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                >
                  {metaOptions?.issue_types?.map((it, idx) => (
                    <option key={idx} value={it}>{it}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['Low', 'Medium', 'High'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm ${severity === s ? (s === 'High' ? 'btn-danger' : 'btn-primary') : 'btn-secondary'}`}
                      onClick={() => setSeverity(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Machine or crew resource</label>
                <select 
                  className="form-select"
                  value={machineResource}
                  onChange={(e) => setMachineResource(e.target.value)}
                >
                  {metaOptions?.machine_resources?.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target track segment</label>
                <select 
                  className="form-select"
                  value={selectedTrackId}
                  onChange={(e) => setSelectedTrackId(e.target.value)}
                >
                  {segments.map((seg) => (
                    <option key={seg.track_id} value={seg.track_id}>
                      {seg.track_id}: {seg.from_station} → {seg.to_station} ({seg.terrain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Planned block duration</label>
                  <span className="mono-text" style={{ color: 'var(--signal-amber)', fontWeight: '700' }}>{plannedDuration} min</span>
                </div>
                <input 
                  type="range"
                  min="30"
                  max="300"
                  step="15"
                  value={plannedDuration}
                  onChange={(e) => setPlannedDuration(e.target.value)}
                  style={{ accentColor: 'var(--signal-amber)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Target track possession duration in minutes.
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: '4px' }}
              >
                {loading ? 'Evaluating risk factors...' : 'Calculate overrun probability'}
              </button>
            </form>
          </div>

          {/* Prediction Results Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ border: '1px solid var(--signal-red-border)', background: 'var(--signal-red-bg)', padding: '12px 16px', borderRadius: '2px', color: 'var(--signal-red-text)' }}>
                {error}
              </div>
            )}

            {prediction && (
              <>
                {/* Dial Gauge & Score Bezel */}
                <div 
                  style={{
                    background: 'var(--bg-panel-elevated)',
                    border: `1px solid var(--border-subtle)`,
                    borderLeft: `5px solid ${getScoreColor(prediction.ai_risk_score)}`,
                    borderRadius: '3px',
                    padding: '18px 20px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      {/* Visual Circular Gauge */}
                      <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        border: `4px solid ${getScoreColor(prediction.ai_risk_score)}`,
                        boxShadow: `0 0 14px ${getScoreColor(prediction.ai_risk_score)}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-panel-deep)',
                        flexShrink: 0
                      }}>
                        <span className="mono-text" style={{ fontSize: '1.45rem', fontWeight: '700', color: getScoreColor(prediction.ai_risk_score) }}>
                          {animScore}%
                        </span>
                        <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Risk</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${prediction.risk_tier === 'Severe Risk' ? 'badge-red' : (prediction.risk_tier === 'Elevated Risk' ? 'badge-amber' : 'badge-green')}`}>
                            {prediction.risk_tier}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {prediction.section_name} ({prediction.corridor})
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.18rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                          Estimated overrun probability: {prediction.ai_risk_score}%
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                          Recommended contingency buffer:{' '}
                          <strong className="mono-text" style={{ color: 'var(--signal-amber)' }}>+{prediction.recommended_buffer_min} minutes</strong>
                        </p>
                      </div>
                    </div>

                    {/* Benchmark Reading */}
                    <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 14px', textAlign: 'left' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Historical average</div>
                      <div className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                        {prediction.historical_avg_duration_min} min
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {prediction.benchmark_stats.total_past_events} past records ({prediction.benchmark_stats.past_overruns} overruns)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explainable Risk Contributors */}
                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} color="var(--signal-amber)" />
                    <span>Key risk contributors (Bayesian likelihood analysis)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {prediction.factors.map((f, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--bg-panel-deep)', 
                          border: '1px solid var(--border-subtle)', 
                          borderRadius: '2px', 
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{f.name}</strong>
                          <span className={`badge ${f.type === 'negative' ? 'badge-red' : (f.type === 'positive' ? 'badge-green' : 'badge-slate')}`}>
                            {f.impact}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {f.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Mitigation Directives */}
                <div style={{ background: 'var(--signal-green-bg)', border: '1px solid var(--signal-green-border)', borderRadius: '2px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--signal-green-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} />
                    <span>Operational mitigation directives</span>
                  </div>
                  <ul style={{ paddingLeft: '18px', color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {prediction.mitigations.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
