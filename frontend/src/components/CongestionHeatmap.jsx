import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Gauge, AlertTriangle, Mountain, Zap, ArrowUpRight } from 'lucide-react';

export default function CongestionHeatmap({ segments, stations, corridors, onSelectSegment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [activeCorridorFilter, setActiveCorridorFilter] = useState('All');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map centered on Maharashtra (approx 19.3° N, 75.5° E)
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.2, 75.7],
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      // Dark CartoDB tile layer for modern command-center aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing custom layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Draw track segments as polylines
    segments.forEach((seg) => {
      if (!seg.from_coords || !seg.to_coords) return;
      if (activeCorridorFilter !== 'All' && seg.corridor !== activeCorridorFilter) return;

      const isHigh = seg.congestion_level === 'High';
      const isMedium = seg.congestion_level === 'Medium';
      const color = isHigh ? '#ef4444' : (isMedium ? '#f59e0b' : '#10b981');
      const isGhat = seg.terrain === 'ghat/hilly';

      // Outer glow line for high congestion or ghat
      const glowPolyline = L.polyline([seg.from_coords, seg.to_coords], {
        color: color,
        weight: isHigh ? 8 : 6,
        opacity: isHigh ? 0.35 : 0.2,
        lineCap: 'round'
      }).addTo(map);

      // Core track line
      const polyline = L.polyline([seg.from_coords, seg.to_coords], {
        color: color,
        weight: isHigh ? 4.5 : 3.5,
        opacity: 0.95,
        dashArray: isGhat ? '6, 6' : undefined,
        lineCap: 'round'
      }).addTo(map);

      polyline.on('click', () => {
        setSelectedSeg(seg);
      });

      polyline.bindTooltip(`
        <div style="font-family: sans-serif; padding: 4px 6px;">
          <strong style="color: ${color};">${seg.track_id}: ${seg.from_station} ➔ ${seg.to_station}</strong><br/>
          <span style="font-size: 11px; color: #cbd5e1;">${seg.corridor}</span><br/>
          <span style="font-size: 11px; font-weight: bold;">${seg.trains_per_week} trains/week (${seg.congestion_level} Congestion)</span><br/>
          <span style="font-size: 10px; color: #94a3b8;">${seg.length_km} km • ${seg.terrain}</span>
        </div>
      `, { sticky: true, className: 'leaflet-dark-tooltip' });
    });

    // Draw station markers
    stations.forEach((stn) => {
      if (activeCorridorFilter !== 'All') {
        const matchingSeg = segments.find(s => s.corridor === activeCorridorFilter && (s.from_station === stn.station_code || s.to_station === stn.station_code));
        if (!matchingSeg) return;
      }

      const isJunction = ['CSTM', 'KYN', 'PUNE', 'BSL', 'NGP', 'MRJ'].includes(stn.station_code);

      const circle = L.circleMarker([stn.latitude, stn.longitude], {
        radius: isJunction ? 6.5 : 4.5,
        fillColor: isJunction ? '#38bdf8' : '#ffffff',
        fillOpacity: 1,
        color: '#070d1e',
        weight: 2
      }).addTo(map);

      circle.bindTooltip(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong>${stn.station_name} (${stn.station_code})</strong><br/>
          <span style="font-size: 11px; color: #94a3b8;">Division: ${stn.division}</span>
        </div>
      `);
    });

  }, [segments, stations, activeCorridorFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={22} color="#ef4444" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>
                Corridor Traffic & Maintenance Congestion Heatmap
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
              Visualizes weekly train frequencies and maintenance bottleneck sensitivity across Central Railway's 3 primary Maharashtra corridors.
            </p>
          </div>

          {/* Corridor Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`badge ${activeCorridorFilter === 'All' ? 'badge-cyan' : 'badge-purple'}`}
              style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setActiveCorridorFilter('All')}
            >
              All Corridors (23 Segments)
            </button>
            {corridors.map((c, i) => (
              <button
                key={i}
                className={`badge ${activeCorridorFilter === c.name ? 'badge-cyan' : 'badge-purple'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => setActiveCorridorFilter(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Corridor KPI overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {corridors.map((c, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8' }}>Corridor {idx + 1}</span>
              <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                {c.high_congestion_count} High Traffic
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>
              {c.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span>Length: <strong style={{ color: '#f8fafc' }}>{c.total_km} km</strong></span>
              <span>Stations: <strong style={{ color: '#f8fafc' }}>{c.station_count}</strong></span>
              <span>Ghat Sec: <strong style={{ color: '#f8fafc' }}>{c.ghat_segments_count}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Detail Panel */}
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 360px', minHeight: '520px' }}>
        {/* Map View */}
        <div className="glass-card" style={{ padding: '4px', position: 'relative', overflow: 'hidden' }}>
          <div 
            ref={mapContainerRef} 
            style={{ 
              width: '100%', 
              height: '520px', 
              borderRadius: '10px',
              background: '#070d1e'
            }} 
          />

          {/* Map Legend Floating */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(7, 13, 30, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-active)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontWeight: '700', color: '#f8fafc', marginBottom: '2px' }}>Congestion Heatmap Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '4px', background: '#ef4444', borderRadius: '2px' }} />
              <span style={{ color: '#cbd5e1' }}>High Congestion (38–51 trains/wk — Tight Slack)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '4px', background: '#f59e0b', borderRadius: '2px' }} />
              <span style={{ color: '#cbd5e1' }}>Medium Congestion (14–25 trains/wk)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '4px', background: '#10b981', borderRadius: '2px' }} />
              <span style={{ color: '#cbd5e1' }}>Low Congestion (Frequent Open Windows)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div style={{ width: '20px', height: '2px', borderTop: '2px dashed #f59e0b' }} />
              <span style={{ color: '#94a3b8' }}>Dashed = Ghat / Hilly Alignment (60 km/h)</span>
            </div>
          </div>
        </div>

        {/* Segment Inspector Drawer */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={18} color="#38bdf8" />
              Segment Operational Profile
            </h3>

            {selectedSeg ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#09132b', border: '1px solid #1e3264', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono-text" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#38bdf8' }}>
                      {selectedSeg.track_id}
                    </span>
                    <span className={`badge ${selectedSeg.congestion_level === 'High' ? 'badge-red' : (selectedSeg.congestion_level === 'Medium' ? 'badge-amber' : 'badge-green')}`}>
                      {selectedSeg.congestion_level} Congestion
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', marginTop: '6px' }}>
                    {selectedSeg.from_station} ➔ {selectedSeg.to_station}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    {selectedSeg.from_station_name} to {selectedSeg.to_station_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    {selectedSeg.corridor}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                  <div className="glass-card" style={{ padding: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Weekly Traffic</span>
                    <div className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ef4444', marginTop: '2px' }}>
                      {selectedSeg.trains_per_week} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>trains</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Length</span>
                    <div className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#38bdf8', marginTop: '2px' }}>
                      {selectedSeg.length_km} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>km</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Max Speed</span>
                    <div className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
                      {selectedSeg.max_speed_kmph} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>km/h</span>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '10px' }}>
                    <span style={{ color: '#94a3b8' }}>Terrain</span>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`badge ${selectedSeg.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                        {selectedSeg.terrain}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '10px', fontSize: '0.78rem', color: '#fbbf24' }}>
                  <strong>Block Scheduling Advisory:</strong>{' '}
                  {selectedSeg.congestion_level === 'High' 
                    ? 'Tight corridor with heavy day and night train paths. Recommend 2h max late-night blocks (01:00–04:00).' 
                    : 'Moderate capacity. Daylight maintenance windows can be safely arranged between passenger halts.'}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                <MapPin size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.88rem' }}>Click any track segment on the map or schematic to inspect operational metrics.</p>
              </div>
            )}
          </div>

          {selectedSeg && (
            <button 
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => {
                if (onSelectSegment) onSelectSegment(selectedSeg.track_id);
              }}
            >
              Check Conflicts on {selectedSeg.track_id}
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Linear Corridor Schematic Diagram */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: '#f8fafc' }}>
          Corridor Schematic Line Diagrams
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {corridors.map((c, cIdx) => (
            <div key={cIdx} style={{ background: '#09132b', border: '1px solid #1e3264', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>{c.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.total_km} km • {c.segments.length} segments</span>
              </div>

              {/* Schematic Node & Segment Rail */}
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '10px 0' }}>
                {c.segments.map((seg, sIdx) => {
                  const isHigh = seg.traffic?.congestion_level === 'High';
                  const segColor = isHigh ? '#ef4444' : '#f59e0b';
                  const isGhat = seg.terrain === 'ghat/hilly';

                  return (
                    <React.Fragment key={sIdx}>
                      {/* Station Node */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#38bdf8',
                          border: '3px solid #070d1e',
                          boxShadow: '0 0 6px rgba(56, 189, 248, 0.8)'
                        }} />
                        <span className="mono-text" style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f8fafc', marginTop: '4px' }}>
                          {seg.from_station}
                        </span>
                      </div>

                      {/* Track Segment Connector */}
                      <div 
                        onClick={() => setSelectedSeg(seg)}
                        style={{
                          flex: 1,
                          minWidth: '70px',
                          height: '24px',
                          background: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          borderTop: `3px ${isGhat ? 'dashed' : 'solid'} ${segColor}`,
                          borderBottom: `3px ${isGhat ? 'dashed' : 'solid'} ${segColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}
                        title={`${seg.track_id}: ${seg.from_station}➔${seg.to_station} (${seg.traffic?.trains_per_week || 38} trains/wk)`}
                      >
                        <span className="mono-text" style={{ fontSize: '0.65rem', fontWeight: '700', color: segColor }}>
                          {seg.track_id}
                        </span>
                      </div>

                      {/* Terminal Station for the last segment */}
                      {sIdx === c.segments.length - 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: '#38bdf8',
                            border: '3px solid #070d1e',
                            boxShadow: '0 0 6px rgba(56, 189, 248, 0.8)'
                          }} />
                          <span className="mono-text" style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f8fafc', marginTop: '4px' }}>
                            {seg.to_station}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
