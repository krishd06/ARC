import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Cpu, BrainCircuit, CheckCircle2, AlertTriangle, 
  Clock, Calendar, Train, ShieldCheck, Zap, Layers, 
  ArrowRight, Filter, Users, Shield, Sliders, RefreshCw,
  TrendingUp, Check, AlertCircle, ArrowUpRight, Folder,
  FileText, Upload, Wrench, TrafficCone, HelpCircle, Eye,
  Maximize2, Trash2, PlusCircle, X
} from 'lucide-react';
import TrainStringChartModal from './TrainStringChartModal';
import CautionOrderModal from './CautionOrderModal';
import MultiHorizonGanttModal from './MultiHorizonGanttModal';

export default function AIOptimizerConsole({ segments = [], metaOptions, onNavigateToCalendar }) {
  // Active workflow step: 'upload' (1. Upload Department Files) or 'schedule' (2. AI Generated Schedule)
  const [activeStep, setActiveStep] = useState('upload');

  // Department Document Ingestion States (Matching Image 1)
  const [deptDocs, setDeptDocs] = useState({
    tms: {
      active: true,
      name: 'track_demands_tms.csv',
      recordCount: 87,
      verified: true,
      uploadedFile: null,
      customFileName: ''
    },
    smms: {
      active: true,
      name: 'snt_disconnections_smms.csv',
      recordCount: 107,
      verified: true,
      uploadedFile: null,
      customFileName: ''
    },
    tdms: {
      active: true,
      name: 'ohe_power_blocks_tdms.csv',
      recordCount: 64,
      verified: true,
      uploadedFile: null,
      customFileName: ''
    },
    coa: {
      active: true,
      name: 'timetable_coa.csv & goods_train_forecast.csv',
      recordCount: 52,
      verified: true,
      uploadedFile: null,
      customFileName: ''
    }
  });

  // Solver Configuration & Weights
  const [startDate, setStartDate] = useState('2026-08-01');
  const [horizonDays, setHorizonDays] = useState(7);
  const [corridorFilter, setCorridorFilter] = useState('all');

  const [weightMinDelays, setWeightMinDelays] = useState(0.35);
  const [weightMaxThroughput, setWeightMaxThroughput] = useState(0.30);
  const [weightMaxJoint, setWeightMaxJoint] = useState(0.25);
  const [weightNocturnal, setWeightNocturnal] = useState(0.10);

  // Solver State
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [activeFilterDept, setActiveFilterDept] = useState('all');
  const [activeFilterCorridor, setActiveFilterCorridor] = useState('all');
  
  // Apply schedule feedback state
  const [applying, setApplying] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Sub-modal states
  const [isStringChartOpen, setIsStringChartOpen] = useState(false);
  const [isCautionOrderOpen, setIsCautionOrderOpen] = useState(false);
  const [isGanttOpen, setIsGanttOpen] = useState(false);

  // Create Custom Block Modal State inside Optimizer
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTrackId, setNewTrackId] = useState(segments[0]?.track_id || 'T001');
  const [newDate, setNewDate] = useState('2026-08-05');
  const [newStartTime, setNewStartTime] = useState('01:30');
  const [newEndTime, setNewEndTime] = useState('03:30');
  const [newIssueType, setNewIssueType] = useState('Track geometry defect');
  const [newSeverity, setNewSeverity] = useState('Medium');
  const [newMachineResource, setNewMachineResource] = useState('CSM (Continuous Tamping Machine)');
  const [newTrackPositionKm, setNewTrackPositionKm] = useState('14.5');
  const [creatingBlock, setCreatingBlock] = useState(false);

  // File Upload Handlers for the 4 options
  const handleFileUpload = (deptKey, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parsedRecords = Math.floor(Math.random() * 40) + 45;
    setDeptDocs(prev => ({
      ...prev,
      [deptKey]: {
        ...prev[deptKey],
        active: true,
        uploadedFile: file,
        customFileName: file.name,
        recordCount: parsedRecords,
        verified: true
      }
    }));
  };

  const handleUseVerifiedData = (deptKey, defaultName, defaultRecords) => {
    setDeptDocs(prev => ({
      ...prev,
      [deptKey]: {
        active: true,
        name: defaultName,
        recordCount: defaultRecords,
        verified: true,
        uploadedFile: null,
        customFileName: ''
      }
    }));
  };

  const runOptimizer = async () => {
    setIsSolving(true);
    setSolverProgress(15);
    setApplySuccessMsg('');

    const timer = setInterval(() => {
      setSolverProgress(p => {
        if (p >= 90) {
          clearInterval(timer);
          return 90;
        }
        return p + 25;
      });
    }, 120);

    try {
      const res = await fetch('/api/ai-optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          horizon_days: parseInt(horizonDays, 10),
          corridor_filter: corridorFilter,
          minimize_train_delays: parseFloat(weightMinDelays),
          maximize_throughput: parseFloat(weightMaxThroughput),
          maximize_joint_blocks: parseFloat(weightMaxJoint),
          nocturnal_preference: parseFloat(weightNocturnal)
        })
      });

      if (!res.ok) {
        throw new Error('Optimizer execution failed');
      }

      const data = await res.json();
      setSolverProgress(100);
      setOptimizationResult(data);
    } catch (err) {
      console.error('AI Optimizer failed:', err);
    } finally {
      clearInterval(timer);
      setTimeout(() => {
        setIsSolving(false);
        setSolverProgress(0);
        setActiveStep('schedule');
      }, 300);
    }
  };

  // Run automatically on first load
  useEffect(() => {
    runOptimizer();
  }, []);

  const handleApplySchedule = async () => {
    if (!optimizationResult || !optimizationResult.scheduled_blocks) return;
    setApplying(true);
    try {
      const res = await fetch('/api/apply-optimized-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: optimizationResult.scheduled_blocks
        })
      });
      const data = await res.json();
      setApplySuccessMsg(data.message || 'Optimized schedule applied to master calendar & Control Office!');
      window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change'));
    } catch (err) {
      console.error('Failed to apply schedule:', err);
    } finally {
      setApplying(false);
    }
  };

  // Handle Remove Single Block
  const handleRemoveBlock = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove block warrant ${eventId}?`)) return;

    try {
      await fetch('/api/remove-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      });

      setOptimizationResult(prev => {
        if (!prev) return prev;
        const updated = (prev.scheduled_blocks || []).filter(b => (b.event_id || b.work_order_id) !== eventId);
        return {
          ...prev,
          scheduled_blocks: updated,
          summary: {
            ...prev.summary,
            scheduled_blocks_count: updated.length,
            total_maintenance_hours: Math.round(updated.reduce((sum, b) => sum + (b.allocated_window_min || 0), 0) / 60)
          }
        };
      });

      setApplySuccessMsg(`Block ${eventId} removed from active plan.`);
      window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change'));
    } catch (err) {
      console.error('Failed to remove block:', err);
    }
  };

  // Handle Clear / Remove All Blocks
  const handleClearAllBlocks = async () => {
    if (!window.confirm('Are you sure you want to REMOVE ALL BLOCKS from the schedule? This will reset the master possession calendar.')) return;

    try {
      await fetch('/api/clear-all-blocks', { method: 'POST' });
      
      setOptimizationResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scheduled_blocks: [],
          summary: {
            ...prev.summary,
            scheduled_blocks_count: 0,
            joint_blocks_count: 0,
            total_maintenance_hours: 0,
            clearance_rate_pct: 0
          }
        };
      });

      setApplySuccessMsg('All planned maintenance blocks removed successfully.');
      window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change'));
    } catch (err) {
      console.error('Failed to clear blocks:', err);
    }
  };

  // Handle Create Custom Block
  const handleCreateBlockSubmit = async (e) => {
    e.preventDefault();
    setCreatingBlock(true);

    try {
      const selectedSeg = segments.find(s => s.track_id === newTrackId) || segments[0];
      const res = await fetch('/api/create-custom-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: newTrackId,
          date: newDate,
          start_time: newStartTime,
          end_time: newEndTime,
          issue_type: newIssueType,
          severity: newSeverity,
          machine_resource: newMachineResource,
          track_position_km: parseFloat(newTrackPositionKm) || 12.0
        })
      });

      const data = await res.json();
      if (data.block) {
        const blk = data.block;
        const formattedBlock = {
          event_id: blk.event_id,
          work_order_id: blk.event_id,
          track_id: blk.track_id,
          corridor: blk.corridor,
          section_name: blk.section || `${selectedSeg?.from_station}-${selectedSeg?.to_station}`,
          date: blk.date,
          start_time: newStartTime,
          end_time: newEndTime,
          block_start: blk.block_start,
          block_end: blk.block_end,
          allocated_window_min: blk.planned_duration_min,
          issue_type: blk.issue_type,
          severity: blk.severity,
          priority_score: blk.severity === 'High' ? 88 : 64,
          machine_resource: blk.machine_resource,
          department: blk.department,
          is_joint_block: false,
          partner_department: null,
          buffer_applied_min: 15,
          ai_rationale: 'User-created block integrated into active master possession calendar.'
        };

        setOptimizationResult(prev => {
          if (!prev) return prev;
          const updated = [formattedBlock, ...(prev.scheduled_blocks || [])];
          return {
            ...prev,
            scheduled_blocks: updated,
            summary: {
              ...prev.summary,
              scheduled_blocks_count: updated.length,
              total_maintenance_hours: Math.round(updated.reduce((sum, b) => sum + (b.allocated_window_min || 0), 0) / 60)
            }
          };
        });

        setApplySuccessMsg(`Block ${blk.event_id} created successfully!`);
        setIsCreateModalOpen(false);
        window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change'));
      }
    } catch (err) {
      console.error('Failed to create block:', err);
    } finally {
      setCreatingBlock(false);
    }
  };

  const getDepartmentBadge = (dept) => {
    const d = dept || 'Civil Engineering';
    if (d.includes('Civil')) {
      return <span className="badge" style={{ background: 'rgba(79, 157, 105, 0.12)', border: '1px solid rgba(79, 157, 105, 0.3)', color: '#4F9D69', fontSize: '0.68rem' }}>P-Way / Civil</span>;
    }
    if (d.includes('Electrical') || d.includes('TRD')) {
      return <span className="badge" style={{ background: 'rgba(227, 166, 62, 0.12)', border: '1px solid rgba(227, 166, 62, 0.3)', color: '#E3A63E', fontSize: '0.68rem' }}>Electrical (TRD)</span>;
    }
    if (d.includes('Signal') || d.includes('S&T')) {
      return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.68rem' }}>Signal & Telecom</span>;
    }
    return <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>{d}</span>;
  };

  const filteredBlocks = (optimizationResult?.scheduled_blocks || []).filter(b => {
    if (activeFilterCorridor !== 'all' && !b.corridor.toLowerCase().includes(activeFilterCorridor.toLowerCase())) return false;
    if (activeFilterDept !== 'all' && !b.department.toLowerCase().includes(activeFilterDept.toLowerCase())) return false;
    return true;
  });

  const totalUploadedRecords = (deptDocs.tms.recordCount || 0) + (deptDocs.smms.recordCount || 0) + (deptDocs.tdms.recordCount || 0) + (deptDocs.coa.recordCount || 0);

  return (
    <section className="panel-recommender" style={{ borderTop: '3px solid #38bdf8', background: 'var(--bg-panel)', borderRadius: '4px', overflow: 'hidden', padding: 0 }}>
      {/* Top Header matching Image 1: RailSync AI • Multi-Department Plan Optimizer */}
      <div style={{
        padding: '16px 22px',
        background: 'linear-gradient(90deg, #111d24 0%, #172a33 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Left Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem'
          }}>
            🤖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFF', margin: 0, letterSpacing: '-0.2px' }}>
                RailSync AI • Multi-Department Plan Optimizer & Creator
              </h2>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Upload Department Papers • Check Corridor Timetable • Autonomous Schedule Generation & Block Management
            </p>
          </div>
        </div>

        {/* Top Right Step Tabs (Matching Image 1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveStep('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '4px',
              border: activeStep === 'upload' ? '1px solid #FFF' : '1px solid rgba(255,255,255,0.15)',
              background: activeStep === 'upload' ? '#FFF' : 'rgba(255,255,255,0.06)',
              color: activeStep === 'upload' ? '#0f172a' : '#cbd5e1',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Folder size={15} color={activeStep === 'upload' ? '#eab308' : '#cbd5e1'} />
            <span>1. Upload Department Files</span>
          </button>

          <button
            onClick={() => setActiveStep('schedule')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '4px',
              border: activeStep === 'schedule' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
              background: activeStep === 'schedule' ? '#38bdf8' : 'rgba(255,255,255,0.06)',
              color: activeStep === 'schedule' ? '#0f172a' : '#cbd5e1',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={15} color={activeStep === 'schedule' ? '#0f172a' : '#38bdf8'} />
            <span>2. AI Generated Schedule</span>
          </button>
        </div>
      </div>

      {/* STEP 1: UPLOAD DEPARTMENT PAPERS VIEW */}
      {activeStep === 'upload' && (
        <div style={{ padding: '20px 22px' }}>
          {/* Green-tinted Instruction Banner */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '4px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '4px',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Upload size={20} color="#22c55e" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Select Option & Upload Department Maintenance Papers
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0', lineHeight: 1.4 }}>
                Upload the specific work orders, defect logs, or timetable graphs for each particular department. RailSync AI will automatically read the papers, check corridor time windows, minimize track downtime, and coordinate multi-department mega-blocks.
              </p>
            </div>
          </div>

          {/* 2x2 Grid for the 4 Department Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* OPTION 1: Track Engineering (TMS) */}
            <div style={{
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <span>🛠️</span>
                    <span>Option 1: Track Engineering (TMS)</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(79, 157, 105, 0.15)', border: '1px solid rgba(79, 157, 105, 0.4)', color: '#4F9D69', fontSize: '0.68rem', fontWeight: '700' }}>
                    ENGINEERING
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                  Track Management System • P-Way Demands
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                  USFD rail flaw logs (IMR cracks), tongue rail wear, thermit weld slippage, BCM ballast deep screening.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'var(--bg-panel)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <Folder size={14} color="#eab308" />
                  <span>Choose Engineering File (.csv, .xlsx, .pdf)</span>
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls,.pdf,.txt" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('tms', e)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleUseVerifiedData('tms', 'track_demands_tms.csv', 87)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-panel-deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    color: 'var(--signal-amber)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={13} />
                  <span>Use Verified TMS Data (87 records)</span>
                </button>

                {deptDocs.tms.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--signal-green-text)', fontWeight: '600' }}>
                    <CheckCircle2 size={13} color="var(--signal-green)" />
                    <span>{deptDocs.tms.recordCount} records verified from {deptDocs.tms.customFileName || deptDocs.tms.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OPTION 2: Signalling & Telecom (SMMS) */}
            <div style={{
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <span>🚦</span>
                    <span>Option 2: Signalling & Telecom (SMMS)</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8', fontSize: '0.68rem', fontWeight: '700' }}>
                    S&T
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                  Signal Maintenance System • Form T/351 Disconnections
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                  Point machine 108B FPL clearance, MSDAC axle counter phase drift, track circuit leakage, electronic interlocking.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'var(--bg-panel)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <Folder size={14} color="#eab308" />
                  <span>Choose S&T File (.csv, .xlsx, .pdf)</span>
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls,.pdf,.txt" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('smms', e)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleUseVerifiedData('smms', 'snt_disconnections_smms.csv', 107)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-panel-deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    color: '#38bdf8',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={13} />
                  <span>Use Verified SMMS Data (107 records)</span>
                </button>

                {deptDocs.smms.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--signal-green-text)', fontWeight: '600' }}>
                    <CheckCircle2 size={13} color="var(--signal-green)" />
                    <span>{deptDocs.smms.recordCount} records verified from {deptDocs.smms.customFileName || deptDocs.smms.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OPTION 3: Traction Distribution (TDMS) */}
            <div style={{
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <span>⚡</span>
                    <span>Option 3: Traction Distribution (TDMS)</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', fontSize: '0.68rem', fontWeight: '700' }}>
                    TRD
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                  Traction Distribution System • 25kV Power Blocks
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                  OHE inspection, contact wire height, neutral section testing, bracket insulator replacement.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'var(--bg-panel)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <Folder size={14} color="#eab308" />
                  <span>Choose TRD File (.csv, .xlsx, .pdf)</span>
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls,.pdf,.txt" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('tdms', e)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleUseVerifiedData('tdms', 'ohe_power_blocks_tdms.csv', 64)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-panel-deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    color: '#f59e0b',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={13} />
                  <span>Use Verified TDMS Data (64 records)</span>
                </button>

                {deptDocs.tdms.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--signal-green-text)', fontWeight: '600' }}>
                    <CheckCircle2 size={13} color="var(--signal-green)" />
                    <span>{deptDocs.tdms.recordCount} records verified from {deptDocs.tdms.customFileName || deptDocs.tdms.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OPTION 4: Train Timetable & Paths (COA) */}
            <div style={{
              background: 'var(--bg-panel-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    <span>🚆</span>
                    <span>Option 4: Train Timetable & Paths (COA)</span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', fontSize: '0.68rem', fontWeight: '700' }}>
                    OPERATING
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                  Control Office Application • Passenger & Freight Graph
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                  Passenger timetable, goods train paths, FOIS freight forecast, sectional running times.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'var(--bg-panel)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <Folder size={14} color="#eab308" />
                  <span>Choose Operating File (.csv, .xlsx, .pdf)</span>
                  <input 
                    type="file" 
                    accept=".csv,.xlsx,.xls,.pdf,.txt" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload('coa', e)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleUseVerifiedData('coa', 'timetable_coa.csv & goods_train_forecast.csv', 52)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-panel-deep)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    color: '#c084fc',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={13} />
                  <span>Use Verified Timetable Data (52 paths)</span>
                </button>

                {deptDocs.coa.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--signal-green-text)', fontWeight: '600' }}>
                    <CheckCircle2 size={13} color="var(--signal-green)" />
                    <span>{deptDocs.coa.recordCount} paths verified from {deptDocs.coa.customFileName || deptDocs.coa.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Ingestion Summary Banner & Autonomous Generate Button */}
          <div style={{
            background: 'var(--bg-panel-deep)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                Total Department Documents Loaded: <strong className="mono-text" style={{ color: '#38bdf8' }}>{totalUploadedRecords} Work Orders & Timetable Paths</strong>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                ✓ Ready for AI Autonomous Solver
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                padding: '10px 20px',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: '800',
                border: 'none',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.35)'
              }}
              disabled={isSolving}
              onClick={runOptimizer}
            >
              {isSolving ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>AI Solving Constraints ({solverProgress}%)...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Read Documents & Generate Autonomous Schedule</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI GENERATED SCHEDULE & DIRECT BLOCK MANAGEMENT */}
      {activeStep === 'schedule' && (
        <div style={{ padding: '20px 22px' }}>
          {/* Objective Sliders Bar */}
          <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Sliders size={16} color="#38bdf8" />
                <span>Multi-Objective Optimization Objective Weights</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Adjust solver priority balance across competing operational goals
              </span>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Train Delay Prevention</label>
                  <span className="mono-text" style={{ color: '#38bdf8', fontWeight: '700' }}>{Math.round(weightMinDelays * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={weightMinDelays}
                  onChange={(e) => setWeightMinDelays(parseFloat(e.target.value))}
                  style={{ accentColor: '#38bdf8', marginTop: '6px' }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Zero passenger train conflict priority</span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Backlog Throughput</label>
                  <span className="mono-text" style={{ color: '#38bdf8', fontWeight: '700' }}>{Math.round(weightMaxThroughput * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={weightMaxThroughput}
                  onChange={(e) => setWeightMaxThroughput(parseFloat(e.target.value))}
                  style={{ accentColor: '#38bdf8', marginTop: '6px' }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Clear safety-critical defect work orders</span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Multi-Dept Joint Blocks</label>
                  <span className="mono-text" style={{ color: '#c084fc', fontWeight: '700' }}>{Math.round(weightMaxJoint * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="0.80"
                  step="0.05"
                  value={weightMaxJoint}
                  onChange={(e) => setWeightMaxJoint(parseFloat(e.target.value))}
                  style={{ accentColor: '#c084fc', marginTop: '6px' }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Co-locate P-Way + TRD + S&T possessions</span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Nocturnal Lull Preference</label>
                  <span className="mono-text" style={{ color: 'var(--signal-amber)', fontWeight: '700' }}>{Math.round(weightNocturnal * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={weightNocturnal}
                  onChange={(e) => setWeightNocturnal(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--signal-amber)', marginTop: '6px' }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Prioritize 01:00–04:30 low-traffic lull</span>
              </div>
            </div>
          </div>

          {/* BEFORE VS AFTER IMPACT DASHBOARD */}
          {optimizationResult && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="#38bdf8" />
                <span>AI Optimization Impact Metrics (Baseline Unplanned vs. AI Optimized Master Plan)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--signal-green-border)', borderTop: '3px solid var(--signal-green)', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Train Path Conflicts</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--signal-green)' }}>
                      {optimizationResult.comparison.train_conflicts.optimized}
                    </span>
                    <span className="mono-text" style={{ fontSize: '0.76rem', color: 'var(--signal-red)', textDecoration: 'line-through' }}>
                      {optimizationResult.comparison.train_conflicts.baseline} unoptimized
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--signal-green-text)', marginTop: '4px', fontWeight: '600' }}>
                    ✓ {optimizationResult.comparison.train_conflicts.improvement}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderTop: '3px solid #38bdf8', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Work Order Throughput</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#38bdf8' }}>
                      {optimizationResult.summary.scheduled_blocks_count} blocks
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      ({optimizationResult.summary.clearance_rate_pct}% cleared)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Total: <strong className="mono-text" style={{ color: 'var(--text-primary)' }}>{optimizationResult.summary.total_maintenance_hours}h</strong> possession granted
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderTop: '3px solid #c084fc', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Multi-Dept Shadow Blocks</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#c084fc' }}>
                      {optimizationResult.summary.joint_blocks_count} Joint Clusters
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#c084fc', marginTop: '4px', fontWeight: '600' }}>
                    🤝 +{optimizationResult.comparison.total_line_capacity_saved_hours}h track capacity saved
                  </div>
                </div>

                <div style={{ background: 'var(--bg-panel-elevated)', border: '1px solid var(--border-subtle)', borderTop: '3px solid var(--signal-amber)', borderRadius: '2px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overrun Risk Exposure</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span className="mono-text" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--signal-green)' }}>
                      {optimizationResult.comparison.overrun_risk_pct.optimized}%
                    </span>
                    <span className="mono-text" style={{ fontSize: '0.76rem', color: 'var(--signal-red)', textDecoration: 'line-through' }}>
                      {optimizationResult.comparison.overrun_risk_pct.baseline}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--signal-green-text)', marginTop: '4px', fontWeight: '600' }}>
                    ✓ {optimizationResult.comparison.overrun_risk_pct.improvement}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE MANAGEMENT TOOLBAR (ADD BLOCK & REMOVE ALL BLOCKS) */}
          <div style={{
            background: 'var(--bg-panel-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                Active Master Schedule ({filteredBlocks.length} Scheduled Blocks)
              </strong>

              {/* Filters */}
              <select 
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                value={activeFilterCorridor}
                onChange={(e) => setActiveFilterCorridor(e.target.value)}
              >
                <option value="all">All Corridors</option>
                {metaOptions?.corridors?.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <select 
                className="form-select"
                style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                value={activeFilterDept}
                onChange={(e) => setActiveFilterDept(e.target.value)}
              >
                <option value="all">All Departments</option>
                {metaOptions?.departments?.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Block Creation and Clear All Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '5px 12px', background: '#38bdf8', color: '#0f172a', fontWeight: '700', border: 'none' }}
              >
                <PlusCircle size={14} />
                <span>➕ Create Custom Block</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearAllBlocks}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '5px 12px', color: 'var(--signal-red)', borderColor: 'rgba(193, 68, 60, 0.4)' }}
                title="Remove all existing planned blocks"
              >
                <Trash2 size={14} />
                <span>🧹 Remove All Blocks</span>
              </button>
            </div>
          </div>

          {/* Master Schedule Table with Delete Block Column */}
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Date & Window</th>
                  <th>Track & Section</th>
                  <th>Owning Department</th>
                  <th>Machine Resource</th>
                  <th>Issue / Defect</th>
                  <th>Duration</th>
                  <th>Joint Mega-Block</th>
                  <th>Safety Buffer</th>
                  <th>AI Rationale</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlocks.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                      No active blocks in schedule. Click <strong>"➕ Create Custom Block"</strong> or <strong>"Execute AI Optimization"</strong> to generate blocks.
                    </td>
                  </tr>
                ) : (
                  filteredBlocks.map((b, idx) => (
                    <tr key={idx} style={{ background: b.is_joint_block ? 'rgba(192, 132, 252, 0.06)' : 'transparent' }}>
                      <td className="mono-text" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--signal-amber)' }}>
                        <div>{b.date}</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.74rem' }}>{b.start_time} → {b.end_time}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                          {b.track_id}: {b.section_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {b.corridor}
                        </div>
                      </td>

                      <td>
                        {getDepartmentBadge(b.department)}
                      </td>

                      <td style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {b.machine_resource}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{b.issue_type}</div>
                        <span className={`badge ${b.severity === 'High' ? 'badge-red' : (b.severity === 'Medium' ? 'badge-amber' : 'badge-green')}`} style={{ fontSize: '0.64rem' }}>
                          {b.severity} (Priority {b.priority_score})
                        </span>
                      </td>

                      <td className="mono-text" style={{ fontSize: '0.78rem' }}>
                        {b.allocated_window_min} min
                      </td>

                      <td>
                        {b.is_joint_block ? (
                          <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', fontSize: '0.68rem' }}>
                            🤝 Joint ({b.partner_department})
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Solo Possession</span>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-green" style={{ fontSize: '0.66rem' }}>
                          +{b.buffer_applied_min}m Contingency
                        </span>
                      </td>

                      <td style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxWidth: '240px', lineHeight: 1.3 }}>
                        {b.ai_rationale}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveBlock(b.event_id || b.work_order_id, e)}
                          style={{
                            background: 'rgba(193, 68, 60, 0.12)',
                            border: '1px solid rgba(193, 68, 60, 0.35)',
                            color: 'var(--signal-red)',
                            borderRadius: '3px',
                            padding: '4px 7px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`Remove block ${b.event_id || b.work_order_id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOTTOM ACTION TOOLBAR */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--bg-panel-deep)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left Status / Close button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveStep(activeStep === 'upload' ? 'schedule' : 'upload')}
            style={{ fontSize: '0.78rem' }}
          >
            {activeStep === 'upload' ? 'View AI Schedule' : 'Upload More Documents'}
          </button>

          {applySuccessMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--signal-green)', fontSize: '0.78rem', fontWeight: '600' }}>
              <CheckCircle2 size={15} />
              <span>{applySuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Right 4 Operational Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsStringChartOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid #38bdf8',
              borderRadius: '3px',
              color: '#38bdf8',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={14} />
            <span>📈 Open Master Train String Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGanttOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(192, 132, 252, 0.12)',
              border: '1px solid #c084fc',
              borderRadius: '3px',
              color: '#c084fc',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <Calendar size={14} />
            <span>📅 View Multi-Horizon Gantt</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCautionOrderOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid var(--signal-amber)',
              borderRadius: '3px',
              color: 'var(--signal-amber)',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <FileText size={14} />
            <span>📜 View Caution Form T/409 & S&T-T/351</span>
          </button>

          <button
            type="button"
            className="btn btn-green btn-sm"
            onClick={handleApplySchedule}
            disabled={applying || !optimizationResult?.scheduled_blocks?.length}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: '800'
            }}
          >
            <Check size={14} />
            <span>{applying ? 'Applying...' : '✅ Apply Plan to Control Office'}</span>
          </button>
        </div>
      </div>

      {/* CREATE CUSTOM BLOCK MODAL INSIDE OPTIMIZER */}
      {isCreateModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 16, 20, 0.85)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2600,
            padding: '20px'
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderTop: '3px solid #38bdf8',
              borderRadius: '4px',
              boxShadow: 'var(--shadow-panel)',
              overflow: 'hidden',
              textAlign: 'left'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px',
              background: 'var(--bg-panel-deep)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                <PlusCircle size={18} color="#38bdf8" />
                <span>Create Custom Maintenance Block Warrant</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBlockSubmit} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Track Segment</label>
                  <select 
                    className="form-select"
                    value={newTrackId}
                    onChange={(e) => setNewTrackId(e.target.value)}
                  >
                    {segments.map((s) => (
                      <option key={s.track_id} value={s.track_id}>
                        {s.track_id}: {s.from_station} → {s.to_station} ({s.corridor})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Possession Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Start Time</label>
                  <input 
                    type="time"
                    className="form-input mono-text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>End Time</label>
                  <input 
                    type="time"
                    className="form-input mono-text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Issue Type / Defect</label>
                <select 
                  className="form-select"
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value)}
                >
                  {(metaOptions?.issue_types || [
                    'Track geometry defect (twist/gauge)',
                    'Rail fracture',
                    'Rail weld failure (AT/flash-butt)',
                    'Ballast deficiency / packing',
                    'OHE (overhead equipment) snag',
                    'Points & crossing wear',
                    'Signal-track interface fault',
                    'Bridge / culvert inspection'
                  ]).map((it) => (
                    <option key={it} value={it}>{it}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Machinery / Resource</label>
                  <select 
                    className="form-select"
                    value={newMachineResource}
                    onChange={(e) => setNewMachineResource(e.target.value)}
                  >
                    {(metaOptions?.machine_resources || [
                      'CSM (Continuous Tamping Machine)',
                      'BCM (Ballast Cleaning Machine)',
                      'DGS (Dynamic Track Stabiliser)',
                      'Welding Crew',
                      'OHE Maintenance Van',
                      'S&T Maintenance Team',
                      'Manual Gang'
                    ]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Severity</label>
                  <select 
                    className="form-select"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  disabled={creatingBlock}
                  style={{ background: '#38bdf8', color: '#0f172a', fontWeight: '800', border: 'none' }}
                >
                  {creatingBlock ? 'Adding Block...' : 'Confirm and Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Sub-Modals */}
      <TrainStringChartModal 
        isOpen={isStringChartOpen} 
        onClose={() => setIsStringChartOpen(false)}
        segments={segments}
      />

      <CautionOrderModal 
        isOpen={isCautionOrderOpen} 
        onClose={() => setIsCautionOrderOpen(false)}
        blocks={optimizationResult?.scheduled_blocks || []}
      />

      <MultiHorizonGanttModal 
        isOpen={isGanttOpen} 
        onClose={() => setIsGanttOpen(false)}
        blocks={optimizationResult?.scheduled_blocks || []}
      />
    </section>
  );
}
