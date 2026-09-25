# Rail Sentinel — Feature Addition: Condition Document Upload (v4)

## 1. What this adds

When creating a new maintenance block (in the Block Recommender / block
creation flow), let the user attach supporting documents about the actual
condition of the problem — inspection reports, photos, survey notes — and
show *only the document types relevant to the issue type selected*, not one
generic "upload file" box.

This also surfaces later: any block's detail panel (from the map click-to-
inspect feature) should list its attached documents.

## 2. Document types, mapped by issue type

Each `issue_type` (matching the values already used in `maintenance_log.csv`)
has its own recommended document set. When the user picks an issue type in
the create-block form, show only the relevant upload slots below:

| issue_type | Required/recommended document types |
|---|---|
| Rail fracture | USFD / ultrasonic flaw report, Photo evidence |
| Rail weld failure (AT/flash-butt) | Weld inspection report, Photo evidence |
| Track geometry defect (twist/gauge) | Track Recording Car (TRC) report |
| Ballast deficiency / packing | Site survey note, Photo evidence |
| OHE (overhead equipment) snag | Electrical/OHE inspection report, Photo evidence |
| Points & crossing wear | P&C inspection report |
| Rail corrugation | Rail profile / grinding assessment report |
| Vegetation / embankment clearance | Site photo |
| Bridge / culvert inspection | Structural inspection report |
| Signal-track interface fault | S&T inspection report |
| Ultrasonic flaw detection (routine) | USFD report |
| Ballast fouling / drainage issue (monsoon) | Site survey note, Photo evidence |

Every issue type also gets one optional catch-all slot: **"Additional
supporting documents"** (for anything not covered above — e.g. a prior
correspondence, a requisition memo).

## 3. UI behavior

- In the create-block form, document upload section only appears **after**
  an issue type is selected, and dynamically shows the upload slots for
  that issue type (from the table above) plus the catch-all slot.
- Each slot accepts PDF, JPG, PNG (reports and photos); allow multiple
  files per slot where it makes sense (e.g. Photo evidence).
- Each uploaded file shows: filename, file type icon, size, and a remove
  (✕) option before submission.
- On submit, files are attached to that maintenance event record.
- This is a prototype — files can be stored locally/in a mock uploads
  folder with metadata (filename, doc type, issue type, block/track ID,
  upload timestamp) rather than needing real cloud storage or auth.

## 4. Where uploaded docs are shown afterward

- In the block detail panel (opened by clicking a segment on the map),
  add an "Attached documents" section listing each file for that block's
  maintenance events, grouped by document type, with a way to open/preview
  each one.
- In the Maintenance Calendar view, a small paperclip/attachment icon on
  any event that has documents attached.

## 5. Keep unchanged

- Everything else: existing 5 features, data files, theme, sidebar, map
  interaction from the v3 update.
