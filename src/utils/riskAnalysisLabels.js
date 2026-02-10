/**
 * Label untuk Pengukuran Resiko (Inherent & Residual) — satu sumber kebenaran.
 * Digunakan di Risk Analysis Form, Risk Detail, dan Mitigation Plan Form.
 */

export const IMPACT_LEVEL_LABELS = {
  1: 'Rendah',
  2: 'Rendah - Menengah',
  3: 'Menengah',
  4: 'Menengah - Tinggi',
  5: 'Tinggi',
};

export const POSSIBILITY_TYPE_LABELS = {
  1: 'Sangat Jarang Terjadi',
  2: 'Jarang Terjadi',
  3: 'Bisa Terjadi',
  4: 'Sangat Mungkin Terjadi',
  5: 'Hampir Pasti Terjadi',
};

/** Opsi untuk dropdown Tingkat Dampak (value + label penuh "n — Teks") */
export const IMPACT_LEVEL_OPTIONS = Object.entries(IMPACT_LEVEL_LABELS).map(([value, label]) => ({
  value: Number(value),
  label: `${value} — ${label}`,
}));

/** Opsi untuk dropdown Tingkat Kemungkinan */
export const POSSIBILITY_TYPE_OPTIONS = Object.entries(POSSIBILITY_TYPE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label: `${value} — ${label}`,
}));

/** Teks tampilan: "n — Label" atau "N/A" */
export function getImpactDisplay(level) {
  if (level == null || level === 0) return 'N/A';
  const label = IMPACT_LEVEL_LABELS[level];
  return label ? `${level} — ${label}` : 'N/A';
}

export function getPossibilityDisplay(type) {
  if (type == null || type === 0) return 'N/A';
  const label = POSSIBILITY_TYPE_LABELS[type];
  return label ? `${type} — ${label}` : 'N/A';
}

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/**
 * Format rentang exposure untuk tampilan: "Januari - Desember 2026" atau "Maret 2025 - November 2026".
 * @param {string|Date|null} startDateISO - Tanggal/bulan awal
 * @param {string|Date|null} endDateISO - Tanggal/bulan akhir
 * @returns {string}
 */
export function formatExposureRangeForDisplay(startDateISO, endDateISO) {
  const toDate = (v) => {
    if (!v) return null;
    const d = typeof v === 'string' ? new Date(v) : v;
    return isNaN(d.getTime()) ? null : d;
  };
  const start = toDate(startDateISO);
  const end = toDate(endDateISO);
  if (!start && !end) return 'N/A';
  const fmt = (d) => {
    const month = BULAN_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${month} ${year}`;
  };
  if (start && end) {
    if (start.getTime() === end.getTime()) return fmt(start);
    return `${fmt(start)} - ${fmt(end)}`;
  }
  return start ? fmt(start) : fmt(end);
}
