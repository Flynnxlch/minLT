import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCabangLabel } from '../../utils/cabang';
import CabangDropdown from '../ui/CabangDropdown';
import CategoryDropdown from '../ui/CategoryDropdown';
import DivisionDropdown from '../ui/DivisionDropdown';

// Organization is now fixed as "PT. BVB"
const ORGANIZATION_FIXED = 'PT. Gapura Angkasa';

const RISK_TYPE_OPTIONS = [
  'Strategic',
  'Operational',
  'Financial',
  'Compliance',
  'Reputational',
  'Technology',
];

const RISK_CATEGORY_TYPE_OPTIONS = [
  'Dampak Kualitatif',
  'Dampak Kuantitatif'
];

// Cabang options are now handled by CabangDropdown component

const POSSIBILITY_LABELS = {
  1: 'Sangat Jarang Terjadi',
  2: 'Jarang Terjadi',
  3: 'Bisa Terjadi',
  4: 'Sangat Mungkin Terjadi',
  5: 'Hampir Pasti Terjadi',
};

const IMPACT_LABELS = {
  1: 'Sangat Rendah',
  2: 'Rendah',
  3: 'Moderat',
  4: 'Tinggi',
  5: 'Sangat Tinggi',
};

export default function RiskForm({
  onSubmit,
  submitLabel = 'Tambah Risiko',
  compact = false,
  simplified = false, // For New Risk Entry - only show basic fields
  initial = {},
  onSaveAndGoToAnalysis, // optional: simpan lalu buka tab Analisis (Risk Detail)
}) {
  const { user } = useAuth();
  
  // Determine if user can select cabang (only ADMIN_PUSAT can select)
  const canSelectCabang = user?.userRole === 'ADMIN_PUSAT';
  
  // Auto-set regionCode from user's regionCabang for ADMIN_CABANG and USER_BIASA
  const defaultRegionCode = useMemo(() => {
    if (initial.regionCode) {
      return initial.regionCode;
    }
    // For ADMIN_CABANG and USER_BIASA, use their regionCabang
    if (user?.regionCabang && !canSelectCabang) {
      return user.regionCabang;
    }
    return 'KPS'; // Default fallback
  }, [initial.regionCode, user?.regionCabang, canSelectCabang]);

  // Organization is fixed as "PT. BVB" and cannot be edited
  const organization = ORGANIZATION_FIXED;
  const [division, setDivision] = useState(initial.division || '');
  const [target, setTarget] = useState(initial.target || '');
  const [activity, setActivity] = useState(initial.activity || '');
  const [riskEvent, setRiskEvent] = useState(initial.riskEvent || '');
  const [riskEventDescription, setRiskEventDescription] = useState(initial.riskEventDescription || '');
  const [category, setCategory] = useState(initial.category || '');
  const [riskType] = useState(initial.riskType || RISK_TYPE_OPTIONS[0]);
  const [riskCategoryType, setRiskCategoryType] = useState(initial.riskCategoryType || RISK_CATEGORY_TYPE_OPTIONS[0]);
  const [riskCause, setRiskCause] = useState(initial.riskCause || '');
  const [quantitativeRiskImpact, setQuantitativeRiskImpact] = useState(initial.quantitativeRiskImpact || '');
  const [riskImpactExplanation, setRiskImpactExplanation] = useState(initial.riskImpactExplanation || '');
  // For ADMIN_CABANG and USER_BIASA, regionCode is locked to user's regionCabang
  // For ADMIN_PUSAT, regionCode can be changed via dropdown
  // Use useMemo to get the actual regionCode to use (locked for non-admin users)
  const actualRegionCode = useMemo(() => {
    if (!canSelectCabang && user?.regionCabang) {
      // For ADMIN_CABANG and USER_BIASA, always use their regionCabang
      return user.regionCabang;
    }
    // For ADMIN_PUSAT, use the state value (can be changed)
    return defaultRegionCode;
  }, [canSelectCabang, user?.regionCabang, defaultRegionCode]);

  const [regionCode, setRegionCode] = useState(actualRegionCode);
  const [possibility, setPossibility] = useState(initial.possibility || initial.possibilityType || initial.likelihood || 3);
  const [impact, setImpact] = useState(initial.impactLevel || initial.impact || 4);
  const [mitigation, setMitigation] = useState(initial.mitigation || '');

  // For non-selectable users, ensure regionCode stays in sync with user's regionCabang
  const finalRegionCode = canSelectCabang ? regionCode : (user?.regionCabang || regionCode);

  const buildPayload = () => {
    const payload = {
      organization,
      division,
      target: target.trim(),
      activity: activity.trim(),
      riskEvent: riskEvent.trim(),
      riskEventDescription: riskEventDescription.trim(),
      category,
      riskType,
      riskCategoryType,
      riskCause: riskCause.trim(),
      quantitativeRiskImpact: quantitativeRiskImpact.trim(),
      riskImpactExplanation: riskImpactExplanation.trim(),
      title: riskEvent.trim(),
      regionCode: finalRegionCode,
    };
    if (!simplified) {
      payload.possibility = Number(possibility);
      payload.possibilityType = Number(possibility);
      payload.impact = Number(impact);
      payload.impactLevel = Number(impact);
      payload.likelihood = Number(possibility);
      payload.mitigation = mitigation.trim();
    }
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!riskEvent.trim()) return;
    const payload = buildPayload();
    onSubmit?.(payload);
    if (compact) {
      setTarget('');
      setActivity('');
      setRiskEvent('');
      setRiskEventDescription('');
      setRiskCause('');
      setQuantitativeRiskImpact('');
      setRiskImpactExplanation('');
      if (!simplified) {
        setPossibility(3);
        setImpact(4);
        setMitigation('');
      }
    }
  };

  const handleSaveAndGoToAnalysis = (e) => {
    e.preventDefault();
    if (!riskEvent.trim()) return;
    onSaveAndGoToAnalysis?.(buildPayload());
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Organization & Division */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Nama Perusahaan</label>
          <input
            type="text"
            className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
            value={organization}
            readOnly
            disabled
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Divisi</label>
          <DivisionDropdown
            value={division}
            onChange={setDivision}
            regionCode={finalRegionCode}
            placeholder="Pilih Divisi"
          />
        </div>
      </div>

      {/* Sasaran & Cabang */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sasaran</label>
          <input
            className={inputBase}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Contoh: Target Pendapatan Q4"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cabang</label>
          {canSelectCabang ? (
            // ADMIN_PUSAT can select cabang
            <CabangDropdown
              value={regionCode}
              onChange={setRegionCode}
              openUpward={false}
            />
          ) : (
            // ADMIN_CABANG and USER_BIASA: show read-only field with their regionCabang
            <input
              type="text"
              className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
              value={getCabangLabel(finalRegionCode) || finalRegionCode || 'N/A'}
              readOnly
              disabled
            />
          )}
        </div>
      </div>

      {/* Risk Event */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Peristiwa Risiko</label>
        <input
          className={inputBase}
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="Contoh: Gangguan supplier untuk komponen kritis"
          required
        />
      </div>

      {/* Deskripsi Peristiwa Risiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Peristiwa Risiko</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskEventDescription}
          onChange={(e) => setRiskEventDescription(e.target.value)}
          placeholder="Jelaskan peristiwa risiko secara detail..."
        />
      </div>

      {/* Kategori Risiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kategori Risiko</label>
        <CategoryDropdown
          value={category}
          onChange={setCategory}
          openUpward={false}
        />
      </div>

      {/* Penyebab Risiko — page break saat cetak */}
      <div className="print-break-before flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Penyebab Risiko</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskCause}
          onChange={(e) => setRiskCause(e.target.value)}
          placeholder="Jelaskan akar penyebab risiko..."
        />
      </div>

      {/* Kategori Resiko */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kategori Dampak</label>
        <select className={inputBase} value={riskCategoryType} onChange={(e) => setRiskCategoryType(e.target.value)}>
          {RISK_CATEGORY_TYPE_OPTIONS.map((rct) => (
            <option key={rct} value={rct}>{rct}</option>
          ))}
        </select>
      </div>

      {/* Deskripsi Dampak — page break saat cetak, seperti sebelum Penyebab Risiko */}
      <div className="print-break-before flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deskripsi Dampak</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskImpactExplanation}
          onChange={(e) => setRiskImpactExplanation(e.target.value)}
          placeholder="Jelaskan dampak potensial secara detail..."
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-1">
        {onSaveAndGoToAnalysis && (
          <button
            type="button"
            onClick={handleSaveAndGoToAnalysis}
            className="inline-flex items-center justify-center rounded-lg border border-[#0d6efd] px-4 py-2 text-sm font-semibold text-[#0d6efd] bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <i className="bi bi-graph-up mr-2" />
            Simpan & Lanjut ke Analisis
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-[#0d6efd] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
        >
          <i className="bi bi-plus-circle mr-2" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

