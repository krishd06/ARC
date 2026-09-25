import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, Navigation, Gauge, AlertTriangle, Mountain, 
  Wrench, Clock, Train, X, ArrowUpRight, CheckCircle2, Layers,
  Paperclip, FileText, Image as ImageIcon, File, Eye
} from 'lucide-react';
import { getDocumentsForTrack, getCustomBlocks } from '../utils/documentStore';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function SatelliteCorridorHero({ segments = [], onSelectSegment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef({});

  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState('ALL');
  const [inspectedSegment, setInspectedSegment] = useState(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [scheduledTrains, setScheduledTrains] = useState([]);
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initialize Satellite Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.2, 75.6],
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false
      });

      // Esri Satellite World Imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
      }).addTo(map);

      // Esri Reference Boundaries and Cities Overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        opacity: 0.65
      }).addTo(map);

      // Initial Bounds fit for Maharashtra Corridor Network
      const maharashtraBounds = L.latLngBounds([
        [16.2, 72.4],
        [21.8, 79.8]
      ]);
      map.fitBounds(maharashtraBounds, { padding: [20, 20] });

      setTimeout(() => {
        map.invalidateSize();
      }, 150);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    // Clear existing track layers
    Object.values(polylinesRef.current).forEach(layer => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    polylinesRef.current = {};

    // Remove any previous custom markers
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || (layer instanceof L.Polyline && !layer._url)) {
        map.removeLayer(layer);
      }
    });

    // Draw Track Segments as flat, solid, clickable colored blocks
    segments.forEach(seg => {
      if (!seg.from_coords || !seg.to_coords) return;
      if (selectedCorridorFilter !== 'ALL' && seg.corridor !== selectedCorridorFilter) return;

      const isHigh = seg.congestion_level === 'High';
      const isMedium = seg.congestion_level === 'Medium';
      const color = isHigh ? '#C1443C' : (isMedium ? '#E3A63E' : '#4F9D69');
      const isGhat = seg.terrain === 'ghat/hilly';

      // High-contrast casing underlay for sharp satellite visibility
      const casing = L.polyline([seg.from_coords, seg.to_coords], {
        color: '#1C2B30',
        weight: 8,
        opacity: 0.75,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Main colored track block
      const polyline = L.polyline([seg.from_coords, seg.to_coords], {
        color: color,
        weight: 5,
        opacity: 0.95,
        dashArray: isGhat ? '6, 6' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Lightweight hover tooltip (name + status only)
      polyline.bindTooltip(
        `<span style="font-family: 'IBM Plex Sans', sans-serif; font-weight: 600;">${seg.track_id}: ${seg.from_station} ➔ ${seg.to_station}</span> &bull; <span style="color: ${color}; font-weight: 700;">${seg.congestion_level}</span>`,
        { className: 'satellite-tooltip', sticky: true, direction: 'top' }
      );

      // Click to inspect
      polyline.on('click', () => {
        handleInspectSegment(seg);
      });
      casing.on('click', () => {
        handleInspectSegment(seg);
      });

      polylinesRef.current[seg.track_id] = polyline;

      // Station node markers at from & to
      [
        { coords: seg.from_coords, code: seg.from_station },
        { coords: seg.to_coords, code: seg.to_station }
      ].forEach(stn => {
        const marker = L.circleMarker(stn.coords, {
          radius: 4,
          fillColor: '#FFFFFF',
          fillOpacity: 0.95,
          color: '#1C2B30',
          weight: 2
        }).addTo(map);

        marker.bindTooltip(stn.code, {
          permanent: false,
          direction: 'bottom',
          className: 'satellite-tooltip'
        });
      });
    });

  }, [segments, selectedCorridorFilter]);

  // Click-to-Inspect handler: fetches live maintenance logs, attached condition documents, and scheduled trains
  const handleInspectSegment = async (seg) => {
    setInspectedSegment(seg);
    setLoadingDetails(true);
    setMaintenanceLogs([]);
    setScheduledTrains([]);

    // Load attached condition documents for this track block
    const docs = getDocumentsForTrack(seg.track_id);
    setAttachedDocs(docs);

    try {
      // 1. Fetch relevant rows from maintenance_log.csv for this block (most recent first)
      const logsRes = await fetch(`/api/maintenance-logs?track_id=${seg.track_id}`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logsList = logsData.logs || [];
        
        // Also merge user-created custom blocks for this track
        const customBlocks = getCustomBlocks().filter(b => b.track_id === seg.track_id);
        const combined = [...customBlocks, ...logsList];

        // Sort most recent first
        combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setMaintenanceLogs(combined);
      }

      // 2. Fetch scheduled trains passing through this block via timetable context
      const trainsRes = await fetch('/api/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: seg.track_id,
          target_date: '2026-08-05',
          start_time: '00:00',
          end_time: '23:59',
          buffer_minutes: 0
        })
      });

      if (trainsRes.ok) {
        const trainsData = await trainsRes.json();
        setScheduledTrains(trainsData.timeline_context || []);
      }
    } catch (err) {
      console.error('Error fetching segment details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Re-fetch attached documents if a document change event fires
  useEffect(() => {
    const handleDocChange = () => {
      if (inspectedSegment) {
        const docs = getDocumentsForTrack(inspectedSegment.track_id);
        setAttachedDocs(docs);
        const customBlocks = getCustomBlocks().filter(b => b.track_id === inspectedSegment.track_id);
        setMaintenanceLogs(prev => {
          const apiLogs = prev.filter(l => !l.event_id?.startsWith('M_CR_'));
          const combined = [...customBlocks, ...apiLogs];
          combined.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          return combined;
        });
      }
    };

    window.addEventListener('rail_sentinel_doc_change', handleDocChange);
    return () => window.removeEventListener('rail_sentinel_doc_change', handleDocChange);
  }, [inspectedSegment]);

  const handleCloseInspection = () => {
    setInspectedSegment(null);
    setMaintenanceLogs([]);
    setScheduledTrains([]);
    setAttachedDocs([]);
  };

  return (
    <div className="hero-satellite-container">
      {/* Top Header Bar */}
      <div className="hero-header-bar">
        <div className="hero-title-group">
          <div className="hero-main-title">
            <Navigation size={18} color="var(--signal-amber)" />
            <span>Central Railway Maharashtra — Satellite Corridor Network</span>
          </div>
          <p className="hero-subtitle">
            Flat geographic satellite view of 3 active corridors. Click any track block to inspect live maintenance logs and passing trains.
          </p>
        </div>

        {/* Live Status Legend & Corridor Toggles */}
        <div className="hero-legend-group">
          <div className="legend-chip">
            <span className="legend-dot green"></span>
            <span>Clear / Low</span>
          </div>
          <div className="legend-chip">
            <span className="legend-dot amber"></span>
            <span>Medium / Ghat</span>
          </div>
          <div className="legend-chip">
            <span className="legend-dot red"></span>
            <span>High Occupancy</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${selectedCorridorFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              onClick={() => setSelectedCorridorFilter('ALL')}
            >
              All 3 corridors
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCorridorFilter === 'Mumbai CSMT - Pune - Solapur' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              onClick={() => setSelectedCorridorFilter('Mumbai CSMT - Pune - Solapur')}
            >
              CSMT–Pune–Solapur
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCorridorFilter === 'Mumbai - Nagpur Trunk' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              onClick={() => setSelectedCorridorFilter('Mumbai - Nagpur Trunk')}
            >
              CSMT–Nagpur
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedCorridorFilter === 'Pune - Kolhapur' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
              onClick={() => setSelectedCorridorFilter('Pune - Kolhapur')}
            >
              Pune–Kolhapur
            </button>
          </div>
        </div>
      </div>

      {/* Main Satellite Map Viewport */}
      <div style={{ position: 'relative', width: '100%', height: '480px', overflow: 'hidden' }}>
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', background: '#1C2B30' }} 
        />

        {/* Prompt banner when no segment is selected */}
        {!inspectedSegment && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '14px',
            background: 'rgba(237, 231, 218, 0.92)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
            padding: '6px 12px',
            fontSize: '0.74rem',
            color: 'var(--text-primary)',
            zIndex: 900,
            pointerEvents: 'none'
          }}>
            <span style={{ color: 'var(--signal-amber-text)', fontWeight: '700' }}>INTERACTIVE MAP:</span> Click any colored track segment to inspect live maintenance logs & train timetable movements.
          </div>
        )}

        {/* Click-to-Inspect Detail Drawer Overlay (Section 2 of Spec v3) */}
        {inspectedSegment && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '420px',
            maxWidth: '90%',
            height: '100%',
            background: 'var(--bg-panel)',
            borderLeft: '2px solid var(--signal-amber)',
            boxShadow: 'var(--shadow-drawer)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            textAlign: 'left'
          }}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-panel-deep)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono-text" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {inspectedSegment.track_id}
                  </span>
                  <span className={`badge ${
                    inspectedSegment.congestion_level === 'High' ? 'badge-red' : 
                    (inspectedSegment.congestion_level === 'Medium' ? 'badge-amber' : 'badge-green')
                  }`}>
                    {inspectedSegment.congestion_level} congestion
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {inspectedSegment.corridor}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseInspection}
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
                title="Close detail panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Section Specification */}
              <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {inspectedSegment.from_station} ({inspectedSegment.from_station_name}) ➔ {inspectedSegment.to_station} ({inspectedSegment.to_station_name})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px', fontSize: '0.74rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Length</span>
                    <div className="mono-text" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{inspectedSegment.length_km} km</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Max speed</span>
                    <div className="mono-text" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{inspectedSegment.max_speed_kmph} km/h</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Terrain</span>
                    <div>
                      <span className={`badge ${inspectedSegment.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-slate'}`} style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
                        {inspectedSegment.terrain}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button: Send to Conflict Checker */}
              {onSelectSegment && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onSelectSegment(inspectedSegment.track_id)}
                >
                  <ArrowUpRight size={14} />
                  Check maintenance conflicts on {inspectedSegment.track_id}
                </button>
              )}

              {/* Section 2a: Live Maintenance Updates for this Block */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <Wrench size={14} color="var(--signal-amber)" />
                  <span>Live maintenance updates ({maintenanceLogs.length})</span>
                </div>

                {loadingDetails ? (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Loading maintenance records...</p>
                ) : maintenanceLogs.length === 0 ? (
                  <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    No recorded maintenance events for this segment in the current 30-day window.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {maintenanceLogs.map((log) => {
                      const isOverrun = log.status === 'Overrun';
                      return (
                        <div 
                          key={log.event_id} 
                          style={{
                            background: isOverrun ? 'var(--signal-red-bg)' : 'var(--bg-panel-elevated)',
                            border: `1px solid ${isOverrun ? 'var(--signal-red-border)' : 'var(--border-subtle)'}`,
                            borderRadius: '2px',
                            padding: '8px 10px',
                            fontSize: '0.74rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="mono-text" style={{ fontWeight: '700', color: isOverrun ? 'var(--signal-red-text)' : 'var(--text-primary)' }}>
                              {log.event_id} &bull; {log.date}
                            </span>
                            <span className={`badge ${log.status === 'Completed' ? 'badge-green' : (log.status === 'Overrun' ? 'badge-red' : 'badge-amber')}`} style={{ fontSize: '0.65rem' }}>
                              {log.status}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginTop: '2px' }}>
                            {log.issue_type} ({log.severity} severity)
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>
                            <span>Window: {log.block_start?.split(' ')[1] || log.block_start}–{log.block_end?.split(' ')[1] || log.block_end}</span>
                            <span>{log.planned_duration_min}m plan / {log.actual_duration_min}m act</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2b: Attached Condition Documents (Spec v4 Section 4) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    <Paperclip size={14} color="var(--signal-amber)" />
                    <span>Attached documents ({attachedDocs.length})</span>
                  </div>
                  {attachedDocs.length > 0 && (
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                      {Object.keys(attachedDocs.reduce((acc, d) => ({ ...acc, [d.doc_type]: true }), {})).length} types
                    </span>
                  )}
                </div>

                {attachedDocs.length === 0 ? (
                  <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    No condition documents attached yet for this block. Documents attached during block scheduling will appear here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {Object.entries(
                      attachedDocs.reduce((acc, doc) => {
                        const key = doc.doc_type || 'Additional supporting documents';
                        acc[key] = acc[key] || [];
                        acc[key].push(doc);
                        return acc;
                      }, {})
                    ).map(([docType, docsInGroup]) => (
                      <div 
                        key={docType}
                        style={{
                          background: 'var(--bg-panel-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '2px',
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--signal-amber-text)', marginBottom: '6px' }}>
                          {docType} ({docsInGroup.length})
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {docsInGroup.map((doc) => (
                            <div 
                              key={doc.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '2px',
                                padding: '4px 8px',
                                fontSize: '0.72rem'
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
                                <span className="mono-text" style={{ 
                                  fontWeight: '600', 
                                  color: 'var(--text-primary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {doc.filename}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                  {doc.size_formatted}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {doc.event_id && (
                                  <span className="mono-text" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {doc.event_id}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 6px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  onClick={() => setPreviewDoc(doc)}
                                  title="Open / Preview document"
                                >
                                  <Eye size={11} />
                                  <span>View</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2c: Scheduled Trains Passing Through This Block */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <Train size={14} color="var(--signal-green)" />
                  <span>Scheduled trains ({scheduledTrains.length})</span>
                </div>

                {loadingDetails ? (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Loading train timetables...</p>
                ) : scheduledTrains.length === 0 ? (
                  <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    No scheduled train movements recorded for this block on this timetable date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {scheduledTrains.map((train, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'var(--bg-panel-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '2px',
                          padding: '6px 10px',
                          fontSize: '0.73rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            <span className="mono-text" style={{ color: 'var(--signal-amber-text)' }}>{train.train_number}</span> &bull; {train.train_name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {train.train_type} &bull; {train.direction}
                          </div>
                        </div>
                        <div className="mono-text" style={{ textAlign: 'right', color: 'var(--text-primary)', fontWeight: '600' }}>
                          {train.scheduled_entry_time} ➔ {train.scheduled_exit_time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Condition Document Lightbox Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal 
          doc={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
    </div>
  );
}
