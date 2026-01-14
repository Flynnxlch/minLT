import { useMemo, useState } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import CabangDropdown from '../ui/CabangDropdown';

const ORGANIZATION_OPTIONS = [
  'Corporate',
  'Regional Office',
  'Branch Office',
  'Subsidiary',
];

const DIVISION_OPTIONS = [
  'Internal Audit Group Head',
  'Quality Assurance Group Head',
  'Corporate Secretary and General Affair Group',
  'Planning & Performance Group Head',
  'Legal Group Head',
  'Human Capital Management Group Head',
  'Human Capital Support & Industrial Relation',
  'Procurement Group Head',
  'Training Development Group Head',
  'Accounting, Tax & Asset Management Group',
];

const CATEGORY_OPTIONS = [
  'Investasi',
  'Pasar',
  'Keuangan',
  'Organisasional',
  'Hukum dan Kepatuhan',
  'Reputasi',
  'Strategis',
  'Kredit dan Counterpart',
  'Transaksi Antar Emitas Grup',
  'Asuransi',
];

const RISK_TYPE_OPTIONS = [
  'Strategic',
  'Operational',
  'Financial',
  'Compliance',
  'Reputational',
  'Technology',
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
  submitLabel = 'Add Risk',
  compact = false,
  simplified = false, // For New Risk Entry - only show basic fields
  initial = {},
}) {
  const [organization, setOrganization] = useState(initial.organization || ORGANIZATION_OPTIONS[0]);
  const [division, setDivision] = useState(initial.division || DIVISION_OPTIONS[0]);
  const [target, setTarget] = useState(initial.target || '');
  const [activity, setActivity] = useState(initial.activity || '');
  const [riskEvent, setRiskEvent] = useState(initial.riskEvent || '');
  const [category, setCategory] = useState(initial.category || CATEGORY_OPTIONS[0]);
  const [riskType, setRiskType] = useState(initial.riskType || RISK_TYPE_OPTIONS[0]);
  const [riskCause, setRiskCause] = useState(initial.riskCause || '');
  const [quantitativeRiskImpact, setQuantitativeRiskImpact] = useState(initial.quantitativeRiskImpact || '');
  const [riskImpactExplanation, setRiskImpactExplanation] = useState(initial.riskImpactExplanation || '');
  const [regionCode, setRegionCode] = useState(initial.regionCode || 'KPS');
  const [possibility, setPossibility] = useState(initial.possibility || initial.possibilityType || initial.likelihood || 3);
  const [impact, setImpact] = useState(initial.impactLevel || initial.impact || 4);
  const [mitigation, setMitigation] = useState(initial.mitigation || '');

  const score = useMemo(() => computeRiskScore({ possibility, impactLevel: impact }), [possibility, impact]);
  const level = useMemo(() => getRiskLevel(score), [score]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!riskEvent.trim()) return;
    
    const payload = {
      organization,
      division,
      target: target.trim(),
      activity: activity.trim(),
      riskEvent: riskEvent.trim(),
      category,
      riskType,
      riskCause: riskCause.trim(),
      quantitativeRiskImpact: quantitativeRiskImpact.trim(),
      riskImpactExplanation: riskImpactExplanation.trim(),
      title: riskEvent.trim(), // Keep title for backward compatibility
      regionCode,
    };
    
    // Only include these fields if not simplified
    if (!simplified) {
      payload.possibility = Number(possibility);
      payload.possibilityType = Number(possibility);
      payload.impact = Number(impact);
      payload.impactLevel = Number(impact);
      payload.likelihood = Number(possibility); // Keep for backward compatibility
      payload.mitigation = mitigation.trim();
    }
    
    onSubmit?.(payload);

    // Reset form (compact quick entry)
    if (compact) {
      setTarget('');
      setActivity('');
      setRiskEvent('');
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

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Organization & Division */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Organization</label>
          <select className={inputBase} value={organization} onChange={(e) => setOrganization(e.target.value)}>
            {ORGANIZATION_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Division</label>
          <select className={inputBase} value={division} onChange={(e) => setDivision(e.target.value)}>
            {DIVISION_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Target & Activity */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Target</label>
          <input
            className={inputBase}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g., Q4 Revenue Target"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Activity</label>
          <input
            className={inputBase}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g., Product Launch"
          />
        </div>
      </div>

      {/* Risk Event */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Event</label>
        <input
          className={inputBase}
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="e.g., Supplier disruption for critical components"
          required
        />
      </div>

      {/* Risk Category & Risk Type */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Category</label>
          <select className={inputBase} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Type</label>
          <select className={inputBase} value={riskType} onChange={(e) => setRiskType(e.target.value)}>
            {RISK_TYPE_OPTIONS.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk Cause */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Cause</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskCause}
          onChange={(e) => setRiskCause(e.target.value)}
          placeholder="Describe the root cause of the risk..."
        />
      </div>

      {/* Quantitative Risk Impact */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Quantitative Risk Impact</label>
        <input
          className={inputBase}
          value={quantitativeRiskImpact}
          onChange={(e) => setQuantitativeRiskImpact(e.target.value)}
          placeholder="e.g., $500K loss, 20% delay"
        />
      </div>

      {/* Risk Impact Explanation */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Impact Explanation</label>
        <textarea
          className={`${inputBase} min-h-[80px] resize-y`}
          value={riskImpactExplanation}
          onChange={(e) => setRiskImpactExplanation(e.target.value)}
          placeholder="Explain the potential impact in detail..."
        />
      </div>

      {/* Region/Cabang - only show in simplified mode */}
      {simplified && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Region/Cabang</label>
          <CabangDropdown
            value={regionCode}
            onChange={setRegionCode}
            openUpward={true}
          />
        </div>
      )}

      {/* Region - only show if not simplified */}
      {!simplified && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Region/Cabang</label>
            <CabangDropdown
              value={regionCode}
              onChange={setRegionCode}
            />
          </div>

          <div className={compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Probabilitas (1–5)</label>
              <select className={inputBase} value={possibility} onChange={(e) => setPossibility(e.target.value)}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} — {POSSIBILITY_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Dampak (1–5)</label>
              <select className={inputBase} value={impact} onChange={(e) => setImpact(e.target.value)}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} — {IMPACT_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mitigation (summary)</label>
            <textarea
              className={`${inputBase} min-h-[96px] resize-y`}
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              placeholder="Describe mitigation actions, owner, due date, and evidence..."
            />
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {!simplified && (
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={score} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Level: <span className="font-semibold text-gray-900 dark:text-gray-100">{level.label}</span>
            </span>
          </div>
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

