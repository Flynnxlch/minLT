import { useMemo, useState } from 'react';
import { computeRiskScore } from '../../utils/risk';
import RiskLevelBadge from '../risk/RiskLevelBadge';
import RiskScoreBar from '../risk/RiskScoreBar';

const EVALUATION_STATUS_OPTIONS = [
  { value: 'effective', label: 'Effective - Mitigation is working well' },
  { value: 'partially-effective', label: 'Partially Effective - Needs improvement' },
  { value: 'ineffective', label: 'Ineffective - Mitigation not working' },
  { value: 'not-started', label: 'Not Started - Mitigation not yet implemented' },
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

export default function EvaluationForm({
  risk,
  evaluator = 'Current User',
  onAccept,
  onReject,
  onCancel,
}) {
  // Evaluation fields
  const [evaluationStatus, setEvaluationStatus] = useState(
    risk?.evaluationStatus || EVALUATION_STATUS_OPTIONS[0].value
  );
  const [evaluationNotes, setEvaluationNotes] = useState(risk?.evaluationNotes || '');
  const [evaluationDate, setEvaluationDate] = useState(
    risk?.evaluationDate || new Date().toISOString().split('T')[0]
  );
  const [evaluatorNote, setEvaluatorNote] = useState(risk?.evaluatorNote || '');

  // Current risk assessment (after mitigation)
  const [currentImpactDescription, setCurrentImpactDescription] = useState(
    risk?.currentImpactDescription || risk?.residualImpactDescription || ''
  );
  const [currentImpactLevel, setCurrentImpactLevel] = useState(
    risk?.currentImpactLevel || risk?.residualImpactLevel || risk?.impactLevel || 0
  );
  const [currentProbabilityDescription, setCurrentProbabilityDescription] = useState(
    risk?.currentProbabilityDescription || risk?.residualProbabilityDescription || ''
  );
  const [currentProbabilityType, setCurrentProbabilityType] = useState(
    risk?.currentProbabilityType || risk?.residualProbabilityType || risk?.possibilityType || 0
  );

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  const currentScore = risk?.score || 0;

  // Calculate evaluated score for display
  const evaluatedScore = useMemo(() => {
    return computeRiskScore({
      possibility: Number(currentProbabilityType) || 0,
      impactLevel: Number(currentImpactLevel) || 0,
    });
  }, [currentProbabilityType, currentImpactLevel]);

  const buildPayload = (status) => {
    return {
      ...risk,
      // Evaluation metadata
      evaluationStatus: status,
      evaluationNotes: evaluationNotes.trim(),
      evaluationDate,
      evaluator,
      evaluatorNote: evaluatorNote.trim(),
      lastEvaluatedAt: new Date().toISOString(),

      // Current risk assessment (after mitigation evaluation)
      currentImpactDescription: currentImpactDescription.trim(),
      currentImpactLevel: Number(currentImpactLevel) || 0,
      currentProbabilityDescription: currentProbabilityDescription.trim(),
      currentProbabilityType: Number(currentProbabilityType) || 0,

      // Update score based on evaluation
      score: evaluatedScore > 0 ? evaluatedScore : currentScore,
      possibility: Number(currentProbabilityType) || risk?.possibility || 0,
      possibilityType: Number(currentProbabilityType) || risk?.possibilityType || 0,
      likelihood: Number(currentProbabilityType) || risk?.likelihood || 0,
      impact: Number(currentImpactLevel) || risk?.impact || 0,
      impactLevel: Number(currentImpactLevel) || risk?.impactLevel || 0,
    };
  };

  const handleAccept = (e) => {
    e.preventDefault();
    const payload = buildPayload('effective');
    onAccept?.(payload);
  };

  const handleReject = (e) => {
    e.preventDefault();
    const payload = buildPayload('ineffective');
    onReject?.(payload);
  };

  return (
    <form className="space-y-4">
      {/* Risk Summary */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Risk & Mitigation Summary</div>
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Event:</span> {risk?.riskEvent || risk?.title}
          </div>
          <div>
            <span className="font-semibold">Mitigation Plan:</span> {risk?.mitigationPlan || risk?.mitigation || 'N/A'}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="font-semibold">Current Score:</span>
            <span>{currentScore}/25</span>
            <div className="w-full sm:w-40">
              <RiskScoreBar score={currentScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Status */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Evaluation Status</label>
        <select className={inputBase} value={evaluationStatus} onChange={(e) => setEvaluationStatus(e.target.value)}>
          {EVALUATION_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Evaluation Date & Evaluator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Evaluation Date</label>
          <input
            type="date"
            className={inputBase}
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Evaluator</label>
          <input
            className={`${inputBase} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`}
            value={evaluator}
            disabled
            readOnly
          />
        </div>
      </div>

      {/* Evaluator Note */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Evaluator Note</label>
        <textarea
          className={`${inputBase} min-h-[100px] resize-y`}
          value={evaluatorNote}
          onChange={(e) => setEvaluatorNote(e.target.value)}
          placeholder="Additional notes from evaluator..."
        />
      </div>

      {/* Current Risk Assessment (After Mitigation) */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Risk Assessment (After Mitigation)</div>

        {/* Impact */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Impact
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Description</label>
              <textarea
                className={`${inputBase} min-h-[90px] resize-y`}
                value={currentImpactDescription}
                onChange={(e) => setCurrentImpactDescription(e.target.value)}
                placeholder="Describe current impact after mitigation..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Impact Level (1–5)</label>
              <select
                className={inputBase}
                value={currentImpactLevel}
                onChange={(e) => setCurrentImpactLevel(e.target.value)}
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
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Probability
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Probability Description</label>
              <textarea
                className={`${inputBase} min-h-[90px] resize-y`}
                value={currentProbabilityDescription}
                onChange={(e) => setCurrentProbabilityDescription(e.target.value)}
                placeholder="Describe current probability after mitigation..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Probability Level (1–5)</label>
              <select
                className={inputBase}
                value={currentProbabilityType}
                onChange={(e) => setCurrentProbabilityType(e.target.value)}
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

        {/* Evaluated Risk Level Result */}
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluated Risk Level</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Based on current assessment after mitigation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RiskLevelBadge score={evaluatedScore} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{evaluatedScore}/25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors order-3 sm:order-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors order-2"
        >
          <i className="bi bi-x-circle mr-1.5"></i>
          Rejected
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors order-1 sm:order-3"
        >
          <i className="bi bi-check-circle mr-1.5"></i>
          Accepted
        </button>
      </div>
    </form>
  );
}

