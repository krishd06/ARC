import React, { useState } from 'react';
import { 
  ShieldAlert, Sparkles, Map, Calendar, BrainCircuit, 
  Train, Info, AlertTriangle, Activity
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const navItems = [
    { id: 'checker', label: 'Conflict Checker', icon: ShieldAlert },
    { id: 'recommender', label: 'Smart Recommender', icon: Sparkles },
    { id: 'heatmap', label: 'Congestion Heatmap', icon: Map },
    { id: 'calendar', label: 'Maintenance Calendar', icon: Calendar },
    { id: 'predictor', label: 'AI Risk Predictor', icon: BrainCircuit },
  ];

  return (
    <header className="app-header">
      {/* Top Banner */}
      <div className="header-top">
        <div className="brand-section">
          <div className="logo-badge">
            <Train size={24} />
          </div>
          <div>
            <div className="brand-title">
              RAIL <span>SENTINEL</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>
                Pilot CR
              </span>
            </div>
            <div className="brand-subtitle">
              Indian Railways Automatic Track Maintenance Block-Planning System
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Simulated Demo Dataset Badge with info toggle */}
          <div 
            className="demo-dataset-badge"
            onClick={() => setShowInfoModal(true)}
            style={{ cursor: 'pointer' }}
            title="Click to view dataset disclaimer and schema details"
          >
            <AlertTriangle size={14} />
            <span>Simulated Demo Dataset</span>
            <Info size={12} style={{ opacity: 0.8 }} />
          </div>

          <div className="system-status">
            <div className="pulse-dot" />
            <span>System Active • 3 Corridors Live</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dataset Info Modal */}
      {showInfoModal && (
        <div 
          style={{
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
            zIndex: 3000,
            padding: '20px'
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div 
            className="glass-card"
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              background: '#0d1733', 
              border: '1px solid #f59e0b',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                  Simulated Demo Dataset Notice
                </h3>
              </div>
              <button 
                onClick={() => setShowInfoModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '0.88rem', color: '#cbd5e1' }}>
              <p>
                <strong>Status: 100% synthetic / simulated.</strong> Station names, coordinates, and corridor distances are close-to-real approximations of actual Central Railway routes in Maharashtra (Mumbai CSMT, Pune, Solapur, Igatpuri, Manmad, Bhusawal, Nagpur, Kolhapur).
              </p>
              <p>
                Train numbers, scheduled timings, and maintenance events are simulated for prototype and SIH competition evaluation. This prototype demonstrates automatic conflict checking, safe slot discovery, and AI risk prediction algorithms.
              </p>
              <div style={{ background: '#09132b', padding: '12px', borderRadius: '8px', border: '1px solid #1e3264', fontSize: '0.8rem' }}>
                <div><strong>Corridors Covered:</strong> 3 Central Railway Corridors (1,568 km total)</div>
                <div><strong>Track Segments:</strong> 23 double-line sections</div>
                <div><strong>Scheduled Trains:</strong> 16 express, passenger, freight, and EMU trains</div>
                <div><strong>Historical Maintenance Records:</strong> 82 events across 30 days</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowInfoModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
