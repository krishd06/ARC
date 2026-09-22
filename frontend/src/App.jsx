import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ConflictChecker from './components/ConflictChecker';
import BlockRecommender from './components/BlockRecommender';
import CongestionHeatmap from './components/CongestionHeatmap';
import MaintenanceCalendar from './components/MaintenanceCalendar';
import RiskPredictor from './components/RiskPredictor';

export default function App() {
  const [activeTab, setActiveTab] = useState('checker');
  const [segments, setSegments] = useState([]);
  const [stations, setStations] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [metaOptions, setMetaOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cross-component interaction state (pre-fills for Conflict Checker)
  const [checkerPrefill, setCheckerPrefill] = useState(null);

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
    setActiveTab('checker');
  };

  const handleSelectSegmentFromMap = (trackId) => {
    setCheckerPrefill(prev => ({ ...prev, trackId }));
    setActiveTab('checker');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070d1e', color: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #1e3264', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '1rem', fontWeight: '600' }}>Initializing Rail Sentinel Maharashtra Corridor Model...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'checker' && (
          <ConflictChecker 
            segments={segments}
            prefill={checkerPrefill}
          />
        )}

        {activeTab === 'recommender' && (
          <BlockRecommender 
            segments={segments} 
            onApplySlotToChecker={handleApplySlotToChecker}
          />
        )}

        {activeTab === 'heatmap' && (
          <CongestionHeatmap 
            segments={segments} 
            stations={stations} 
            corridors={corridors}
            onSelectSegment={handleSelectSegmentFromMap}
          />
        )}

        {activeTab === 'calendar' && (
          <MaintenanceCalendar 
            metaOptions={metaOptions} 
          />
        )}

        {activeTab === 'predictor' && (
          <RiskPredictor 
            segments={segments} 
            metaOptions={metaOptions} 
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: '#070d1e',
        padding: '16px 24px',
        fontSize: '0.78rem',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <strong style={{ color: '#94a3b8' }}>Rail Sentinel v1.0</strong> • Automatic Track Maintenance Block Planning System • Maharashtra Central Railway Pilot
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>⚠️ <em>Simulated demo dataset for SIH evaluation</em></span>
          <span>Mumbai CSMT • Pune • Nagpur • Solapur • Kolhapur</span>
        </div>
      </footer>
    </div>
  );
}
