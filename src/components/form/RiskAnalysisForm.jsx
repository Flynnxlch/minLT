import { useMemo, useState } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';

const CONTROL_EFFECTIVITY_OPTIONS = [
  { value: 'effective', label: 'Effective' },
  { value: 'partially-effective', label: 'Partially Effective' },
  { value: 'ineffective', label: 'Ineffective' },
  { value: 'none', label: 'No Control' },
];

const IMPACT_LEVEL_OPTIONS = [
  { value: 1, label: '1 — Insignificant' },
  { value: 2, label: '2 — Minor' },
  { value: 3, label: '3 — Moderate' },
  { value: 4, label: '4 — Major' },
  { value: 5, label: '5 — Severe' },
  { value: 6, label: '6 — Critical' },
];

const POSSIBILITY_TYPE_OPTIONS = [
  { value: 1, label: '1 — Rare' },
  { value: 2, label: '2 — Unlikely' },
  { value: 3, label: '3 — Possible' },
  { value: 4, label: '4 — Likely' },
  { value: 5, label: '5 — Almost Certain' },
];

export default function RiskAnalysisForm({
  risk,
  onSubmit,
  onCancel,
}) {
  const [riskEvent, setRiskEvent] = useState(risk?.riskEvent || risk?.title || '');
  const [existingControl, setExistingControl] = useState(risk?.existingControl || '');
  const [existingControlEffectivity, setExistingControlEffectivity] = useState(
    risk?.existingControlEffectivity || 'none'
  );
  const [controlOwner, setControlOwner] = useState(risk?.controlOwner || '');
  const [impactDescription, setImpactDescription] = useState(risk?.impactDescription || '');
  const [impactLevel, setImpactLevel] = useState(risk?.impactLevel || 4);
  const [possibilityType, setPossibilityType] = useState(risk?.possibilityType || 3);
  const [possibilityDescription, setPossibilityDescription] = useState(risk?.possibilityDescription || '');

  const inherentScore = useMemo(() => {
    return computeRiskScore({ possibility: possibilityType, impactLevel });
  }, [possibilityType, impactLevel]);

  const inherentLevel = useMemo(() => {
    return getRiskLevel(inherentScore);
  }, [inherentScore]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!risk) return;

    const payload = {
      ...risk,
      riskEvent,
      existingControl,
      existingControlEffectivity,
      controlOwner,
      impactDescription,
      impactLevel: Number(impactLevel),
      impact: Number(impactLevel), // Keep for backward compatibility
      possibilityType: Number(possibilityType),
      possibility: Number(possibilityType), // Keep for backward compatibility
      likelihood: Number(possibilityType), // Keep for backward compatibility
      possibilityDescription,
      score: inherentScore, // Save the computed score
      inherentScore,
      level: inherentLevel.label, // Save the computed level
      inherentLevel: inherentLevel.label,
    };

    onSubmit?.(payload);
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Risk Event */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Risk Event</label>
        <input
          className={inputBase}
          value={riskEvent}
          onChange={(e) => setRiskEvent(e.target.value)}
          placeholder="Describe the risk event..."
          required
        />
      </div>

      {/* Existing Control & Control Effectivity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Existing Control</label>
          <textarea
            className={`${inputBase} min-h-[100px] resize-y`}
            value={existingControl}
            onChange={(e) => setExistingControl(e.target.value)}
            placeholder="Describe existing controls..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Existing Control Effectivity
          </label>
          <select
            className={inputBase}
            value={existingControlEffectivity}
            onChange={(e) => setExistingControlEffectivity(e.target.value)}
          >
            {CONTROL_EFFECTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Owner */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Control Owner</label>
        <input
          className={inputBase}
          value={controlOwner}
          onChange={(e) => setControlOwner(e.target.value)}
          placeholder="Enter control owner name..."
        />
      </div>

      {/* Impact Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Impact Assessment</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Description</label>
            <textarea
              className={`${inputBase} min-h-[100px] resize-y`}
              value={impactDescription}
              onChange={(e) => setImpactDescription(e.target.value)}
              placeholder="Describe the potential impact..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Level</label>
            <select
              className={inputBase}
              value={impactLevel}
              onChange={(e) => setImpactLevel(e.target.value)}
            >
              {IMPACT_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Possibility Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Possibility Assessment</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Possibility Type</label>
            <select
              className={inputBase}
              value={possibilityType}
              onChange={(e) => setPossibilityType(e.target.value)}
            >
              {POSSIBILITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Possibility Description</label>
            <textarea
              className={`${inputBase} min-h-[100px] resize-y`}
              value={possibilityDescription}
              onChange={(e) => setPossibilityDescription(e.target.value)}
              placeholder="Describe the possibility/likelihood..."
            />
          </div>
        </div>
      </div>

      {/* Risk Level Result */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Inherent Risk Level</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={inherentScore} />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {inherentScore}/25
            </span>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
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
          Save Evaluation
        </button>
      </div>
    </form>
  );
}

