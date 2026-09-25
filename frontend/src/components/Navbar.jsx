import React, { useState } from 'react';
import { 
  Train, AlertTriangle, Info, Menu, ShieldAlert, CheckCircle2, LogOut
} from 'lucide-react';

export default function Navbar({ 
  toggleSidebar, 
  isSidebarCollapsed, 
  onOpenDataSources, 
  currentUser, 
  onSignOut, 
  onOpenAuth, 
  onNavigateToLanding 
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleOpenInfo = () => {
    if (onOpenDataSources) {
      onOpenDataSources();
    } else {
      setShowInfoModal(true);
    }
  };

  return (
    <header className="control-topbar">
      {/* Top Left: [≡] Sidebar Toggle + RAIL SENTINEL Title */}
      <div className="topbar-left">
        <button 
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="brand-display" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/arc_logo.png" 
            alt="ARC Logo" 
            style={{ 
              height: '38px', 
              width: 'auto', 
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
          <div>
            <div className="brand-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: '900', letterSpacing: '0.6px' }}>ARC</span>
              <span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>
                CR Pilot v2.0
              </span>
            </div>
            <span className="brand-subtext" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Adaptive Railway Coordination • AI Block Planning & Optimization
            </span>
          </div>
        </div>
      </div>

      {/* Top Right: Official Sign-In / User Profile + Systems Map + Signal Status */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {currentUser ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 12px',
            background: 'var(--bg-panel-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(28, 43, 48, 0.05)'
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: '700' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--signal-green-text)', fontWeight: '600' }}>
                ✓ {currentUser.role}
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                style={{
                  background: 'rgba(193, 68, 60, 0.1)',
                  border: '1px solid rgba(193, 68, 60, 0.3)',
                  color: 'var(--signal-red-text)',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  padding: '4px 9px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title="Sign out of official session and return to home"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              style={{
                background: 'rgba(227, 166, 62, 0.14)',
                border: '1px solid var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
                padding: '5px 12px',
                borderRadius: '3px',
                fontSize: '0.76rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🔐 Official Sign-In</span>
            </button>
          )
        )}

        <button 
          className="dataset-banner-btn"
          onClick={handleOpenInfo}
          title="Click to view simulated demo dataset notice and IR system integration map"
        >
          <AlertTriangle size={13} />
          <span>Simulated IR Systems Map</span>
          <Info size={12} style={{ opacity: 0.8 }} />
        </button>

        <div className="live-signal-status">
          <span className="signal-lamp"></span>
          <span>Interlocked • 3 Corridors Active</span>
        </div>
      </div>

      {/* Simulated Demo Dataset Modal */}
      {showInfoModal && (
        <div 
          style={{
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
            zIndex: 3000,
            padding: '20px'
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            style={{ 
              maxWidth: '580px', 
              width: '100%', 
              background: 'var(--bg-panel)', 
              border: '1px solid var(--signal-amber)',
              borderRadius: '3px',
              padding: '24px',
              boxShadow: 'var(--shadow-panel)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--signal-amber)' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '1.08rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Simulated Demo Dataset Notice
                </h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5, textAlign: 'left' }}>
              <p>
                <strong>Status: 100% synthetic / simulated.</strong> Station names, coordinates, and corridor distances are close-to-real approximations of Central Railway routes in Maharashtra (Mumbai CSMT, Pune, Solapur, Igatpuri, Manmad, Bhusawal, Nagpur, Kolhapur).
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Train numbers, scheduled timings, and maintenance events are simulated for prototype evaluation. This system evaluates automatic track conflict detection, safe maintenance window recommendations, and empirical Bayesian overrun risk scoring.
              </p>
              <div style={{ background: 'var(--bg-panel-elevated)', padding: '12px', borderRadius: '2px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div><strong>Corridors:</strong> 3 Central Railway corridors (1,568 km total)</div>
                <div><strong>Track Segments:</strong> 23 double-line physical sections</div>
                <div><strong>Timetable Movements:</strong> 16 scheduled train consists</div>
                <div><strong>Maintenance Records:</strong> 82 historical block events across 30 days</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowInfoModal(false)}>
                Acknowledge Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
