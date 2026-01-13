import { useMemo, useState } from 'react';
import { computeRiskScore } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import RiskScoreBar from '../risk/RiskScoreBar';

const HANDLING_TYPE_OPTIONS = [
  { value: 'accept-monitor', label: 'Accept / Monitor' },
  { value: 'reduce-mitigate', label: 'Reduce / Mitigate' },
  { value: 'transfer-sharing', label: 'Transfer / Sharing' },
  { value: 'avoid-hindari', label: 'Avoid / Hindari' },
];

const DIVISION_OPTIONS = [
  'Internal Audit Group Head (UA)',
  'Quality Assurance Group Head (UQ)',
  'Corporate Secretary and General Affair Group (US)',
  'Planning & Performance Group Head (UP)',
  'Legal Group Head (UL)',
  'Human Capital Management Group Head (HM)',
  'Human Capital Support & Industrial Relation (HC)',
  'Procurement Group Head (HB)',
  'Training Development Group Head (HT)',
  'Accounting, Tax & Asset Management Group (KF)',
];

const PROBABILITY_LABELS = {
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

const CONTROL_EFFECTIVITY_LABELS = {
  'effective': 'Effective',
  'partially-effective': 'Partially Effective',
  'ineffective': 'Ineffective',
  'none': 'No Control',
};

export default function MitigationPlanForm({
  risk,
  onSubmit,
  onCancel,
}) {
  // Mitigation Plan fields
  const [riskEvent, setRiskEvent] = useState(risk?.riskEvent || risk?.title || '');
  const [handlingType, setHandlingType] = useState(
    risk?.mitigationHandlingType || HANDLING_TYPE_OPTIONS[0].value
  );
  const [mitigatePlan, setMitigatePlan] = useState(risk?.mitigationPlan || risk?.mitigation || '');
  const [handlingPic, setHandlingPic] = useState(risk?.mitigationPIC || risk?.mitigationOwner || risk?.owner || '');
  const [outputPlan, setOutputPlan] = useState(risk?.mitigationOutput || '');
  const [startDate, setStartDate] = useState(risk?.mitigationStartDate || '');
  const [endDate, setEndDate] = useState(risk?.mitigationEndDate || risk?.mitigationDueDate || '');
  const [division, setDivision] = useState(risk?.mitigationDivision || risk?.division || DIVISION_OPTIONS[0]);
  const [mitigationPrice, setMitigationPrice] = useState(
    risk?.mitigationPrice !== undefined && risk?.mitigationPrice !== null ? String(risk.mitigationPrice) : ''
  );

  // End-year residual (quantitative + residual impact/probability)
  const [residualQuantImpact, setResidualQuantImpact] = useState(risk?.residualQuantitativeRiskImpact || '');
  const [residualQuantImpactDesc, setResidualQuantImpactDesc] = useState(
    risk?.residualQuantitativeRiskImpactDescription || ''
  );
  const [residualImpactDescription, setResidualImpactDescription] = useState(risk?.residualImpactDescription || '');
  const [residualImpactLevel, setResidualImpactLevel] = useState(risk?.residualImpactLevel || 0);
  const [residualProbabilityDescription, setResidualProbabilityDescription] = useState(
    risk?.residualProbabilityDescription || ''
  );
  const [residualProbabilityType, setResidualProbabilityType] = useState(risk?.residualProbabilityType || 0);
  const [dateError, setDateError] = useState('');

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  // Calculate residual score
  const residualScoreRaw = useMemo(() => {
    return computeRiskScore({
      possibility: Number(residualProbabilityType) || 0,
      impactLevel: Number(residualImpactLevel) || 0,
    });
  }, [residualProbabilityType, residualImpactLevel]);

  const inherentScore = risk?.score || 0;
  const finalResidualScore = useMemo(() => {
    return Math.max(1, inherentScore - residualScoreRaw);
  }, [inherentScore, residualScoreRaw]);

  // Validate dates whenever they change
  const validateDates = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        setDateError('End Date must be after Start Date');
        return false;
      }
    }
    setDateError('');
    return true;
  };

  // Validate on date changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    if (endDate) {
      setTimeout(validateDates, 0);
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    if (startDate) {
      setTimeout(validateDates, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate dates before submitting
    if (!validateDates()) {
      return;
    }

    const payload = {
      ...risk,
      // Basic info
      riskEvent: riskEvent.trim(),

      // Mitigation Plan main
      mitigation: mitigatePlan.trim(),
      mitigationPlan: mitigatePlan.trim(),
      mitigationHandlingType: handlingType,
      mitigationPIC: handlingPic.trim(),
      mitigationOwner: handlingPic.trim(),
      mitigationOutput: outputPlan.trim(),
      mitigationStartDate: startDate,
      mitigationEndDate: endDate,
      mitigationDueDate: endDate,
      mitigationDivision: division,
      mitigationPrice: mitigationPrice === '' ? null : Number(mitigationPrice),

      // End-year residual
      residualQuantitativeRiskImpact: residualQuantImpact.trim(),
      residualQuantitativeRiskImpactDescription: residualQuantImpactDesc.trim(),
      residualImpactDescription: residualImpactDescription.trim(),
      residualImpactLevel: Number(residualImpactLevel) || 0,
      residualProbabilityDescription: residualProbabilityDescription.trim(),
      residualProbabilityType: Number(residualProbabilityType) || 0,
      residualScore: residualScoreRaw,
      residualScoreFinal: finalResidualScore,

      // Save inherent score
      inherentScore: inherentScore,

      // Update current score to residual score
      score: finalResidualScore,
    };

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Risk Summary</div>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Existing Control Effectivity:</span>{' '}
            {risk?.existingControlEffectivity 
              ? CONTROL_EFFECTIVITY_LABELS[risk.existingControlEffectivity] || risk.existingControlEffectivity
              : 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Impact:</span>{' '}
            {risk?.impactLevel 
              ? `${risk.impactLevel} — ${IMPACT_LABELS[risk.impactLevel] || 'N/A'}`
              : 'N/A'}
            {risk?.impactDescription && (
              <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">
                {risk.impactDescription}
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold">Possibility:</span>{' '}
            {risk?.possibilityType 
              ? `${risk.possibilityType} — ${PROBABILITY_LABELS[risk.possibilityType] || 'N/A'}`
              : 'N/A'}
            {risk?.possibilityDescription && (
              <div className="mt-1 ml-0 text-gray-600 dark:text-gray-400">
                {risk.possibilityDescription}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Event</label>
        <input
          className={inputBase}
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="Describe the risk event..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Handling Type</label>
        <select className={inputBase} value={handlingType} onChange={(e) => setHandlingType(e.target.value)}>
          {HANDLING_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Mitigate Plan</label>
        <textarea
          className={`${inputBase} min-h-[110px] resize-y`}
          value={mitigatePlan}
          onChange={(e) => setMitigatePlan(e.target.value)}
          placeholder="Describe the mitigation plan..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Handling PIC</label>
          <input
            className={inputBase}
            value={handlingPic}
            onChange={(e) => setHandlingPic(e.target.value)}
            placeholder="PIC / person in charge"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Division</label>
          <select
            className={inputBase}
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          >
            {DIVISION_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Output Mitigation Plan</label>
        <textarea
          className={`${inputBase} min-h-[90px] resize-y`}
          value={outputPlan}
          onChange={(e) => setOutputPlan(e.target.value)}
          placeholder="Expected output/deliverable of the mitigation plan..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Start Date</label>
          <input
            type="date"
            className={inputBase}
            value={startDate}
            onChange={handleStartDateChange}
            max={endDate || undefined}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">End Date</label>
          <input
            type="date"
            className={`${inputBase} ${dateError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
          />
          {dateError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <i className="bi bi-exclamation-circle"></i>
              {dateError}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mitigation Price</label>
        <input
          type="number"
          inputMode="numeric"
          className={inputBase}
          value={mitigationPrice}
          onChange={(e) => setMitigationPrice(e.target.value)}
          placeholder="0"
          min="0"
          step="1"
        />
      </div>

      {/* End Year Residual */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">End Year Residual</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Quantitative Risk Impact</label>
            <input
              className={inputBase}
              value={residualQuantImpact}
              onChange={(e) => setResidualQuantImpact(e.target.value)}
              placeholder="e.g., Rp 500.000.000"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Description</label>
            <input
              className={inputBase}
              value={residualQuantImpactDesc}
              onChange={(e) => setResidualQuantImpactDesc(e.target.value)}
              placeholder="Describe residual quantitative impact..."
            />
          </div>
        </div>

        {/* Impact */}
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Impact
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Description</label>
              <textarea
                className={`${inputBase} min-h-[90px] resize-y`}
                value={residualImpactDescription}
                onChange={(e) => setResidualImpactDescription(e.target.value)}
                placeholder="Describe residual impact..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Level (1–5)</label>
              <select
                className={inputBase}
                value={residualImpactLevel}
                onChange={(e) => setResidualImpactLevel(e.target.value)}
              >
                <option value={0}>-- Select --</option>
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} — {IMPACT_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Probability */}
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Probability
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Probability Description</label>
              <textarea
                className={`${inputBase} min-h-[90px] resize-y`}
                value={residualProbabilityDescription}
                onChange={(e) => setResidualProbabilityDescription(e.target.value)}
                placeholder="Describe residual probability..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Probability Level (1–5)</label>
              <select
                className={inputBase}
                value={residualProbabilityType}
                onChange={(e) => setResidualProbabilityType(e.target.value)}
              >
                <option value={0}>-- Select --</option>
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v} — {PROBABILITY_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Residual Risk Level Result */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Residual Risk Level</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Inherent: {inherentScore} - Residual: {residualScoreRaw} = {finalResidualScore}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RiskLevelBadge score={finalResidualScore} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{finalResidualScore}/25</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
        >
          Save Mitigation Plan
        </button>
      </div>
    </form>
  );
}

