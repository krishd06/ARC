import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Gauge, AlertTriangle, Mountain, Zap } from 'lucide-react';

export default function CongestionHeatmap({ segments, stations, corridors, onSelectSegment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [activeCorridorFilter, setActiveCorridorFilter] = useState('All');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.2, 75.7],
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
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

    // Draw track segments
    segments.forEach((seg) => {
      if (!seg.from_coords || !seg.to_coords) return;
      if (activeCorridorFilter !== 'All' && seg.corridor !== activeCorridorFilter) return;

      const isHigh = seg.congestion_level === 'High';
      const isMedium = seg.congestion_level === 'Medium';
      const color = isHigh ? '#C1443C' : (isMedium ? '#E3A63E' : '#4F9D69');
      const isGhat = seg.terrain === 'ghat/hilly';

      // Outer track glow for high congestion
      L.polyline([seg.from_coords, seg.to_coords], {
        color: color,
        weight: isHigh ? 7 : 5,
        opacity: isHigh ? 0.35 : 0.18,
        lineCap: 'round'
      }).addTo(map);

      // Core track line
      const polyline = L.polyline([seg.from_coords, seg.to_coords], {
        color: color,
        weight: isHigh ? 4 : 3,
        opacity: 0.95,
        dashArray: isGhat ? '6, 6' : undefined,
        lineCap: 'round'
      }).addTo(map);

      polyline.on('click', () => {
        setSelectedSeg(seg);
      });

      polyline.bindTooltip(`
        <div style="font-family: 'IBM Plex Sans', sans-serif; padding: 4px 6px; text-align: left; color: #1C2B30;">
          <strong style="color: ${color}; font-family: 'IBM Plex Mono', monospace;">${seg.track_id}: ${seg.from_station} ➔ ${seg.to_station}</strong><br/>
          <span style="font-size: 11px; color: #1C2B30;">${seg.corridor}</span><br/>
          <span style="font-size: 11px; font-weight: 600; color: #1C2B30;">${seg.trains_per_week} trains/week (${seg.congestion_level} congestion)</span><br/>
          <span style="font-size: 10px; color: #6B7B80;">${seg.length_km} km • ${seg.terrain}</span>
        </div>
      `, { sticky: true, className: 'satellite-tooltip' });
    });

    // Draw station markers
    stations.forEach((stn) => {
      if (activeCorridorFilter !== 'All') {
        const matchingSeg = segments.find(s => s.corridor === activeCorridorFilter && (s.from_station === stn.station_code || s.to_station === stn.station_code));
        if (!matchingSeg) return;
      }

      const isJunction = ['CSTM', 'KYN', 'PUNE', 'BSL', 'NGP', 'MRJ'].includes(stn.station_code);

      const circle = L.circleMarker([stn.latitude, stn.longitude], {
        radius: isJunction ? 6 : 4,
        fillColor: isJunction ? '#E3A63E' : '#FFFFFF',
        fillOpacity: 1,
        color: '#1C2B30',
        weight: 1.5
      }).addTo(map);

      circle.bindTooltip(`
        <div style="font-family: 'IBM Plex Sans', sans-serif; padding: 4px; text-align: left; color: #1C2B30;">
          <strong style="color: #1C2B30;">${stn.station_name} (${stn.station_code})</strong><br/>
          <span style="font-size: 11px; color: #6B7B80;">Division: ${stn.division}</span>
        </div>
      `, { className: 'satellite-tooltip' });
    });

  }, [segments, stations, activeCorridorFilter]);

  return (
    <section className="panel-heatmap">
      {/* Panel Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div className="panel-title">
              <Navigation size={20} color="var(--signal-amber)" />
              <span>Corridor traffic and maintenance congestion heatmap</span>
            </div>
            <p className="panel-desc">
              Visualizes weekly train frequencies and maintenance bottleneck sensitivity across Central Railway's 3 primary Maharashtra corridors.
            </p>
          </div>

          {/* Corridor Filter Toggles */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeCorridorFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveCorridorFilter('All')}
            >
              All corridors (23 segments)
            </button>
            {corridors.map((c, i) => (
              <button
                key={i}
                type="button"
                className={`btn btn-sm ${activeCorridorFilter === c.name ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCorridorFilter(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Corridor Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
        {corridors.map((c, idx) => (
          <div key={idx} style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--signal-amber)' }}>Corridor {idx + 1}</span>
              <span className="badge badge-amber">
                {c.high_congestion_count} high traffic
              </span>
            </div>
            <div style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
              {c.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.76rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(143, 163, 168, 0.1)', paddingTop: '8px' }}>
              <span>Length: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{c.total_km} km</strong></span>
              <span>Stations: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{c.station_count}</strong></span>
              <span>Ghat: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{c.ghat_segments_count}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Map + Detail Inspector Grid */}
      <div className="panels-grid-dual" style={{ gridTemplateColumns: '1fr 350px', minHeight: '500px' }}>
        {/* Interactive Map View */}
        <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '2px', position: 'relative', overflow: 'hidden' }}>
          <div 
            ref={mapContainerRef} 
            style={{ 
              width: '100%', 
              height: '500px', 
              borderRadius: '2px',
              background: '#EDE7DA'
            }} 
          />

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            background: 'rgba(237, 231, 218, 0.94)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '2px',
            padding: '10px 14px',
            fontSize: '0.74rem',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Congestion status legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '4px', background: 'var(--signal-red)', borderRadius: '1px' }} />
              <span style={{ color: 'var(--text-primary)' }}>High congestion (38–51 trains/wk)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '4px', background: 'var(--signal-amber)', borderRadius: '1px' }} />
              <span style={{ color: 'var(--text-primary)' }}>Medium congestion (14–25 trains/wk)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '18px', height: '4px', background: 'var(--signal-green)', borderRadius: '1px' }} />
              <span style={{ color: 'var(--text-primary)' }}>Low congestion (Open track headroom)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <div style={{ width: '18px', height: '2px', borderTop: '2px dashed var(--signal-amber)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Dashed = Ghat alignment (1:37 gradient)</span>
            </div>
          </div>
        </div>

        {/* Segment Inspector Drawer */}
        <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={16} color="var(--signal-amber)" />
              <span>Segment operational profile</span>
            </div>

            {selectedSeg ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono-text" style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--signal-amber)' }}>
                      {selectedSeg.track_id}
                    </span>
                    <span className={`badge ${selectedSeg.congestion_level === 'High' ? 'badge-red' : (selectedSeg.congestion_level === 'Medium' ? 'badge-amber' : 'badge-green')}`}>
                      {selectedSeg.congestion_level} congestion
                    </span>
                  </div>

                  <div style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedSeg.from_station} ➔ {selectedSeg.to_station}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedSeg.from_station_name} to {selectedSeg.to_station_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedSeg.corridor}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '8px 10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Weekly traffic</span>
                    <div className="mono-text" style={{ fontSize: '1.05rem', fontWeight: '700', color: selectedSeg.congestion_level === 'High' ? 'var(--signal-red)' : 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedSeg.trains_per_week} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>trains</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '8px 10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Length</span>
                    <div className="mono-text" style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedSeg.length_km} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>km</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '8px 10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Speed limit</span>
                    <div className="mono-text" style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--signal-green)', marginTop: '2px' }}>
                      {selectedSeg.max_speed_kmph} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>km/h</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '8px 10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Terrain</span>
                    <div style={{ marginTop: '3px' }}>
                      <span className={`badge ${selectedSeg.terrain === 'ghat/hilly' ? 'badge-amber' : 'badge-green'}`}>
                        {selectedSeg.terrain}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--signal-amber-bg)', border: '1px solid var(--signal-amber-border)', borderRadius: '2px', padding: '10px', fontSize: '0.76rem', color: 'var(--signal-amber)' }}>
                  <strong>Operational advisory:</strong>{' '}
                  {selectedSeg.congestion_level === 'High' 
                    ? 'Tight corridor with heavy continuous train paths. Recommended window max 2 hours late-night (01:00–04:00).' 
                    : 'Track headroom available. Midday or late-night windows can be accommodated safely.'}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <MapPin size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.82rem' }}>Select any track segment on the map or schematic to inspect operational parameters.</p>
              </div>
            )}
          </div>

          {selectedSeg && (
            <button 
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px' }}
              onClick={() => {
                if (onSelectSegment) onSelectSegment(selectedSeg.track_id);
              }}
            >
              Check conflicts on {selectedSeg.track_id}
            </button>
          )}
        </div>
      </div>

      {/* Corridor Schematic Diagrams */}
      <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '16px', marginTop: '18px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
          Corridor schematic line diagrams
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {corridors.map((c, cIdx) => (
            <div key={cIdx} style={{ background: 'var(--bg-panel-deep)', border: '1px solid var(--border-subtle)', borderRadius: '2px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: '600' }}>{c.name}</span>
                <span className="mono-text" style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{c.total_km} km • {c.segments.length} segments</span>
              </div>

              {/* Schematic Node & Segment Rail */}
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '8px 0' }}>
                {c.segments.map((seg, sIdx) => {
                  const isHigh = seg.traffic?.congestion_level === 'High';
                  const segColor = isHigh ? 'var(--signal-red)' : 'var(--signal-amber)';
                  const isGhat = seg.terrain === 'ghat/hilly';

                  return (
                    <React.Fragment key={sIdx}>
                      {/* Station Node */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'var(--signal-amber)',
                          border: '2px solid var(--bg-panel)'
                        }} />
                        <span className="mono-text" style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                          {seg.from_station}
                        </span>
                      </div>

                      {/* Track Segment Connector */}
                      <div 
                        onClick={() => setSelectedSeg(seg)}
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          height: '20px',
                          background: isHigh ? 'var(--signal-red-bg)' : 'var(--signal-amber-bg)',
                          borderTop: `2px ${isGhat ? 'dashed' : 'solid'} ${segColor}`,
                          borderBottom: `2px ${isGhat ? 'dashed' : 'solid'} ${segColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        title={`${seg.track_id}: ${seg.from_station}➔${seg.to_station}`}
                      >
                        <span className="mono-text" style={{ fontSize: '0.62rem', fontWeight: '700', color: segColor }}>
                          {seg.track_id}
                        </span>
                      </div>

                      {/* Final Station on corridor */}
                      {sIdx === c.segments.length - 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '54px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'var(--signal-amber)',
                            border: '2px solid #16242A'
                          }} />
                          <span className="mono-text" style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
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
    </section>
  );
}
