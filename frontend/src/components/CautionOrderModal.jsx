import React, { useState } from 'react';
import { X, FileText, AlertTriangle, ShieldCheck, Printer, CheckCircle2, Download } from 'lucide-react';

export default function CautionOrderModal({ isOpen, onClose, blocks = [] }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('t409'); // 't409' (Caution Order) or 't351' (S&T Disconnection)

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
          maxWidth: '860px',
          width: '100%',
          maxHeight: '92vh',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid var(--signal-amber)',
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
            <FileText size={20} color="var(--signal-amber)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Statutory Railway Safety Forms & Disconnection Memos
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                General & Subsidiary Rules (G&SR) Compliance Dossiers for Section Controller & Loco Pilots
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

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('t409')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 't409' ? '2px solid var(--signal-amber)' : '2px solid transparent',
              color: activeTab === 't409' ? 'var(--signal-amber)' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📜 FORM T/409 (Caution Order / TSR Memo)</span>
          </button>

          <button
            onClick={() => setActiveTab('t351')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 't351' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 't351' ? '#38bdf8' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡ FORM S&T T/351 (Disconnection & Reconnection Notice)</span>
          </button>
        </div>

        {/* Document Content Paper */}
        <div style={{ padding: '20px', overflowY: 'auto', background: '#F8F6F0', color: '#1B242A', fontFamily: 'serif' }}>
          {activeTab === 't409' ? (
            <div style={{ border: '2px solid #1B242A', padding: '24px', background: '#FFF' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #1B242A', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>CENTRAL RAILWAY • MUMBAI DIVISION</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', margin: '4px 0' }}>FORM T/409 (CAUTION ORDER)</div>
                <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Issued under GR 4.09 / SR 4.09-1 to Driver/Guard/Section Controller</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', marginBottom: '16px', fontFamily: 'monospace' }}>
                <div><strong>Station / Block Post:</strong> KALYAN JN (KYN)</div>
                <div><strong>Date & Time of Issue:</strong> 05/08/2026 00:45 IST</div>
                <div><strong>Corridor Trunk:</strong> Mumbai-Pune-Solapur Double-Line</div>
                <div><strong>Authorizing Officer:</strong> CTNL / P-Way Sr. Section Engineer</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '16px', border: '1px solid #1B242A' }}>
                <thead>
                  <tr style={{ background: '#ECE8DD', borderBottom: '1px solid #1B242A' }}>
                    <th style={{ border: '1px solid #1B242A', padding: '6px' }}>Sr.</th>
                    <th style={{ border: '1px solid #1B242A', padding: '6px' }}>Section / Km Between</th>
                    <th style={{ border: '1px solid #1B242A', padding: '6px' }}>Speed Restr. (KMPH)</th>
                    <th style={{ border: '1px solid #1B242A', padding: '6px' }}>Whistle (W/L)</th>
                    <th style={{ border: '1px solid #1B242A', padding: '6px' }}>Reason & Work Order</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>T003: KYN-KJT (Km 64.2 - 65.0)</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#B91C1C' }}>30 KMPH</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>W/L Board</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>Thermit weld repair & BCM deep screening</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>2</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>T004: KJT-LNL (Km 112.5 - 118.0)</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#B91C1C' }}>20 KMPH</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>Caution</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>Bhor Ghat catch siding & OHE neutral section test</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>3</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>T008: DD-KWV (Km 288.0 - 291.5)</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#B91C1C' }}>45 KMPH</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px', textAlign: 'center' }}>W Board</td>
                    <td style={{ border: '1px solid #1B242A', padding: '6px' }}>Track geometry alignment & sleeper packing</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '0.78rem', paddingTop: '16px', borderTop: '1px dashed #1B242A' }}>
                <div>Signature of Driver: ____________________</div>
                <div>Signature of Guard: ____________________</div>
                <div>Station Master On-Duty: <strong>[VERIFIED COA]</strong></div>
              </div>
            </div>
          ) : (
            <div style={{ border: '2px solid #1B242A', padding: '24px', background: '#FFF' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #1B242A', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>SIGNAL & TELECOMMUNICATION DEPARTMENT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', margin: '4px 0' }}>FORM S&T (T/351)</div>
                <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Notice of Disconnection / Reconnection of Interlocking & Signal Gears</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', marginBottom: '16px', fontFamily: 'monospace' }}>
                <div><strong>To:</strong> Station Master / Route Setting In-charge</div>
                <div><strong>From:</strong> SSE (Signal) / Electronic Interlocking</div>
                <div><strong>Location:</strong> Karjat Jn (KJT) East Interlocking Cabin</div>
                <div><strong>Possession Granted:</strong> 02:00 to 04:30 IST</div>
              </div>

              <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '12px', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>GEARS TO BE DISCONNECTED:</strong> Point machine 108B Facing Point Lock (FPL), Up Main Line MSDAC dual axle counter heads (Track Circuit 108T).
                </p>
                <p style={{ margin: 0 }}>
                  <strong>SAFETY PRECAUTION:</strong> Non-interlocked working in force. Clamp and pad-lock point 108 in Normal position for Up Vande Bharat clearance.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '0.78rem', paddingTop: '16px', borderTop: '1px dashed #1B242A' }}>
                <div>SSE / Signal: <strong>S&T Central Railway</strong></div>
                <div>Consent of Station Master: <strong>ACCEPTED</strong></div>
                <div>Status: <span style={{ color: '#16A34A', fontWeight: 'bold' }}>✓ Coordinated Mega-Block</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-panel-deep)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => alert('Printing Form T/409 Caution Order to Control Office Line Printer...')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              <span>Print Caution Memo</span>
            </button>
          </div>

          <button 
            type="button" 
            className="btn btn-green btn-sm" 
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
