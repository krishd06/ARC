import React, { useState } from 'react';
import { X, Calendar, Layers, Clock, Users, Filter, ArrowRight } from 'lucide-react';

export default function MultiHorizonGanttModal({ isOpen, onClose, blocks = [] }) {
  if (!isOpen) return null;

  const [activeHorizon, setActiveHorizon] = useState('7d'); // '7d' or '30d'
  const [selectedDept, setSelectedDept] = useState('all');

  const days = activeHorizon === '7d' 
    ? ['Day 1 (Mon)', 'Day 2 (Tue)', 'Day 3 (Wed)', 'Day 4 (Thu)', 'Day 5 (Fri)', 'Day 6 (Sat)', 'Day 7 (Sun)']
    : ['Week 1 (W31)', 'Week 2 (W32)', 'Week 3 (W33)', 'Week 4 (W34)'];

  const corridors = [
    { name: 'Mumbai-Pune-Solapur', segments: ['T001: CSMT-DR', 'T003: KYN-KJT', 'T004: KJT-LNL', 'T005: LNL-PUNE', 'T008: DD-KWV'] },
    { name: 'Mumbai-Nashik-Nagpur', segments: ['T010: KYN-KSRA', 'T011: KSRA-IGP', 'T012: IGP-NK', 'T014: MMR-BSL', 'T017: WR-NGP'] },
    { name: 'Pune-Miraj-Kolhapur', segments: ['T019: PUNE-STR', 'T020: STR-KRD', 'T021: KRD-SLI', 'T023: MRJ-KOP'] }
  ];

  const getBarColor = (dept) => {
    if (dept?.includes('Civil') || dept?.includes('P-Way')) return '#10b981';
    if (dept?.includes('TRD') || dept?.includes('Electrical')) return '#f59e0b';
    if (dept?.includes('Signal') || dept?.includes('S&T')) return '#38bdf8';
    return '#c084fc';
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 15, 20, 0.88)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          maxWidth: '960px',
          width: '100%',
          maxHeight: '92vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid #c084fc',
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
            <Calendar size={20} color="#c084fc" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Multi-Horizon Corridor Maintenance Gantt
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Multi-department synchronized possessions & joint shadow block time windows
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

        {/* Toolbar */}
        <div style={{
          padding: '10px 20px',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-panel-deep)', borderRadius: '3px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setActiveHorizon('7d')}
                style={{
                  padding: '4px 10px',
                  background: activeHorizon === '7d' ? 'var(--bg-panel-elevated)' : 'transparent',
                  border: 'none',
                  color: activeHorizon === '7d' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                7-Day Sprints
              </button>
              <button
                onClick={() => setActiveHorizon('30d')}
                style={{
                  padding: '4px 10px',
                  background: activeHorizon === '30d' ? 'var(--bg-panel-elevated)' : 'transparent',
                  border: 'none',
                  color: activeHorizon === '30d' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
              >
                Monthly Rollup (4-Week)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Department:</span>
              <select 
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">All Disciplines</option>
                <option value="Civil">Civil / P-Way</option>
                <option value="TRD">Electrical TRD (OHE)</option>
                <option value="S&T">Signal & Telecom</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></span>
              <span>P-Way Track</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }}></span>
              <span>TRD 25kV OHE</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#38bdf8', borderRadius: '2px' }}></span>
              <span>S&T Interlocking</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: '#c084fc', borderRadius: '2px' }}></span>
              <span>🤝 Joint Mega-Block</span>
            </span>
          </div>
        </div>

        {/* Gantt Matrix Grid */}
        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `220px repeat(${days.length}, 1fr)`, border: '1px solid var(--border-subtle)', borderRadius: '3px', background: 'var(--bg-panel-elevated)' }}>
            {/* Header Row */}
            <div style={{ padding: '8px 12px', fontWeight: '700', fontSize: '0.76rem', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-panel-deep)' }}>
              Corridor & Track Segment
            </div>
            {days.map((d, i) => (
              <div key={i} style={{ padding: '8px 6px', fontWeight: '700', fontSize: '0.74rem', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', borderRight: i < days.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: 'var(--bg-panel-deep)' }}>
                {d}
              </div>
            ))}

            {/* Corridor Rows */}
            {corridors.map((corr, cIdx) => (
              <React.Fragment key={cIdx}>
                <div style={{ gridColumn: `1 / span ${days.length + 1}`, background: 'rgba(56, 189, 248, 0.08)', padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700', color: '#38bdf8', borderBottom: '1px solid var(--border-subtle)' }}>
                  📍 {corr.name}
                </div>

                {corr.segments.map((seg, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <div style={{ padding: '8px 12px', fontSize: '0.74rem', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', fontWeight: '600' }}>
                      {seg}
                    </div>

                    {days.map((d, dIdx) => {
                      // Deterministic mock schedule blocks matching real patterns
                      const hasBlock = (sIdx + dIdx) % 3 === 0;
                      const isJoint = (sIdx + dIdx) % 6 === 0;
                      const deptType = (sIdx + dIdx) % 2 === 0 ? 'Civil' : 'TRD';

                      return (
                        <div key={dIdx} style={{ padding: '6px 4px', borderBottom: '1px solid var(--border-subtle)', borderRight: dIdx < days.length - 1 ? '1px solid var(--border-subtle)' : 'none', position: 'relative' }}>
                          {hasBlock && (
                            <div style={{
                              background: isJoint ? 'rgba(192, 132, 252, 0.25)' : (deptType === 'Civil' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)'),
                              border: `1px solid ${isJoint ? '#c084fc' : (deptType === 'Civil' ? '#10b981' : '#f59e0b')}`,
                              borderRadius: '2px',
                              padding: '2px 4px',
                              fontSize: '0.66rem',
                              color: isJoint ? '#c084fc' : (deptType === 'Civil' ? '#10b981' : '#f59e0b'),
                              fontWeight: '700',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {isJoint ? '🤝 Joint (01:30)' : `${deptType} (02:00)`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-panel-deep)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Gantt Possessions synchronized with TMS Track Demands & S&T Disconnection Notices
          </span>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
          >
            Close Gantt
          </button>
        </div>
      </div>
    </div>
  );
}
