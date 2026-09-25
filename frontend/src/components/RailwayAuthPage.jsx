import React, { useState } from 'react';
import { 
  ShieldCheck, Train, Key, UserCheck, Lock, ArrowRight, 
  CheckCircle2, AlertTriangle, Building, Briefcase, Eye, EyeOff,
  Sparkles, Shield, ChevronRight
} from 'lucide-react';

export default function RailwayAuthPage({ onLoginSuccess, onNavigateToLanding }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Form State
  const [employeeId, setEmployeeId] = useState('CR/MUM/88421');
  const [password, setPassword] = useState('RailNet@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Section Controller (Operating / COA)');
  const [selectedDivision, setSelectedDivision] = useState('Mumbai Division (CSMT)');
  const [fullName, setFullName] = useState('Er. Rajesh K. Deshmukh');
  const [email, setEmail] = useState('rajesh.deshmukh@cr.railnet.gov.in');
  
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Pre-configured Verified Demo Official Profiles for Instant Testing
  const demoProfiles = [
    {
      role: 'Chief Train Controller (CTNL)',
      dept: 'Operating (COA)',
      name: 'Shri A. N. Joshi (CTNL / Mumbai)',
      pf: 'CR/HQ/44019',
      division: 'Mumbai Division (CSMT)',
      badgeColor: '#0284c7'
    },
    {
      role: 'Sr. Divisional Engineer (Sr. DEN / Track)',
      dept: 'Civil Engineering (P-Way)',
      name: 'Er. Rajesh K. Deshmukh (Sr. DEN)',
      pf: 'CR/MUM/88421',
      division: 'Mumbai Division (CSMT)',
      badgeColor: '#226437'
    },
    {
      role: 'Sr. Div. Electrical Engineer (Sr. DEE)',
      dept: 'Electrical TRD (25kV OHE)',
      name: 'Er. Vikram V. Patil (Sr. DEE)',
      pf: 'CR/PUN/67104',
      division: 'Pune Division (PUNE)',
      badgeColor: '#8C5800'
    },
    {
      role: 'Sr. Div. Signal Engineer (Sr. DSTE)',
      dept: 'Signal & Telecom (S&T)',
      name: 'Er. S. M. Kulkarni (Sr. DSTE)',
      pf: 'CR/BSL/91280',
      division: 'Bhusawal Division (BSL)',
      badgeColor: '#7c3aed'
    }
  ];

  const handleQuickLogin = (profile) => {
    setAuthenticating(true);
    setAuthError('');
    setAuthSuccess('');

    setTimeout(() => {
      const user = {
        name: profile.name,
        role: profile.role,
        department: profile.dept,
        employeeId: profile.pf,
        division: profile.division,
        authenticated: true,
        loginTime: new Date().toLocaleTimeString()
      };
      
      try {
        sessionStorage.setItem('rail_sentinel_user', JSON.stringify(user));
        localStorage.setItem('rail_sentinel_user', JSON.stringify(user));
      } catch (e) {}

      setAuthenticating(false);
      setAuthSuccess(`Welcome, ${profile.name}! Authenticated with Central Railway COA/TMS credentials.`);
      
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 600);
    }, 400);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      setAuthError('Please provide your Railway Employee PF / HRMS ID and password.');
      return;
    }

    setAuthenticating(true);
    setAuthError('');

    setTimeout(() => {
      const user = {
        name: authMode === 'register' ? fullName : (employeeId === 'CR/MUM/88421' ? 'Er. Rajesh K. Deshmukh (Sr. DEN)' : employeeId),
        role: selectedRole,
        department: selectedRole.includes('Civil') ? 'Civil Engineering' : (selectedRole.includes('Electrical') ? 'Electrical (TRD)' : (selectedRole.includes('Signal') ? 'Signal & Telecom (S&T)' : 'Operating (COA)')),
        employeeId: employeeId,
        division: selectedDivision,
        authenticated: true,
        loginTime: new Date().toLocaleTimeString()
      };

      try {
        sessionStorage.setItem('rail_sentinel_user', JSON.stringify(user));
        localStorage.setItem('rail_sentinel_user', JSON.stringify(user));
      } catch (e) {}

      setAuthenticating(false);
      setAuthSuccess(`Authentication successful! Redirecting to Control Room Workspace...`);

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(user);
      }, 600);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #F6F3EC)',
      color: 'var(--text-primary, #1C2B30)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'var(--font-ui)'
    }}>
      {/* Top Header */}
      <header style={{
        padding: '14px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(28, 43, 48, 0.12)',
        background: 'rgba(246, 243, 236, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(28, 43, 48, 0.04)'
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
            <div style={{ fontSize: '0.66rem', color: '#6B7B80', fontWeight: '800', textTransform: 'uppercase' }}>
              Adaptive Railway Coordination • CRIS & RailNet Auth Gateway
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToLanding}
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(28, 43, 48, 0.18)',
            color: '#1C2B30',
            padding: '7px 16px',
            borderRadius: '5px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(28, 43, 48, 0.06)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>← Return to Home</span>
        </button>
      </header>

      {/* Main Form Centerpiece */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          maxWidth: '960px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          background: '#FFFFFF',
          border: '1px solid rgba(28, 43, 48, 0.14)',
          borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(28, 43, 48, 0.08)',
          overflow: 'hidden'
        }}>
          {/* Left Column: Official Authentication Form */}
          <div style={{ padding: '36px 32px' }}>
            {/* Mode Switcher */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-panel, #EDE7DA)',
              borderRadius: '6px',
              padding: '4px',
              marginBottom: '24px',
              border: '1px solid rgba(28, 43, 48, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: authMode === 'login' ? '#E3A63E' : 'transparent',
                  color: authMode === 'login' ? '#1C2B30' : '#6B7B80',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 6px rgba(227, 166, 62, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Official Sign-In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: authMode === 'register' ? '#E3A63E' : 'transparent',
                  color: authMode === 'register' ? '#1C2B30' : '#6B7B80',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(227, 166, 62, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Register Official ID
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#1C2B30', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
                {authMode === 'login' ? 'Authorized Railway Sign-In' : 'Register New Official Account'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#6B7B80', margin: 0, lineHeight: 1.45 }}>
                Enter your Central Railway HRMS/PF identification number to access decision support consoles and block planning warrants.
              </p>
            </div>

            {authError && (
              <div style={{
                background: 'rgba(193, 68, 60, 0.12)',
                border: '1px solid rgba(193, 68, 60, 0.4)',
                color: '#9C2A24',
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#C1443C" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div style={{
                background: 'rgba(79, 157, 105, 0.14)',
                border: '1px solid rgba(79, 157, 105, 0.4)',
                color: '#226437',
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#4F9D69" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#1C2B30', fontSize: '0.8rem', fontWeight: '700' }}>Official Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ background: '#FFFFFF', border: '1px solid rgba(28, 43, 48, 0.22)', color: '#1C2B30' }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Er. Rajesh K. Deshmukh"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ color: '#1C2B30', fontSize: '0.8rem', fontWeight: '700' }}>
                  Employee PF / HRMS ID Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input mono-text" 
                    style={{ background: '#FFFFFF', border: '1px solid rgba(28, 43, 48, 0.22)', color: '#8C5800', fontWeight: '800' }}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. CR/MUM/88421"
                    required
                  />
                  <Shield size={16} style={{ position: 'absolute', right: '12px', top: '10px', color: '#6B7B80' }} />
                </div>
              </div>

              {/* Department / Role Selector */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#1C2B30', fontSize: '0.8rem', fontWeight: '700' }}>Designation & Discipline</label>
                <select 
                  className="form-select"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(28, 43, 48, 0.22)', color: '#1C2B30', fontSize: '0.82rem' }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="Section Controller (Operating / COA)">🚆 Section Controller (Operating / COA)</option>
                  <option value="Sr. Divisional Engineer (Civil / P-Way)">🛠️ Sr. Divisional Engineer (Civil / P-Way)</option>
                  <option value="Sr. Divisional Electrical Engineer (TRD / OHE)">⚡ Sr. Div. Electrical Engineer (TRD / OHE)</option>
                  <option value="Sr. Divisional Signal Engineer (S&T)">🚦 Sr. Div. Signal Engineer (S&T)</option>
                  <option value="Chief Train Controller (CTNL / CSMT)">📋 Chief Train Controller (CTNL / CSMT)</option>
                </select>
              </div>

              {/* Division Selector */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#1C2B30', fontSize: '0.8rem', fontWeight: '700' }}>Operating Division</label>
                <select 
                  className="form-select"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(28, 43, 48, 0.22)', color: '#1C2B30', fontSize: '0.82rem' }}
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  <option value="Mumbai Division (CSMT)">Mumbai Division (CSMT - Kalyan - Igatpuri - Lonavala)</option>
                  <option value="Pune Division (PUNE)">Pune Division (Pune - Daund - Miraj - Kolhapur)</option>
                  <option value="Bhusawal Division (BSL)">Bhusawal Division (Manmad - Bhusawal - Akola - Badnera)</option>
                  <option value="Nagpur Division (NGP)">Nagpur Division (Wardha - Nagpur)</option>
                  <option value="Solapur Division (SUR)">Solapur Division (Kurduvadi - Solapur)</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#1C2B30', fontSize: '0.8rem', fontWeight: '700' }}>Password / Security Key</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-input" 
                    style={{ background: '#FFFFFF', border: '1px solid rgba(28, 43, 48, 0.22)', color: '#1C2B30' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '8px', background: 'transparent', border: 'none', color: '#6B7B80', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authenticating}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: '#E3A63E',
                  color: '#1C2B30',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(227, 166, 62, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {authenticating ? (
                  <span>Authenticating with Central Railway Auth...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Authenticate & Enter Control Room' : 'Register Official Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: 1-Click Demo Profiles & Railway Board Compliance Badge */}
          <div style={{
            background: 'var(--bg-panel, #EDE7DA)',
            borderLeft: '1px solid rgba(28, 43, 48, 0.12)',
            padding: '36px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800', color: '#8C5800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                <Sparkles size={15} color="#E3A63E" />
                <span>1-Click Demo Official Access</span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#6B7B80', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                Select any active Central Railway profile below to evaluate role-tailored decision support:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {demoProfiles.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLogin(p)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(28, 43, 48, 0.14)',
                      borderRadius: '6px',
                      padding: '11px 13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(28, 43, 48, 0.04)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#E3A63E';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(227, 166, 62, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(28, 43, 48, 0.14)';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(28, 43, 48, 0.04)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#1C2B30' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7B80', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ color: p.badgeColor, fontWeight: '700' }}>{p.dept}</span>
                        <span>•</span>
                        <span className="mono-text" style={{ fontWeight: '600' }}>{p.pf}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} color={p.badgeColor} />
                  </button>
                ))}
              </div>
            </div>

            {/* Railway Security Protocol Footer */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(79, 157, 105, 0.4)',
              borderRadius: '6px',
              padding: '12px 14px',
              boxShadow: '0 1px 4px rgba(28, 43, 48, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: '800', color: '#226437' }}>
                <ShieldCheck size={15} color="#4F9D69" />
                <span>Central Railway CRIS Encrypted Interlock</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#6B7B80', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                Multi-factor role-based access for P-Way possession granting, T/409 Caution generation, and 25kV power block synchronization.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '14px 36px',
        borderTop: '1px solid rgba(28, 43, 48, 0.12)',
        background: 'var(--bg-panel-deep, #E2DACB)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.76rem',
        color: '#6B7B80'
      }}>
        <div style={{ fontWeight: '600' }}>
          ARC (Adaptive Railway Coordination) • Central Railway Zone (Maharashtra) Pilot
        </div>
        <div className="mono-text" style={{ fontWeight: '600' }}>
          Mumbai CSMT • Pune • Bhusawal • Nagpur • Solapur
        </div>
      </footer>
    </div>
  );
}
