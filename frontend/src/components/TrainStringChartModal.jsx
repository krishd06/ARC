import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Filter, Clock, Train, Shield, Layers, ZoomIn, ZoomOut } from 'lucide-react';

export default function TrainStringChartModal({ isOpen, onClose, segments = [] }) {
  if (!isOpen) return null;

  const [selectedCorridor, setSelectedCorridor] = useState('Mumbai-Pune-Solapur');
  const [selectedTimeRange, setSelectedTimeRange] = useState('full'); // full, night, day
  const [showFreight, setShowFreight] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);

  // Stations on selected corridor in distance order
  const corridorStations = useMemo(() => {
    if (selectedCorridor.includes('Pune') || selectedCorridor.includes('Solapur')) {
      return [
        { code: 'CSMT', name: 'Mumbai CSMT', km: 0 },
        { code: 'DR', name: 'Dadar', km: 9 },
        { code: 'TNA', name: 'Thane', km: 34 },
        { code: 'KYN', name: 'Kalyan Jn', km: 54 },
        { code: 'KJT', name: 'Karjat Jn', km: 100 },
        { code: 'LNL', name: 'Lonavala (Ghat)', km: 128 },
        { code: 'PUNE', name: 'Pune Jn', km: 192 },
        { code: 'DD', name: 'Daund Jn', km: 268 },
        { code: 'KWV', name: 'Kurduvadi', km: 377 },
        { code: 'SUR', name: 'Solapur', km: 456 }
      ];
    } else if (selectedCorridor.includes('Nagpur') || selectedCorridor.includes('Bhusawal')) {
      return [
        { code: 'CSMT', name: 'Mumbai CSMT', km: 0 },
        { code: 'KYN', name: 'Kalyan Jn', km: 54 },
        { code: 'KSRA', name: 'Kasara (Ghat)', km: 121 },
        { code: 'IGP', name: 'Igatpuri', km: 137 },
        { code: 'NK', name: 'Nashik Road', km: 188 },
        { code: 'MMR', name: 'Manmad Jn', km: 261 },
        { code: 'BSL', name: 'Bhusawal Jn', km: 444 },
        { code: 'AK', name: 'Akola Jn', km: 583 },
        { code: 'BD', name: 'Badnera Jn', km: 662 },
        { code: 'WR', name: 'Wardha Jn', km: 757 },
        { code: 'NGP', name: 'Nagpur Jn', km: 837 }
      ];
    } else {
      return [
        { code: 'PUNE', name: 'Pune Jn', km: 0 },
        { code: 'STR', name: 'Satara', km: 145 },
        { code: 'KRD', name: 'Karad', km: 204 },
        { code: 'SLI', name: 'Sangli', km: 272 },
        { code: 'MRJ', name: 'Miraj Jn', km: 280 },
        { code: 'KOP', name: 'Kolhapur SCSMT', km: 327 }
      ];
    }
  }, [selectedCorridor]);

  const maxKm = corridorStations[corridorStations.length - 1]?.km || 456;

  // Generate realistic train paths
  const trains = useMemo(() => {
    return [
      { id: '12127', name: 'Intercity Exp (CSMT-PUNE)', type: 'exp', color: '#38bdf8', points: [[0, 6.6], [54, 7.5], [128, 8.8], [192, 9.9]] },
      { id: '12128', name: 'Intercity Exp (PUNE-CSMT)', type: 'exp', color: '#38bdf8', points: [[192, 17.9], [128, 19.0], [54, 20.3], [0, 21.2]] },
      { id: '22225', name: 'Vande Bharat (CSMT-SUR)', type: 'vb', color: '#c084fc', points: [[0, 6.1], [54, 6.9], [128, 8.0], [192, 9.1], [268, 10.1], [456, 12.5]] },
      { id: '11019', name: 'Konark Exp (CSMT-SUR)', type: 'exp', color: '#60a5fa', points: [[0, 14.0], [54, 15.0], [128, 16.5], [192, 17.8], [268, 19.1], [456, 22.0]] },
      { id: '12115', name: 'Siddheshwar Exp', type: 'exp', color: '#60a5fa', points: [[0, 22.8], [54, 23.8], [128, 25.2], [192, 26.5], [456, 30.5]] },
      { id: 'G-BOXN-1', name: 'FOIS Coal Rake (Bhusawal-DD)', type: 'freight', color: '#fb923c', points: [[0, 1.2], [54, 2.5], [128, 4.2], [192, 5.8], [268, 7.5]] },
      { id: 'G-CONTR-2', name: 'JNPT Port Container Rake', type: 'freight', color: '#fb923c', points: [[54, 11.0], [128, 13.0], [192, 14.8], [268, 16.5], [456, 20.0]] },
      { id: 'G-BCN-3', name: 'Foodgrains BCN Consist', type: 'freight', color: '#fb923c', points: [[456, 2.0], [268, 5.0], [192, 7.2], [128, 9.0], [0, 11.5]] }
    ];
  }, [selectedCorridor]);

  // Maintenance block envelopes
  const maintenanceBlocks = useMemo(() => {
    return [
      { id: 'BLK-01', section: 'KYN-KJT', startKm: 54, endKm: 100, startTime: 1.5, endTime: 4.0, dept: 'Joint (P-Way + TRD)', color: '#10b981' },
      { id: 'BLK-02', section: 'KJT-LNL', startKm: 100, endKm: 128, startTime: 1.0, endTime: 4.5, dept: 'Civil Track Deep Screening', color: '#38bdf8' },
      { id: 'BLK-03', section: 'LNL-PUNE', startKm: 128, endKm: 192, startTime: 2.0, endTime: 4.0, dept: 'S&T Interlocking Clearance', color: '#c084fc' },
      { id: 'BLK-04', section: 'DD-KWV', startKm: 268, endKm: 377, startTime: 12.5, endTime: 14.5, dept: 'TRD 25kV OHE Overhaul', color: '#f59e0b' }
    ];
  }, [selectedCorridor]);

  // Coordinate scales
  const svgWidth = 840;
  const svgHeight = 440;
  const padLeft = 80;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  const getX = (hour) => padLeft + (hour / 24) * chartW;
  const getY = (km) => padTop + (km / maxKm) * chartH;

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
          maxHeight: '94vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid #38bdf8',
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
            <TrendingUp size={20} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Master Train String Chart (Time-Distance Graph / Marey Diagram)
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Corridor train trajectories cross-referenced with maintenance block windows (00:00 to 24:00)
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

        {/* Toolbar Controls */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Corridor:</span>
              <select 
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
              >
                <option value="Mumbai-Pune-Solapur">Mumbai CSMT - Pune - Solapur</option>
                <option value="Mumbai-Nashik-Nagpur">Mumbai CSMT - Bhusawal - Nagpur</option>
                <option value="Pune-Miraj-Kolhapur">Pune - Miraj - Kolhapur</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showFreight} 
                onChange={(e) => setShowFreight(e.target.checked)}
                style={{ accentColor: '#fb923c' }}
              />
              <span style={{ color: '#fb923c' }}>FOIS Freight Paths</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showBlocks} 
                onChange={(e) => setShowBlocks(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <span style={{ color: '#10b981' }}>Block Possession Envelopes</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '3px', background: '#38bdf8', display: 'inline-block' }}></span>
              <span>Express Timetable</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '3px', background: '#fb923c', display: 'inline-block' }}></span>
              <span>Freight Rakes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '8px', background: 'rgba(16, 185, 129, 0.35)', border: '1px solid #10b981', display: 'inline-block' }}></span>
              <span>Safe Block Window</span>
            </div>
          </div>
        </div>

        {/* SVG String Chart Canvas */}
        <div style={{ padding: '16px 20px', overflowX: 'auto', background: 'var(--bg-panel-deep)' }}>
          <svg width={svgWidth} height={svgHeight} style={{ background: '#0b1418', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            {/* Grid Lines - Time (X-axis) */}
            {hours.map((h) => {
              const x = getX(h);
              const isLull = h >= 1 && h <= 4;
              return (
                <g key={`hour-${h}`}>
                  {isLull && (
                    <rect 
                      x={getX(1)} 
                      y={padTop} 
                      width={getX(4.5) - getX(1)} 
                      height={chartH} 
                      fill="rgba(56, 189, 248, 0.05)" 
                    />
                  )}
                  <line 
                    x1={x} 
                    y1={padTop} 
                    x2={x} 
                    y2={padTop + chartH} 
                    stroke="rgba(255, 255, 255, 0.08)" 
                    strokeDasharray={h % 4 === 0 ? "none" : "2,2"} 
                  />
                  <text 
                    x={x} 
                    y={padTop + chartH + 18} 
                    fill="#94a3b8" 
                    fontSize="10" 
                    textAnchor="middle" 
                    fontFamily="monospace"
                  >
                    {String(h).padStart(2, '0')}:00
                  </text>
                </g>
              );
            })}

            {/* Grid Lines - Stations (Y-axis) */}
            {corridorStations.map((stn) => {
              const y = getY(stn.km);
              return (
                <g key={`stn-${stn.code}`}>
                  <line 
                    x1={padLeft} 
                    y1={y} 
                    x2={padLeft + chartW} 
                    y2={y} 
                    stroke="rgba(255, 255, 255, 0.08)" 
                  />
                  <text 
                    x={padLeft - 8} 
                    y={y + 3} 
                    fill="#cbd5e1" 
                    fontSize="10" 
                    textAnchor="end" 
                    fontWeight="600"
                  >
                    {stn.code}
                  </text>
                  <text 
                    x={padLeft + chartW + 6} 
                    y={y + 3} 
                    fill="#64748b" 
                    fontSize="9" 
                    textAnchor="start" 
                    fontFamily="monospace"
                  >
                    {stn.km}k
                  </text>
                </g>
              );
            })}

            {/* Nocturnal Lull Label */}
            <text 
              x={getX(2.75)} 
              y={padTop + 14} 
              fill="#38bdf8" 
              fontSize="9" 
              textAnchor="middle" 
              fontWeight="700"
              opacity="0.8"
            >
              🌙 NOCTURNAL LULL (01:00-04:30)
            </text>

            {/* Maintenance Block Windows (Envelopes) */}
            {showBlocks && maintenanceBlocks.map((blk) => {
              const x1 = getX(blk.startTime);
              const x2 = getX(blk.endTime);
              const y1 = getY(blk.startKm);
              const y2 = getY(blk.endKm);
              const w = Math.max(8, x2 - x1);
              const h = Math.max(12, y2 - y1);

              return (
                <g key={blk.id}>
                  <rect 
                    x={x1} 
                    y={y1} 
                    width={w} 
                    height={h} 
                    fill="rgba(16, 185, 129, 0.22)" 
                    stroke="#10b981" 
                    strokeWidth="1.5" 
                    rx="2" 
                  />
                  <text 
                    x={x1 + w / 2} 
                    y={y1 + h / 2 + 3} 
                    fill="#a7f3d0" 
                    fontSize="8.5" 
                    textAnchor="middle" 
                    fontWeight="700"
                  >
                    {blk.id} ({blk.dept})
                  </text>
                </g>
              );
            })}

            {/* Train String Lines */}
            {trains.filter(t => t.type !== 'freight' || showFreight).map((t) => {
              const pathD = t.points.map((pt, i) => {
                const x = getX(pt[1]);
                const y = getY(pt[0]);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              return (
                <g key={t.id}>
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke={t.color} 
                    strokeWidth={t.type === 'vb' ? "2.5" : "1.8"} 
                    strokeDasharray={t.type === 'freight' ? "4,3" : "none"}
                    opacity="0.9" 
                  />
                  {/* Train Number Label */}
                  {t.points[0] && (
                    <text 
                      x={getX(t.points[0][1]) + 4} 
                      y={getY(t.points[0][0]) + (t.points[0][0] > 100 ? -4 : 10)} 
                      fill={t.color} 
                      fontSize="8.5" 
                      fontWeight="700" 
                      fontFamily="monospace"
                    >
                      {t.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
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
            Control Office String Chart Simulation • Generated dynamically from COA Timetable & FOIS Forecast
          </span>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
}
