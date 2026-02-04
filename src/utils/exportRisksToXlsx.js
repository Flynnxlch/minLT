/**
 * Export risks to XLSX (Risk Identified + Risk Analysis + Mitigation Planning).
 * Uses ExcelJS in the browser; triggers download.
 */
import ExcelJS from 'exceljs';
import { getCabangLabel } from './cabang';

const HEADERS = [
  'risk id',
  'Nama Perusahaan',
  'Peristiwa Risiko',
  'Cabang',
  'Divisi',
  'Kategori',
  'Sasaran',
  'Penyebab Risiko',
  'Kategori Resiko',
  'Deskripsi Dampak',
  'Kontrol yang Ada',
  'Jenis Kontrol',
  'Penilaian Efektivitas Kontrol',
  'Level Kontrol',
  'Perkiraan waktu terpapar resiko',
  'Key Risk Indicator',
  'Unit Satuan KRI',
  'Value Aman',
  'Value Hati-Hati',
  'Value Bahaya',
  'Inherent Risk (Risiko awal sebelum adanya kontrol) Tingkat Dampak',
  'Inherent Risk (Risiko awal sebelum adanya kontrol) Tingkat Kemungkinan',
  'Tingkat Risiko Inheren',
  'Residual Risk (Risiko yang diharapkan setelah kontrol) Tingkat Dampak Residual',
  'Residual Risk (Risiko yang diharapkan setelah kontrol) Tingkat Kemungkinan Residual',
  'Tingkat Risiko Residual',
  'Jenis Penanganan',
  'Rencana Mitigasi Risiko',
  'Output Realisasi Mitigasi',
  'Anggaran Biaya Mitigasi Risiko',
  'Realisasi Biaya Mitigasi Risiko',
  'Deskripsi Tindak Lanjut',
  'Progress Mitigasi',
  'Realisasi Terhadap Target',
  'Kondisi Risiko Terkini Tingkat Dampak Terkini',
  'Kondisi Risiko Terkini Tingkat Kemungkinan Terkini',
  'Score Risiko Terkini',
];

function formatDate(value) {
  if (value == null || value === '') return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(value ?? '');
  }
}

function cell(r, key) {
  const v = r[key];
  if (v == null || v === '') return '';
  return typeof v === 'object' && v !== null && typeof v.getTime === 'function' ? formatDate(v) : String(v);
}

/**
 * Build one row for a risk (Risk Identified + Analysis + Mitigation).
 * @param {Object} r - Risk object from API (flattened: risk + analysis + mitigation fields)
 * @returns {Array<string|number>}
 */
function riskToRow(r) {
  const cabang = r.regionCode != null ? getCabangLabel(r.regionCode) : '';
  return [
    cell(r, 'id'),
    cell(r, 'organization'),
    cell(r, 'riskEvent'),
    cabang,
    cell(r, 'division'),
    cell(r, 'category'),
    cell(r, 'target'),
    cell(r, 'riskCause'),
    cell(r, 'riskCategoryType'),
    cell(r, 'impactDescription'),
    cell(r, 'existingControl'),
    cell(r, 'controlType'),
    cell(r, 'controlEffectivenessAssessment'),
    cell(r, 'controlLevel'),
    r.estimatedExposureDate ? formatDate(r.estimatedExposureDate) : '',
    cell(r, 'keyRiskIndicator'),
    cell(r, 'kriUnit'),
    cell(r, 'kriValueSafe'),
    cell(r, 'kriValueCaution'),
    cell(r, 'kriValueDanger'),
    r.impactLevel != null && r.impactLevel !== '' ? r.impactLevel : '',
    r.possibilityType != null && r.possibilityType !== '' ? r.possibilityType : '',
    cell(r, 'inherentLevel'),
    r.residualImpactLevel != null && r.residualImpactLevel !== '' ? r.residualImpactLevel : '',
    r.residualPossibilityType != null && r.residualPossibilityType !== '' ? r.residualPossibilityType : '',
    cell(r, 'residualLevel'),
    cell(r, 'handlingType'),
    cell(r, 'mitigationPlan'),
    cell(r, 'mitigationOutput'),
    r.mitigationBudget != null && r.mitigationBudget !== '' ? Number(r.mitigationBudget) : '',
    r.mitigationActual != null && r.mitigationActual !== '' ? Number(r.mitigationActual) : '',
    cell(r, 'progressMitigation'),
    cell(r, 'progressMitigation'),
    cell(r, 'realizationTarget'),
    r.currentImpactLevel != null && r.currentImpactLevel !== '' ? r.currentImpactLevel : '',
    r.currentProbabilityType != null && r.currentProbabilityType !== '' ? r.currentProbabilityType : '',
    r.currentScore != null && r.currentScore !== '' ? Number(r.currentScore) : '',
  ];
}

/**
 * Export risks to XLSX and trigger browser download.
 * @param {Array<Object>} risks - Array of risk objects (from RiskContext / API)
 * @param {string} [filename='risks.xlsx']
 */
export async function exportRisksToXlsx(risks, filename = 'risks.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MinLT RMS';
  const sheet = workbook.addWorksheet('Risiko', { views: [{ state: 'frozen', ySplit: 1 }] });

  sheet.addRow(HEADERS);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  for (const r of risks) {
    sheet.addRow(riskToRow(r));
  }

  sheet.columns.forEach((col, i) => {
    col.width = Math.min(50, Math.max(12, HEADERS[i]?.length ?? 10));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
