import React, { useEffect, useRef, useState } from 'react';
import { Layers, Activity, Eye, Play, Pause, Compass, Zap, Mountain } from 'lucide-react';

export default function IsometricCorridorHero({ segments = [], onSelectSegment }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState('ALL');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll listener for camera parallax
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Calculate how far hero has scrolled relative to viewport
      const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (windowH + rect.height)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Station network definitions in topological coordinates [x, y, elevation_z]
  // 1. Mumbai-Pune-Solapur Corridor (South-East)
  // 2. Mumbai-Nagpur Trunk Corridor (North-East, branching at Kalyan)
  // 3. Pune-Kolhapur Corridor (South, branching at Pune)
  const networkNodes = {
    // Shared Mumbai Suburbs
    CSMT: { name: 'Mumbai CSMT', code: 'CSMT', x: 80, y: 320, z: 0, corridor: 'Mumbai CSMT - Pune - Solapur' },
    DR:   { name: 'Dadar', code: 'DR', x: 130, y: 300, z: 0, corridor: 'Mumbai CSMT - Pune - Solapur' },
    TNA:  { name: 'Thane', code: 'TNA', x: 190, y: 280, z: 0, corridor: 'Mumbai CSMT - Pune - Solapur' },
    KYN:  { name: 'Kalyan Jcn', code: 'KYN', x: 260, y: 260, z: 0, isJunction: true, corridor: 'Mumbai CSMT - Pune - Solapur' },

    // South-East (Pune & Solapur branch)
    KJT:  { name: 'Karjat', code: 'KJT', x: 340, y: 300, z: 10, corridor: 'Mumbai CSMT - Pune - Solapur' },
    LNL:  { name: 'Lonavala (Bhor Ghat)', code: 'LNL', x: 420, y: 340, z: 50, isGhat: true, corridor: 'Mumbai CSMT - Pune - Solapur' },
    SVJR: { name: 'Shivajinagar', code: 'SVJR', x: 500, y: 360, z: 45, corridor: 'Mumbai CSMT - Pune - Solapur' },
    PUNE: { name: 'Pune Jcn', code: 'PUNE', x: 540, y: 370, z: 45, isJunction: true, corridor: 'Mumbai CSMT - Pune - Solapur' },
    HDP:  { name: 'Hadapsar', code: 'HDP', x: 600, y: 380, z: 40, corridor: 'Mumbai CSMT - Pune - Solapur' },
    DD:   { name: 'Daund Jcn', code: 'DD', x: 680, y: 390, z: 35, corridor: 'Mumbai CSMT - Pune - Solapur' },
    KWV:  { name: 'Kurduvadi Jcn', code: 'KWV', x: 770, y: 400, z: 30, corridor: 'Mumbai CSMT - Pune - Solapur' },
    SUR:  { name: 'Solapur', code: 'SUR', x: 860, y: 410, z: 25, corridor: 'Mumbai CSMT - Pune - Solapur' },

    // North-East (Nagpur Trunk, branching at Kalyan)
    KSRA: { name: 'Kasara', code: 'KSRA', x: 330, y: 200, z: 15, corridor: 'Mumbai - Nagpur Trunk' },
    IGP:  { name: 'Igatpuri (Thal Ghat)', code: 'IGP', x: 410, y: 150, z: 55, isGhat: true, corridor: 'Mumbai - Nagpur Trunk' },
    NK:   { name: 'Nashik Road', code: 'NK', x: 480, y: 130, z: 50, corridor: 'Mumbai - Nagpur Trunk' },
    MMR:  { name: 'Manmad Jcn', code: 'MMR', x: 560, y: 110, z: 40, isJunction: true, corridor: 'Mumbai - Nagpur Trunk' },
    CSN:  { name: 'Chalisgaon', code: 'CSN', x: 630, y: 100, z: 35, corridor: 'Mumbai - Nagpur Trunk' },
    JL:   { name: 'Jalgaon Jcn', code: 'JL', x: 700, y: 90, z: 30, corridor: 'Mumbai - Nagpur Trunk' },
    BSL:  { name: 'Bhusawal Jcn', code: 'BSL', x: 760, y: 85, z: 30, corridor: 'Mumbai - Nagpur Trunk' },
    AK:   { name: 'Akola Jcn', code: 'AK', x: 830, y: 80, z: 30, corridor: 'Mumbai - Nagpur Trunk' },
    BD:   { name: 'Badnera Jcn', code: 'BD', x: 890, y: 75, z: 30, corridor: 'Mumbai - Nagpur Trunk' },
    WR:   { name: 'Wardha Jcn', code: 'WR', x: 950, y: 70, z: 28, corridor: 'Mumbai - Nagpur Trunk' },
    NGP:  { name: 'Nagpur Jcn', code: 'NGP', x: 1010, y: 65, z: 25, corridor: 'Mumbai - Nagpur Trunk' },

    // South branch from Pune (Pune - Kolhapur)
    STR:  { name: 'Satara', code: 'STR', x: 570, y: 440, z: 40, corridor: 'Pune - Kolhapur' },
    KRD:  { name: 'Karad', code: 'KRD', x: 610, y: 490, z: 35, corridor: 'Pune - Kolhapur' },
    SLI:  { name: 'Sangli', code: 'SLI', x: 650, y: 535, z: 30, corridor: 'Pune - Kolhapur' },
    MRJ:  { name: 'Miraj Jcn', code: 'MRJ', x: 680, y: 565, z: 30, corridor: 'Pune - Kolhapur' },
    KOP:  { name: 'C. Shahu Maharaj Terminus (Kolhapur)', code: 'KOP', x: 730, y: 605, z: 30, corridor: 'Pune - Kolhapur' },
  };

  // Topological Track Connections
  const trackLinks = [
    // Mumbai - Pune - Solapur
    { from: 'CSMT', to: 'DR', trackId: 'T001' },
    { from: 'DR', to: 'TNA', trackId: 'T001' },
    { from: 'TNA', to: 'KYN', trackId: 'T002' },
    { from: 'KYN', to: 'KJT', trackId: 'T003' },
    { from: 'KJT', to: 'LNL', trackId: 'T004', isGhat: true },
    { from: 'LNL', to: 'SVJR', trackId: 'T005' },
    { from: 'SVJR', to: 'PUNE', trackId: 'T005' },
    { from: 'PUNE', to: 'HDP', trackId: 'T006' },
    { from: 'HDP', to: 'DD', trackId: 'T006' },
    { from: 'DD', to: 'KWV', trackId: 'T007' },
    { from: 'KWV', to: 'SUR', trackId: 'T007' },

    // Mumbai - Nagpur Trunk (branch from KYN)
    { from: 'KYN', to: 'KSRA', trackId: 'T008' },
    { from: 'KSRA', to: 'IGP', trackId: 'T009', isGhat: true },
    { from: 'IGP', to: 'NK', trackId: 'T010' },
    { from: 'NK', to: 'MMR', trackId: 'T011' },
    { from: 'MMR', to: 'CSN', trackId: 'T012' },
    { from: 'CSN', to: 'JL', trackId: 'T013' },
    { from: 'JL', to: 'BSL', trackId: 'T014' },
    { from: 'BSL', to: 'AK', trackId: 'T015' },
    { from: 'AK', to: 'BD', trackId: 'T016' },
    { from: 'BD', to: 'WR', trackId: 'T017' },
    { from: 'WR', to: 'NGP', trackId: 'T018' },

    // Pune - Kolhapur (branch from PUNE)
    { from: 'PUNE', to: 'STR', trackId: 'T019' },
    { from: 'STR', to: 'KRD', trackId: 'T020' },
    { from: 'KRD', to: 'SLI', trackId: 'T021' },
    { from: 'SLI', to: 'MRJ', trackId: 'T022' },
    { from: 'MRJ', to: 'KOP', trackId: 'T023' },
  ];

  // Train entities with current route positions
  const trainsRef = useRef([
    { id: '12124', name: 'Deccan Queen', color: '#E3A63E', route: ['PUNE', 'SVJR', 'LNL', 'KJT', 'KYN', 'TNA', 'DR', 'CSMT'], progress: 0.15, speed: 0.0006 },
    { id: '12289', name: 'Nagpur Duronto', color: '#4F9D69', route: ['CSMT', 'DR', 'TNA', 'KYN', 'KSRA', 'IGP', 'NK', 'MMR', 'BSL', 'BD', 'NGP'], progress: 0.42, speed: 0.0007 },
    { id: '11029', name: 'Koyna Express', color: '#E3A63E', route: ['CSMT', 'KYN', 'LNL', 'PUNE', 'STR', 'KRD', 'MRJ', 'KOP'], progress: 0.68, speed: 0.0005 },
    { id: '12115', name: 'Siddheshwar Exp', color: '#4F9D69', route: ['CSMT', 'KYN', 'PUNE', 'DD', 'KWV', 'SUR'], progress: 0.85, speed: 0.00065 },
    { id: 'BTPN-44', name: 'BTPN Petroleum Rake', color: '#C1443C', route: ['BSL', 'JL', 'CSN', 'MMR', 'NK', 'IGP', 'KSRA', 'KYN'], progress: 0.32, speed: 0.0004 },
  ]);

  // Project 3D topological coordinates to 2D isometric screen coordinates
  const projectIso = (x, y, z, width, height, scrollRatio) => {
    // Dynamic isometric tilt affected slightly by scroll (parallax)
    const angleX = 0.52 + (scrollRatio - 0.5) * 0.12; // ~30 deg pitch
    const angleZ = 0.65 + (scrollRatio - 0.5) * 0.15; // yaw

    // Center coordinates
    const cx = x - 520;
    const cy = y - 320;
    const cz = z;

    // Isometric 3D rotation & projection
    const isoX = (cx * Math.cos(angleZ) - cy * Math.sin(angleZ)) * 1.15;
    const isoY = (cx * Math.sin(angleZ) + cy * Math.cos(angleZ)) * Math.sin(angleX) - cz * 1.5;

    return {
      x: width * 0.5 + isoX,
      y: height * 0.5 + isoY + 15
    };
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark slate background
      ctx.fillStyle = '#16242A';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle isometric ground grid
      ctx.strokeStyle = 'rgba(143, 163, 168, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let gx = 0; gx < 1100; gx += gridSize) {
        const p1 = projectIso(gx, 0, 0, width, height, scrollProgress);
        const p2 = projectIso(gx, 650, 0, width, height, scrollProgress);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      for (let gy = 0; gy < 700; gy += gridSize) {
        const p1 = projectIso(0, gy, 0, width, height, scrollProgress);
        const p2 = projectIso(1100, gy, 0, width, height, scrollProgress);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Mountain terrain relief for Ghat sections (Kasara-Igatpuri & Karjat-Lonavala)
      const bhorGhat = projectIso(380, 320, 35, width, height, scrollProgress);
      const thalGhat = projectIso(370, 175, 40, width, height, scrollProgress);

      [
        { pt: bhorGhat, label: 'Bhor Ghat (1:37)' },
        { pt: thalGhat, label: 'Thal Ghat (1:37)' }
      ].forEach(ghat => {
        ctx.fillStyle = 'rgba(227, 166, 62, 0.07)';
        ctx.beginPath();
        ctx.arc(ghat.pt.x, ghat.pt.y, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(227, 166, 62, 0.25)';
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#8FA3A8';
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillText(ghat.label, ghat.pt.x - 30, ghat.pt.y + 24);
      });

      // Draw Tracks
      trackLinks.forEach(link => {
        const n1 = networkNodes[link.from];
        const n2 = networkNodes[link.to];
        if (!n1 || !n2) return;

        // Check if corridor matches filter
        const isDimmed = selectedCorridor !== 'ALL' && 
          n1.corridor !== selectedCorridor && n2.corridor !== selectedCorridor;

        // Lookup live segment congestion from backend segments data
        const segData = segments.find(s => s.track_id === link.trackId);
        let trackColor = '#4F9D69'; // Default signal green
        if (segData) {
          if (segData.congestion_level === 'High') trackColor = '#C1443C';
          else if (segData.congestion_level === 'Medium') trackColor = '#E3A63E';
          else trackColor = '#4F9D69';
        } else if (link.isGhat) {
          trackColor = '#E3A63E'; // Ghat is cautious amber
        }

        const p1 = projectIso(n1.x, n1.y, n1.z, width, height, scrollProgress);
        const p2 = projectIso(n2.x, n2.y, n2.z, width, height, scrollProgress);

        // Track Underlay / Bed
        ctx.strokeStyle = isDimmed ? 'rgba(53, 78, 87, 0.3)' : 'rgba(34, 52, 59, 0.9)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Dual Track Rails (steel line)
        ctx.strokeStyle = isDimmed ? 'rgba(79, 110, 122, 0.2)' : 'rgba(78, 110, 122, 0.6)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Live Signal Status Center Line (Functional status color)
        ctx.strokeStyle = isDimmed ? 'rgba(143, 163, 168, 0.15)' : trackColor;
        ctx.lineWidth = 1.8;
        if (link.isGhat) {
          ctx.setLineDash([6, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Signal Light Gantry Dot at Midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = isDimmed ? 'rgba(143, 163, 168, 0.2)' : trackColor;
        ctx.beginPath();
        ctx.arc(midX, midY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and Draw Trains
      if (isPlaying) {
        trainsRef.current.forEach(train => {
          train.progress += train.speed;
          if (train.progress >= 1) train.progress = 0;
        });
      }

      trainsRef.current.forEach(train => {
        // Calculate train current position along multi-node route
        const totalSegments = train.route.length - 1;
        const exactIndex = train.progress * totalSegments;
        const segIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
        const segProgress = exactIndex - segIndex;

        const fromCode = train.route[segIndex];
        const toCode = train.route[segIndex + 1];
        const nFrom = networkNodes[fromCode];
        const nTo = networkNodes[toCode];

        if (nFrom && nTo) {
          const curX = nFrom.x + (nTo.x - nFrom.x) * segProgress;
          const curY = nFrom.y + (nTo.y - nFrom.y) * segProgress;
          const curZ = nFrom.z + (nTo.z - nFrom.z) * segProgress;

          const pTrain = projectIso(curX, curY, curZ, width, height, scrollProgress);

          // Train Headlight Glow
          const grad = ctx.createRadialGradient(pTrain.x, pTrain.y, 1, pTrain.x, pTrain.y, 14);
          grad.addColorStop(0, train.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pTrain.x, pTrain.y, 14, 0, Math.PI * 2);
          ctx.fill();

          // Train Body Block (Tactile railway consist)
          ctx.fillStyle = '#EDE6D8';
          ctx.strokeStyle = '#16242A';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pTrain.x - 5, pTrain.y - 4, 10, 7, 2);
          ctx.fill();
          ctx.stroke();

          // Train Tail Signal Light
          ctx.fillStyle = '#C1443C';
          ctx.beginPath();
          ctx.arc(pTrain.x - 4, pTrain.y - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Train Label
          ctx.fillStyle = '#EDE6D8';
          ctx.font = '10px "IBM Plex Mono", monospace';
          ctx.fillText(train.id, pTrain.x + 8, pTrain.y - 4);
        }
      });

      // Draw Station Nodes & Labels
      Object.keys(networkNodes).forEach(code => {
        const node = networkNodes[code];
        const pt = projectIso(node.x, node.y, node.z, width, height, scrollProgress);

        const isHovered = hoveredNode && hoveredNode.code === code;
        const isDimmed = selectedCorridor !== 'ALL' && node.corridor !== selectedCorridor;

        // Station Halo
        ctx.fillStyle = isHovered 
          ? 'rgba(227, 166, 62, 0.4)' 
          : (node.isJunction ? 'rgba(237, 230, 216, 0.2)' : 'rgba(143, 163, 168, 0.15)');
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, node.isJunction ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        // Station Core Dot
        ctx.fillStyle = isHovered ? '#E3A63E' : (node.isJunction ? '#EDE6D8' : '#8FA3A8');
        if (isDimmed) ctx.fillStyle = 'rgba(143, 163, 168, 0.3)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, node.isJunction ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (node.isJunction || isHovered || ['CSMT', 'PUNE', 'NGP', 'SUR', 'KOP', 'LNL', 'IGP'].includes(code)) {
          ctx.fillStyle = isHovered ? '#E3A63E' : (isDimmed ? 'rgba(143, 163, 168, 0.3)' : '#EDE6D8');
          ctx.font = node.isJunction ? '600 11px "IBM Plex Sans", sans-serif' : '500 10px "IBM Plex Sans", sans-serif';
          ctx.fillText(code, pt.x + 8, pt.y + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [scrollProgress, isPlaying, selectedCorridor, segments, hoveredNode]);

  // Handle canvas mouse hover to inspect stations
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    let found = null;
    Object.keys(networkNodes).forEach(code => {
      const node = networkNodes[code];
      const pt = projectIso(node.x, node.y, node.z, canvas.width, canvas.height, scrollProgress);
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < 14) {
        found = node;
      }
    });

    setHoveredNode(found);
    if (found) {
      setTelemetry({
        type: 'Station',
        name: found.name,
        code: found.code,
        corridor: found.corridor,
        elevation: found.z > 0 ? `${found.z * 10}m (Elevated/Ghat)` : 'Normal Grade'
      });
    } else {
      setTelemetry(null);
    }
  };

  const handleCanvasClick = () => {
    if (hoveredNode && onSelectSegment) {
      // Find track starting or ending at this station
      const matchingSeg = segments.find(s => s.from_station === hoveredNode.code || s.to_station === hoveredNode.code);
      if (matchingSeg) {
        onSelectSegment(matchingSeg.track_id);
      }
    }
  };

  return (
    <div className="hero-isometric-container" ref={containerRef}>
      {/* Hero Header */}
      <div className="hero-header-bar">
        <div className="hero-title-group">
          <div className="hero-main-title">
            <Compass size={18} color="var(--signal-amber)" />
            <span>Maharashtra Central Railway — 3D Isometric Corridor Model</span>
          </div>
          <p className="hero-subtitle">
            Perspective responds to page scroll depth. Visualizes real-time track block states and train consist movements across 1,568 route kilometers.
          </p>
        </div>

        {/* Live Legend */}
        <div className="hero-legend-group">
          <div className="legend-chip">
            <span className="legend-dot green"></span>
            <span>Clear / Low Congestion</span>
          </div>
          <div className="legend-chip">
            <span className="legend-dot amber"></span>
            <span>Maintenance / Ghat Alert</span>
          </div>
          <div className="legend-chip">
            <span className="legend-dot red"></span>
            <span>High Occupancy / Overrun Risk</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div 
        className="iso-canvas-wrapper" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={() => { setHoveredNode(null); setTelemetry(null); }}
        onClick={handleCanvasClick}
      >
        <canvas 
          ref={canvasRef} 
          width={1280} 
          height={480} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Corner HUD Telemetry */}
        <div className="iso-telemetry-hud">
          {telemetry ? (
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>{telemetry.name} [{telemetry.code}]</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {telemetry.corridor} • {telemetry.elevation}
              </div>
            </div>
          ) : (
            <div>
              <span style={{ color: 'var(--signal-amber)', fontWeight: '600' }}>LIVE NETWORK:</span> 3 Corridors • 23 Double-Line Track Blocks • 16 Active Trains
            </div>
          )}
        </div>

        {/* Viewport Control Buttons */}
        <div className="iso-controls-hud">
          <button 
            className="iso-hud-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause train movement' : 'Resume train movement'}
          >
            {isPlaying ? <Pause size={12} style={{ marginRight: '4px' }} /> : <Play size={12} style={{ marginRight: '4px' }} />}
            {isPlaying ? 'Pause Simulation' : 'Resume'}
          </button>

          <button 
            className="iso-hud-btn"
            onClick={() => {
              if (selectedCorridor === 'ALL') setSelectedCorridor('Mumbai CSMT - Pune - Solapur');
              else if (selectedCorridor === 'Mumbai CSMT - Pune - Solapur') setSelectedCorridor('Mumbai - Nagpur Trunk');
              else if (selectedCorridor === 'Mumbai - Nagpur Trunk') setSelectedCorridor('Pune - Kolhapur');
              else setSelectedCorridor('ALL');
            }}
          >
            <Layers size={12} style={{ marginRight: '4px' }} />
            Corridor: {selectedCorridor === 'ALL' ? 'All 3 Corridors' : selectedCorridor.split(' - ')[1] || selectedCorridor}
          </button>
        </div>
      </div>
    </div>
  );
}
