import React from 'react';
import { 
  ShieldAlert, Sparkles, Map, Calendar, BrainCircuit, 
  ChevronLeft, ChevronRight, Activity, Train, Mountain, 
  AlertTriangle, CheckCircle2, LayoutGrid, Database, Layers
} from 'lucide-react';

export default function Sidebar({ 
  isCollapsed, 
  toggleSidebar, 
  activeView, 
  setActiveView, 
  segments = [],
  metaOptions = null,
  onOpenDataSources
}) {
  const navItems = [
    { id: 'all', label: 'All Panels (Console)', icon: LayoutGrid },
    { id: 'optimizer', label: 'AI Schedule Optimizer & Creator', icon: Sparkles },
    { id: 'checker', label: 'Conflict Checker', icon: ShieldAlert },
    { id: 'calendar', label: 'Maintenance Calendar & Rollup', icon: Calendar },
    { id: 'predictor', label: 'Prioritization & Risk Engine', icon: Activity },
  ];

  // Calculate live network telemetry from segments
  const totalSegments = segments.length || 23;
  const highCongestionCount = segments.filter(s => s.congestion_level === 'High').length || 3;
  const ghatSectionsCount = segments.filter(s => s.terrain === 'ghat/hilly').length || 2;

  return (
    <aside className={`control-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="sidebar-nav-icon">
                <Icon size={18} color={isActive ? 'var(--signal-amber)' : 'currentColor'} />
              </div>
              {!isCollapsed && (
                <span className="sidebar-nav-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Data Sources Architecture Button */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onOpenDataSources}
          className="sidebar-nav-item"
          style={{ 
            width: '100%', 
            background: 'var(--bg-panel-elevated)', 
            border: '1px solid var(--border-subtle)',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '8px'
          }}
          title="View Data Sources & Real System Integration Architecture"
        >
          <div className="sidebar-nav-icon">
            <Database size={17} color="var(--signal-amber)" />
          </div>
          {!isCollapsed && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)' }}>Data Sources Map</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Simulated IR Systems</div>
            </div>
          )}
        </button>
      </div>

      {/* Collapse / Expand Toggle Button inside sidebar bottom rail */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
          style={{ width: '100%', height: '32px', gap: '8px' }}
          title={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar to compact rail"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* Live Network Status Summary (Shown in expanded mode) */}
      {!isCollapsed && (
        <div className="sidebar-telemetry">
          <div className="telemetry-title">
            <span>Live Network Telemetry</span>
          </div>

          <div className="telemetry-metric-row">
            <span>Network Span</span>
            <span className="mono-text">1,568 km (3 Corridors)</span>
          </div>

          <div className="telemetry-metric-row">
            <span>Track Blocks</span>
            <span className="mono-text">{totalSegments} Double-Line</span>
          </div>

          <div className="telemetry-metric-row">
            <span>Ghat Gradients (1:37)</span>
            <span className="mono-text" style={{ color: 'var(--signal-amber)' }}>{ghatSectionsCount} Steep Sections</span>
          </div>

          <div className="telemetry-metric-row">
            <span>High Occupancy Segments</span>
            <span className="mono-text" style={{ color: highCongestionCount > 0 ? 'var(--signal-red)' : 'var(--signal-green)' }}>
              {highCongestionCount} Critical
            </span>
          </div>

          <div className="telemetry-metric-row">
            <span>Scheduled Trains</span>
            <span className="mono-text">16 Timetable Consists</span>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
            <span className="signal-lamp"></span>
            <span>Signals Operational • Interlocked</span>
          </div>
        </div>
      )}
    </aside>
  );
}
