import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SatelliteCorridorHero from './components/SatelliteCorridorHero';
import ConflictChecker from './components/ConflictChecker';
import MaintenanceCalendar from './components/MaintenanceCalendar';
import RiskPredictor from './components/RiskPredictor';
import AIOptimizerConsole from './components/AIOptimizerConsole';
import DataSourcesModal from './components/DataSourcesModal';
import LandingPage from './components/LandingPage';
import RailwayAuthPage from './components/RailwayAuthPage';

export default function App() {
  // Navigation between 'landing', 'auth', and 'app' (Control Room)
  const [currentPage, setCurrentPage] = useState('landing');

  // Authenticated Official Profile
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rail_sentinel_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Session storage persistence for sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = sessionStorage.getItem('rail_sentinel_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [activeView, setActiveView] = useState('all');
  const [segments, setSegments] = useState([]);
  const [stations, setStations] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [metaOptions, setMetaOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data Sources Modal State
  const [isDataSourcesModalOpen, setIsDataSourcesModalOpen] = useState(false);

  // Cross-component interaction state (pre-fills for Conflict Checker)
  const [checkerPrefill, setCheckerPrefill] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentPage('app');
  };

  const handleSignOut = () => {
    try {
      sessionStorage.removeItem('rail_sentinel_user');
      localStorage.removeItem('rail_sentinel_user');
    } catch (e) {}
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  // Toggle sidebar and persist in sessionStorage
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem('rail_sentinel_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save sidebar state to sessionStorage', e);
      }
      return next;
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [segRes, stnRes, corrRes, metaRes] = await Promise.all([
          fetch('/api/segments'),
          fetch('/api/stations'),
          fetch('/api/corridors'),
          fetch('/api/meta-options')
        ]);

        const [segData, stnData, corrData, metaData] = await Promise.all([
          segRes.json(),
          stnRes.json(),
          corrRes.json(),
          metaRes.json()
        ]);

        setSegments(segData);
        setStations(stnData);
        setCorridors(corrData);
        setMetaOptions(metaData);
      } catch (err) {
        console.error('Failed to load initial dataset:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApplySlotToChecker = (trackId, date, start, end) => {
    setCheckerPrefill({ trackId, date, start, end });
    setActiveView('checker');
    // Scroll smoothly to conflict checker section
    const el = document.getElementById('section-conflict-checker');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectSegmentFromMap = (trackId) => {
    setCheckerPrefill(prev => ({ ...prev, trackId }));
    setActiveView('checker');
    const el = document.getElementById('section-conflict-checker');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F3EC', color: '#1C2B30', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '42px', height: '42px', border: '3px solid #D5CCC0', borderTopColor: '#E3A63E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.92rem', fontWeight: '600', color: '#6B7B80' }}>Loading Maharashtra Central Railway Corridor Model...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (currentPage === 'landing') {
    return (
      <LandingPage 
        onLaunchControlRoom={() => setCurrentPage('app')}
        onOpenAuth={() => setCurrentPage('auth')}
        currentUser={currentUser}
      />
    );
  }

  if (currentPage === 'auth') {
    return (
      <RailwayAuthPage 
        onLoginSuccess={handleLoginSuccess}
        onNavigateToLanding={() => setCurrentPage('landing')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Header Bar [≡] RAIL SENTINEL [live status dot] */}
      <Navbar 
        toggleSidebar={toggleSidebar} 
        isSidebarCollapsed={isSidebarCollapsed} 
        onOpenDataSources={() => setIsDataSourcesModalOpen(true)}
        onNavigateToLanding={() => setCurrentPage('landing')}
        onOpenAuth={() => setCurrentPage('auth')}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      <div className="app-body">
        {/* Collapsible Left Navigation Sidebar with Live Network Summary */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          activeView={activeView}
          setActiveView={setActiveView}
          segments={segments}
          metaOptions={metaOptions}
          onOpenDataSources={() => setIsDataSourcesModalOpen(true)}
        />

        {/* Main Control Room Workspace */}
        <main className="main-workspace">
          {/* Section 1: Satellite Corridor Hero Map with Click-to-Inspect (Shown on Main View ONLY) */}
          {activeView === 'all' && (
            <section id="section-hero">
              <SatelliteCorridorHero 
                segments={segments} 
                onSelectSegment={handleSelectSegmentFromMap}
              />
            </section>
          )}

          {/* AI Master Block Schedule Optimizer */}
          {(activeView === 'all' || activeView === 'optimizer') && (
            <div id="section-ai-optimizer" className="panels-grid-full">
              <AIOptimizerConsole 
                segments={segments}
                metaOptions={metaOptions}
                onNavigateToCalendar={() => setActiveView('calendar')}
              />
            </div>
          )}

          {/* Feature Module: Conflict Checker */}
          {(activeView === 'all' || activeView === 'checker') && (
            <div id="section-conflict-checker" className="panels-grid-full">
              <ConflictChecker 
                segments={segments}
                prefill={checkerPrefill}
              />
            </div>
          )}

          {(activeView === 'all' || activeView === 'calendar' || activeView === 'predictor') && (
            <div className={activeView === 'all' ? "panels-grid-dual" : "panels-grid-full"}>
              {(activeView === 'all' || activeView === 'calendar') && (
                <div id="section-maintenance-calendar">
                  <MaintenanceCalendar 
                    metaOptions={metaOptions} 
                  />
                </div>
              )}

              {(activeView === 'all' || activeView === 'predictor') && (
                <div id="section-risk-predictor">
                  <RiskPredictor 
                    segments={segments} 
                    metaOptions={metaOptions} 
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Control Room Footer */}
      <footer className="app-footer">
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>ARC v2.0</strong> • Adaptive Railway Coordination & AI Block Planning System • Central Railway Pilot
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsDataSourcesModalOpen(true)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--signal-amber)', 
              cursor: 'pointer', 
              fontSize: '0.78rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'underline'
            }}
          >
            <span>⚠️ Simulated IR Systems Map (Section 1)</span>
          </button>
          <span className="mono-text">Mumbai CSMT • Pune • Nagpur • Solapur • Kolhapur</span>
        </div>
      </footer>

      {/* Data Sources Integration Modal */}
      <DataSourcesModal 
        isOpen={isDataSourcesModalOpen} 
        onClose={() => setIsDataSourcesModalOpen(false)} 
      />
    </div>
  );
}
