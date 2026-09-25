import React, { useState, useEffect } from 'react';
import { 
  Train, Shield, Zap, Sparkles, ArrowRight, Lock, 
  CheckCircle2, Compass, Layers, Cpu, FileText, Activity
} from 'lucide-react';

export default function LandingPage({ onLaunchControlRoom, onOpenAuth, currentUser }) {
  const [scrollY, setScrollY] = useState(0);

  // Subtle scroll parallax & scale effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #F6F3EC)',
      color: 'var(--text-primary, #1C2B30)',
      fontFamily: 'var(--font-ui, system-ui, -apple-system, sans-serif)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Sticky Clean Light Navbar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '14px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(246, 243, 236, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(28, 43, 48, 0.12)',
        boxShadow: '0 2px 10px rgba(28, 43, 48, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/arc_logo.png" 
            alt="ARC Logo" 
            style={{ 
              height: '42px', 
              width: 'auto', 
              objectFit: 'contain',
              borderRadius: '4px'
            }} 
          />
          <div>
            <div style={{ fontSize: '1.18rem', fontWeight: '900', letterSpacing: '0.6px', color: '#1C2B30' }}>
              ARC
            </div>
            <div style={{ fontSize: '0.66rem', color: '#6B7B80', letterSpacing: '0.3px', textTransform: 'uppercase', fontWeight: '800' }}>
              Adaptive Railway Coordination • AI Block Planning
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenAuth}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(28, 43, 48, 0.18)',
              color: '#1C2B30',
              padding: '7px 18px',
              borderRadius: '5px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 1px 3px rgba(28, 43, 48, 0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            <Lock size={14} color="#8C5800" />
            <span>{currentUser ? currentUser.name : 'Official Sign-In'}</span>
          </button>

          <button
            onClick={onLaunchControlRoom}
            style={{
              background: '#E3A63E',
              color: '#1C2B30',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '5px',
              fontSize: '0.84rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(227, 166, 62, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Launch Console</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 2D 4K Daylight Train Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '86vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '130px 24px 70px 24px',
        overflow: 'hidden'
      }}>
        {/* Background 4K Daylight Train Image with high visibility */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: 'url(/vande_bharat_daylight_4k.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          opacity: 0.88,
          transform: `scale(${1 + Math.min(scrollY * 0.0003, 0.08)}) translateY(${scrollY * 0.12}px)`,
          transition: 'transform 0.1s ease-out'
        }} />

        {/* Soft light gradient blend that keeps the image vibrant while preserving contrast */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          background: `
            linear-gradient(to bottom, 
              rgba(246, 243, 236, 0.45) 0%, 
              rgba(246, 243, 236, 0.18) 35%, 
              rgba(246, 243, 236, 0.68) 75%, 
              #F6F3EC 100%
            )
          `
        }} />

        {/* Foreground Minimalist Hero Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '920px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(227, 166, 62, 0.6)',
            borderRadius: '24px',
            color: '#8C5800',
            fontSize: '0.78rem',
            fontWeight: '800',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
          }}>
            <Sparkles size={14} color="#E3A63E" />
            <span>Central Railway Decision Support • Maharashtra Pilot</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: '900',
            lineHeight: 1.1,
            color: '#1C2B30',
            margin: '0 0 16px 0',
            letterSpacing: '-1.2px',
            textShadow: '0 2px 16px rgba(246, 243, 236, 0.95), 0 1px 4px rgba(255, 255, 255, 0.8)'
          }}>
            Autonomous AI Railway Block Planning & Optimization
          </h1>

          <p style={{
            fontSize: '1.14rem',
            color: '#1C2B30',
            maxWidth: '680px',
            lineHeight: 1.55,
            margin: '0 auto 32px auto',
            fontWeight: '600',
            textShadow: '0 2px 14px rgba(246, 243, 236, 0.95), 0 1px 2px rgba(255, 255, 255, 0.8)'
          }}>
            Zero-conflict maintenance schedule optimization across P-Way Track, 25kV OHE Traction, and Signal Interlocking.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onLaunchControlRoom}
              style={{
                padding: '14px 34px',
                background: '#E3A63E',
                color: '#1C2B30',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.96rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 18px rgba(227, 166, 62, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Enter Live Control Room</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={onOpenAuth}
              style={{
                padding: '14px 26px',
                background: '#FFFFFF',
                border: '1px solid rgba(28, 43, 48, 0.2)',
                color: '#1C2B30',
                borderRadius: '5px',
                fontSize: '0.94rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(28, 43, 48, 0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              Official Sign-In
            </button>
          </div>
        </div>

        {/* Minimal Live Stats Ribbon in Light Theme */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginTop: '50px',
          display: 'flex',
          gap: '28px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '12px 28px',
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(28, 43, 48, 0.12)',
          boxShadow: '0 4px 16px rgba(28, 43, 48, 0.06)',
          backdropFilter: 'blur(10px)',
          borderRadius: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#4F9D69' }}></span>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}><strong style={{ color: '#1C2B30' }}>23</strong> Monitored Segments</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: 'rgba(28, 43, 48, 0.15)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0284c7' }}></span>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}><strong style={{ color: '#1C2B30' }}>0</strong> Overlap Conflicts</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: 'rgba(28, 43, 48, 0.15)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E3A63E' }}></span>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}><strong style={{ color: '#1C2B30' }}>+22.4h</strong> Track Capacity Saved</span>
          </div>
        </div>
      </section>

      {/* 3 Clean Light Pillars Section */}
      <section style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '30px 24px 90px 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '22px'
        }}>
          {/* Pillar 1 */}
          <div style={{
            background: 'var(--bg-panel, #EDE7DA)',
            border: '1px solid rgba(28, 43, 48, 0.12)',
            borderRadius: '8px',
            padding: '26px',
            boxShadow: '0 2px 8px rgba(28, 43, 48, 0.04)',
            textAlign: 'left'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Cpu size={22} color="#0284c7" />
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: '800', color: '#1C2B30', margin: '0 0 8px 0' }}>
              AI Multi-Dept Solver
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
              Packs defect work orders from TMS, SMMS & TDMS into synchronized joint mega-blocks, saving +22h track capacity.
            </p>
          </div>

          {/* Pillar 2 */}
          <div style={{
            background: 'var(--bg-panel, #EDE7DA)',
            border: '1px solid rgba(28, 43, 48, 0.12)',
            borderRadius: '8px',
            padding: '26px',
            boxShadow: '0 2px 8px rgba(28, 43, 48, 0.04)',
            textAlign: 'left'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(79, 157, 105, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Zap size={22} color="#226437" />
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: '800', color: '#1C2B30', margin: '0 0 8px 0' }}>
              100% Conflict-Free
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
              Real-time conflict engine interlocks timetable paths with Bayesian dynamic safety buffers for zero passenger delays.
            </p>
          </div>

          {/* Pillar 3 */}
          <div style={{
            background: 'var(--bg-panel, #EDE7DA)',
            border: '1px solid rgba(28, 43, 48, 0.12)',
            borderRadius: '8px',
            padding: '26px',
            boxShadow: '0 2px 8px rgba(28, 43, 48, 0.04)',
            textAlign: 'left'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(227, 166, 62, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <FileText size={22} color="#8C5800" />
            </div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: '800', color: '#1C2B30', margin: '0 0 8px 0' }}>
              Statutory Rail Dossiers
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
              Generates official Form T/409 Caution Orders, S&T T/351 Disconnections, and Marey String Charts directly for controllers.
            </p>
          </div>
        </div>

        {/* Bottom Launch CTA Bar */}
        <div style={{ marginTop: '46px', textAlign: 'center' }}>
          <button
            onClick={onLaunchControlRoom}
            style={{
              padding: '13px 36px',
              background: '#E3A63E',
              color: '#1C2B30',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.94rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(227, 166, 62, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            Launch Control Room Workspace
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        padding: '20px 40px',
        borderTop: '1px solid rgba(28, 43, 48, 0.12)',
        background: 'var(--bg-panel-deep, #E2DACB)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: '#6B7B80'
      }}>
        <div style={{ fontWeight: '600' }}>ARC (Adaptive Railway Coordination) • Central Railway Pilot</div>
        <div className="mono-text" style={{ fontWeight: '600' }}>Mumbai CSMT • Pune • Nagpur • Solapur</div>
      </footer>
    </div>
  );
}
