/**
 * Rail Sentinel - Condition Document Upload & Storage Utility (v4)
 * Handles dynamic issue-type document slot mapping, local storage persistence,
 * and retrieval for track segments and maintenance calendar events.
 */

// Issue-type specific upload slot matrix (design_spec_v4.md Section 2)
export const ISSUE_TYPE_DOCUMENT_SLOTS = {
  'Rail fracture': [
    { id: 'usfd_report', name: 'USFD / ultrasonic flaw report', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ],
  'Rail weld failure (AT/flash-butt)': [
    { id: 'weld_inspection_report', name: 'Weld inspection report', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ],
  'Track geometry defect (twist/gauge)': [
    { id: 'trc_report', name: 'Track Recording Car (TRC) report', multiple: false, required: true }
  ],
  'Ballast deficiency / packing': [
    { id: 'site_survey_note', name: 'Site survey note', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ],
  'OHE (overhead equipment) snag': [
    { id: 'ohe_inspection_report', name: 'Electrical/OHE inspection report', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ],
  'Points & crossing wear': [
    { id: 'pc_inspection_report', name: 'P&C inspection report', multiple: false, required: true }
  ],
  'Rail corrugation': [
    { id: 'grinding_report', name: 'Rail profile / grinding assessment report', multiple: false, required: true }
  ],
  'Vegetation / embankment clearance': [
    { id: 'site_photo', name: 'Site photo', multiple: true, required: true }
  ],
  'Bridge / culvert inspection': [
    { id: 'structural_report', name: 'Structural inspection report', multiple: false, required: true }
  ],
  'Signal-track interface fault': [
    { id: 'st_inspection_report', name: 'S&T inspection report', multiple: false, required: true }
  ],
  'Ultrasonic flaw detection (routine)': [
    { id: 'usfd_report', name: 'USFD report', multiple: false, required: true }
  ],
  'Ballast fouling / drainage issue (monsoon)': [
    { id: 'site_survey_note', name: 'Site survey note', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ]
};

// Catch-all slot shown for every issue type
export const CATCH_ALL_SLOT = {
  id: 'additional_docs',
  name: 'Additional supporting documents',
  multiple: true,
  required: false,
  description: 'Optional prior correspondence, requisition memos, handover sheets'
};

/**
 * Returns document slots required/recommended for a given issue type,
 * plus the catch-all slot.
 */
export function getSlotsForIssueType(issueType) {
  if (!issueType) return [];
  const specificSlots = ISSUE_TYPE_DOCUMENT_SLOTS[issueType] || [
    { id: 'condition_report', name: 'Condition inspection report', multiple: false, required: true },
    { id: 'photo_evidence', name: 'Photo evidence', multiple: true, required: true }
  ];
  return [...specificSlots, CATCH_ALL_SLOT];
}

// Storage Keys
const STORAGE_DOCS_KEY = 'rail_sentinel_condition_docs_v4';
const STORAGE_BLOCKS_KEY = 'rail_sentinel_custom_blocks_v4';

// Sample SVG placeholder icons/data for seeded seed documents
const SAMPLE_DEFECT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231C2B30"/><rect x="50" y="170" width="500" height="60" fill="%234F5D65" rx="4"/><path d="M 280 170 L 305 200 L 290 230" stroke="%23E3A63E" stroke-width="6" fill="none"/><circle cx="295" cy="200" r="16" stroke="%23C1443C" stroke-width="3" fill="none"/><text x="300" y="320" font-family="monospace" font-size="16" fill="%23EDE7DA" text-anchor="middle">CENTRAL RAILWAY USFD SCAN - MACRO FISSURE LOCATED</text><text x="300" y="345" font-family="monospace" font-size="12" fill="%239FB1B6" text-anchor="middle">CHAINAGE KM 12.4 • DEFECT AMPLITUDE 78dB • REQ EMERGENCY CLAMP</text></svg>';
const SAMPLE_PHOTO_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2324343B"/><rect x="100" y="240" width="400" height="30" fill="%2356676E"/><path d="M 290 240 L 310 270" stroke="%23C1443C" stroke-width="4"/><text x="300" y="100" font-family="sans-serif" font-weight="bold" font-size="20" fill="%23EDE7DA" text-anchor="middle">TRACK CONDITION FIELD PHOTO</text><text x="300" y="130" font-family="sans-serif" font-size="13" fill="%23E3A63E" text-anchor="middle">Transverse crack along rail head surface</text><text x="300" y="350" font-family="monospace" font-size="12" fill="%239FB1B6" text-anchor="middle">Captured: Central Railway P-Way Gang 4 • Inspection Camera</text></svg>';
const SAMPLE_TRC_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%2319252A"/><path d="M 50 180 Q 150 100, 250 200 T 450 160 T 550 240" stroke="%234F9D69" stroke-width="3" fill="none"/><path d="M 50 220 Q 150 260, 250 180 T 450 240 T 550 190" stroke="%23E3A63E" stroke-width="3" fill="none"/><line x1="50" y1="200" x2="550" y2="200" stroke="%233A4C53" stroke-width="1" stroke-dasharray="4"/><text x="300" y="60" font-family="sans-serif" font-weight="bold" font-size="18" fill="%23EDE7DA" text-anchor="middle">TRACK RECORDING CAR (TRC) OSCILLOGRAPH</text><text x="300" y="85" font-family="sans-serif" font-size="12" fill="%23E3A63E" text-anchor="middle">Twist & Gauge Variance: Alert Threshold Exceeded at KM 84.2</text><text x="300" y="360" font-family="monospace" font-size="12" fill="%239FB1B6" text-anchor="middle">RDSO TRC Car 7904 • Run Speed 95 km/h • Central Railway</text></svg>';

// Default seed documents for realistic initial state
const SEED_DOCUMENTS = [
  {
    id: 'doc_seed_01',
    filename: 'USFD_Flaw_Report_KM12_4.pdf',
    file_type: 'pdf',
    doc_type: 'USFD / ultrasonic flaw report',
    issue_type: 'Rail fracture',
    track_id: 'T001',
    event_id: 'M0061',
    size_bytes: 1420500,
    size_formatted: '1.4 MB',
    timestamp: '2026-08-01T08:30:00Z',
    data_url: SAMPLE_DEFECT_IMG,
    notes: 'Ultrasonic flaw detected at rail gauge corner, probe frequency 4MHz.'
  },
  {
    id: 'doc_seed_02',
    filename: 'Field_Photo_Transverse_Fissure.jpg',
    file_type: 'image',
    doc_type: 'Photo evidence',
    issue_type: 'Rail fracture',
    track_id: 'T001',
    event_id: 'M0061',
    size_bytes: 2310000,
    size_formatted: '2.2 MB',
    timestamp: '2026-08-01T08:45:00Z',
    data_url: SAMPLE_PHOTO_IMG,
    notes: 'Site photo taken by Assistant Divisional Engineer (P-Way).'
  },
  {
    id: 'doc_seed_03',
    filename: 'Emergency_Speed_Restriction_Memo.pdf',
    file_type: 'pdf',
    doc_type: 'Additional supporting documents',
    issue_type: 'Rail fracture',
    track_id: 'T001',
    event_id: 'M0061',
    size_bytes: 412000,
    size_formatted: '412 KB',
    timestamp: '2026-08-01T09:15:00Z',
    data_url: SAMPLE_DEFECT_IMG,
    notes: 'Imposition of 30 km/h caution order prior to maintenance block possession.'
  },
  {
    id: 'doc_seed_04',
    filename: 'TRC_Run_KJT_LNL_Twist_Assessment.pdf',
    file_type: 'pdf',
    doc_type: 'Track Recording Car (TRC) report',
    issue_type: 'Track geometry defect (twist/gauge)',
    track_id: 'T003',
    event_id: 'M0012',
    size_bytes: 3145000,
    size_formatted: '3.0 MB',
    timestamp: '2026-08-03T11:20:00Z',
    data_url: SAMPLE_TRC_IMG,
    notes: 'TRC analysis showing cumulative 4.8mm gauge widening.'
  },
  {
    id: 'doc_seed_05',
    filename: 'OHE_Inspection_Dropper_Sag.pdf',
    file_type: 'pdf',
    doc_type: 'Electrical/OHE inspection report',
    issue_type: 'OHE (overhead equipment) snag',
    track_id: 'T004',
    event_id: 'M0088',
    size_bytes: 980000,
    size_formatted: '980 KB',
    timestamp: '2026-08-04T14:10:00Z',
    data_url: SAMPLE_PHOTO_IMG,
    notes: 'Tower Wagon inspection log, cantilever insulator flashover observed.'
  }
];

/**
 * Loads stored documents from localStorage, initializing with seed if empty.
 */
export function getAllDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(SEED_DOCUMENTS));
      return SEED_DOCUMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading from localStorage, using memory seed:', e);
    return SEED_DOCUMENTS;
  }
}

/**
 * Loads custom user-created maintenance blocks from localStorage.
 */
export function getCustomBlocks() {
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Retrieves all documents for a specific track segment ID.
 */
export function getDocumentsForTrack(trackId) {
  if (!trackId) return [];
  const docs = getAllDocuments();
  return docs.filter(d => d.track_id === trackId);
}

/**
 * Retrieves all documents for a specific maintenance event ID.
 */
export function getDocumentsForEvent(eventId) {
  if (!eventId) return [];
  const docs = getAllDocuments();
  return docs.filter(d => d.event_id === eventId);
}

/**
 * Quick check if an event has attached documents.
 */
export function hasDocumentsForEvent(eventId) {
  if (!eventId) return false;
  const docs = getAllDocuments();
  return docs.some(d => d.event_id === eventId);
}

/**
 * Quick check if a track segment has any attached documents.
 */
export function hasDocumentsForTrack(trackId) {
  if (!trackId) return false;
  const docs = getAllDocuments();
  return docs.some(d => d.track_id === trackId);
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB).
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Helper to determine file icon type.
 */
export function getFileTypeCategory(filename = '', mimeType = '') {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  return 'document';
}

/**
 * Saves a new maintenance block along with all its uploaded files.
 */
export function createMaintenanceBlockWithDocs(blockData, filesList = []) {
  const allDocs = getAllDocuments();
  const allBlocks = getCustomBlocks();

  // Create unique Event ID if not present
  const eventId = blockData.event_id || `M_CR_${Date.now().toString().slice(-5)}`;
  const timestamp = new Date().toISOString();

  // Prepare block record
  const newBlock = {
    ...blockData,
    event_id: eventId,
    status: blockData.status || 'Planned',
    created_at: timestamp
  };

  // Prepare document records
  const newDocRecords = filesList.map((f, idx) => ({
    id: `doc_${Date.now()}_${idx}`,
    filename: f.filename || f.name,
    file_type: f.file_type || getFileTypeCategory(f.filename || f.name, f.type),
    doc_type: f.doc_type,
    issue_type: blockData.issue_type,
    track_id: blockData.track_id,
    event_id: eventId,
    size_bytes: f.size_bytes || f.size || 0,
    size_formatted: f.size_formatted || formatFileSize(f.size_bytes || f.size || 0),
    timestamp: timestamp,
    data_url: f.data_url || SAMPLE_DEFECT_IMG,
    notes: f.notes || ''
  }));

  const updatedDocs = [...newDocRecords, ...allDocs];
  const updatedBlocks = [newBlock, ...allBlocks];

  try {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(updatedDocs));
    localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(updatedBlocks));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  // Dispatch custom event for real-time reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change', {
      detail: { event_id: eventId, track_id: blockData.track_id, docsCount: newDocRecords.length }
    }));
  }

  return { block: newBlock, documents: newDocRecords };
}

/**
 * Removes an uploaded document by ID.
 */
export function deleteDocument(docId) {
  const allDocs = getAllDocuments();
  const updated = allDocs.filter(d => d.id !== docId);
  try {
    localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rail_sentinel_doc_change', {
      detail: { deleted_doc_id: docId }
    }));
  }
  return updated;
}
