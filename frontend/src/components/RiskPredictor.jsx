import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, ShieldAlert, CheckCircle2, AlertTriangle, 
  TrendingUp, Clock, Wrench, Shield, ArrowRight, Activity
} from 'lucide-react';

export default function RiskPredictor({ segments, metaOptions }) {
  const [issueType, setIssueType] = useState('Points & crossing wear');
  const [severity, setSeverity] = useState('High');
  const [machineResource, setMachineResource] = useState('P&C Maintenance Gang');
  const [selectedTrackId, setSelectedTrackId] = useState('T003');
  const [plannedDuration, setPlannedDuration] = useState(120);
  const [startTime, setStartTime] = useState('02:00');

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

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
    if (score >= 60) return '#ef4444';
    if (score >= 35) return '#f59e0b';
    if (score >= 20) return '#eab308';
    return '#10b981';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={22} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
              AI Overrun Risk Predictor & Contingency Scoring
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '2px' }}>
              Probabilistic Bayesian risk assessment trained on 82 historical block events. Evaluates issue type, ghat gradient challenges, resource availability, and duration adequacy to predict overrun risk before block approval.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form & Prediction Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: '400px 1fr', alignItems: 'start' }}>
        {/* Input Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#38bdf8" />
            Maintenance Request Parameters
          </h3>

          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Issue Classification</label>
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
              <label className="form-label">Severity Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['Low', 'Medium', 'High'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`btn ${severity === s ? (s === 'High' ? 'btn-danger' : 'btn-primary') : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '8px' }}
                    onClick={() => setSeverity(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Machine / Crew Resource</label>
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
              <label className="form-label">Target Track Segment</label>
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
                <label className="form-label">Planned Block Duration</label>
                <span className="mono-text" style={{ color: '#38bdf8', fontWeight: '700' }}>{plannedDuration} min</span>
              </div>
              <input 
                type="range"
                min="30"
                max="300"
                step="15"
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(e.target.value)}
                style={{ accentColor: '#38bdf8' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Duration in minutes for track possession.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '6px' }}
            >
              {loading ? 'Evaluating Model...' : 'Calculate AI Risk Score'}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div className="glass-card" style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
              <div style={{ color: '#f87171' }}>{error}</div>
            </div>
          )}

          {prediction && (
            <>
              {/* Score Gauge Card */}
              <div 
                className="glass-card"
                style={{
                  background: `linear-gradient(135deg, ${getScoreColor(prediction.ai_risk_score)}18 0%, rgba(17, 32, 70, 0.9) 100%)`,
                  border: `1px solid ${getScoreColor(prediction.ai_risk_score)}55`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Visual Gauge Circle */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      border: `4px solid ${getScoreColor(prediction.ai_risk_score)}`,
                      boxShadow: `0 0 20px ${getScoreColor(prediction.ai_risk_score)}44`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#070d1e'
                    }}>
                      <span className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: getScoreColor(prediction.ai_risk_score) }}>
                        {prediction.ai_risk_score}%
                      </span>
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#94a3b8' }}>Risk</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${prediction.risk_tier === 'Severe Risk' ? 'badge-red' : (prediction.risk_tier === 'Elevated Risk' ? 'badge-amber' : 'badge-green')}`}>
                          {prediction.risk_tier}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          {prediction.section_name} ({prediction.corridor})
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>
                        Estimated Overrun Probability: {prediction.ai_risk_score}%
                      </h3>
                      <p style={{ color: '#cbd5e1', fontSize: '0.86rem', marginTop: '4px' }}>
                        Recommended Contingency Buffer:{' '}
                        <strong className="mono-text" style={{ color: '#38bdf8' }}>+{prediction.recommended_buffer_min} minutes</strong>
                      </p>
                    </div>
                  </div>

                  {/* Benchmark Capsule */}
                  <div style={{ background: '#09132b', border: '1px solid #1e3264', borderRadius: '10px', padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Historical Average</div>
                    <div className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {prediction.historical_avg_duration_min} min
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {prediction.benchmark_stats.total_past_events} past records ({prediction.benchmark_stats.past_overruns} overruns)
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainable Factor Breakdown */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#38bdf8" />
                  Key Risk Contributors (Explainable AI Model)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {prediction.factors.map((f, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#09132b', 
                        border: '1px solid #1e3264', 
                        borderRadius: '8px', 
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#f8fafc' }}>{f.name}</strong>
                        <span className={`badge ${f.type === 'negative' ? 'badge-red' : (f.type === 'positive' ? 'badge-green' : 'badge-cyan')}`} style={{ fontSize: '0.68rem' }}>
                          {f.impact}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '8px' }}>
                        {f.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Mitigations */}
              <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} />
                  Operational Mitigation Directives
                </h4>
                <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {prediction.mitigations.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
