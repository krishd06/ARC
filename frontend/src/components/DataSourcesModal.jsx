import React, { useState, useEffect } from 'react';
import { 
  Database, Server, HardDrive, Cpu, CheckCircle2, 
  ExternalLink, Layers, ShieldCheck, X, Activity, Train
} from 'lucide-react';

export default function DataSourcesModal({ isOpen, onClose }) {
  const [dataSources, setDataSources] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !dataSources) {
      setLoading(true);
      fetch('/api/data-sources')
        .then(res => res.json())
        .then(data => setDataSources(data))
        .catch(err => console.error('Failed to fetch data sources:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getBadgeStyle = (color) => {
    switch (color) {
      case 'emerald':
        return { bg: 'var(--signal-green-bg)', border: 'var(--signal-green-border)', text: 'var(--signal-green-text)' };
      case 'cyan':
        return { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', text: '#38bdf8' };
      case 'amber':
        return { bg: 'var(--signal-amber-bg)', border: 'var(--signal-amber-border)', text: 'var(--signal-amber-text)' };
      case 'purple':
        return { bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.35)', text: '#c084fc' };
      case 'rose':
        return { bg: 'var(--signal-red-bg)', border: 'var(--signal-red-border)', text: 'var(--signal-red-text)' };
      default:
        return { bg: 'var(--bg-panel-deep)', border: 'var(--border-subtle)', text: 'var(--text-primary)' };
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 18, 22, 0.88)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '20px'
      }} 
      onClick={onClose}
    >
      <div 
        style={{ 
          maxWidth: '860px', 
          width: '100%', 
          maxHeight: '90vh',
          background: 'var(--bg-panel)', 
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid var(--signal-amber)',
          borderRadius: '3px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-panel)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '2px', 
              background: 'var(--signal-amber-bg)', 
              border: '1px solid var(--signal-amber-border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Database size={17} color="var(--signal-amber-text)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Data Sources & Real System Integration Architecture
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Indian Railways Enterprise Systems simulation mapping (Section 1 Specification)
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ 
            background: 'var(--bg-panel-deep)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '2px', 
            padding: '12px 16px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>System Architecture Note: </strong>
            To enable production-grade automatic block planning without direct real-time access to restricted internal railway networks, <strong>ARC (Adaptive Railway Coordination)</strong> consumes synthetic data feeds modeled 1:1 on actual Indian Railways operating databases and control office telemetry streams.
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading integration schema...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dataSources?.sources.map((src, idx) => {
                const badge = getBadgeStyle(src.badge_color);
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-panel-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '2px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            background: badge.bg, 
                            border: `1px solid ${badge.border}`, 
                            color: badge.text,
                            padding: '2px 8px',
                            borderRadius: '2px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {src.real_system}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {src.system_name}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulated by:</span>
                        <span className="mono-text" style={{ fontSize: '0.76rem', color: 'var(--signal-amber)', background: 'var(--bg-panel-deep)', padding: '2px 6px', borderRadius: '2px', border: '1px solid var(--border-subtle)' }}>
                          {src.file}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', fontSize: '0.78rem', marginTop: '2px' }}>
                      <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                        Functional Domain:
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {src.domain}
                      </div>

                      <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                        Simulated Ingest:
                      </div>
                      <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {src.simulated_data}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Technical Specs Summary */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '10px', 
            paddingTop: '6px' 
          }}>
            <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Track Network Covered</div>
              <div className="mono-text" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                1,568 km / 23 Segments
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Historical Telemetry</div>
              <div className="mono-text" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--signal-green)', marginTop: '2px' }}>
                82 Maintenance Blocks
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Forward Pipeline</div>
              <div className="mono-text" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--signal-amber)', marginTop: '2px' }}>
                18 Freight Forecasts (FOIS)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel-elevated)' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Central Railway Maharashtra Pilot • Internal Simulation Bridge
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
