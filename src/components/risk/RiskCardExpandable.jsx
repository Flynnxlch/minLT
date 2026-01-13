import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../../utils/riskStatus';
import RiskLevelBadge from './RiskLevelBadge';
import RiskScoreBar from './RiskScoreBar';

function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

/**
 * Expandable Risk Card Component with detailed sections
 * Shows: Risk Registry, Analysis, Planning, Evaluation (if applicable)
 */
export default function RiskCardExpandable({
  risk,
  showRiskLevel = true,
  showScoreBar = false,
  showRemoveButton = false,
  showEvaluateButton = false,
  showLocation = true,
  showEvaluationMonth = true,
  riskEventMaxLength = 18,
  clickable = false,
  onRemove,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (!risk) return null;

  const riskStatus = getRiskStatus(risk);
  const statusConfig = RISK_STATUS_CONFIG[riskStatus] || RISK_STATUS_CONFIG['open-risk'];
  const riskEventValue = risk.riskEvent || risk.title || '';
  const riskEventText = truncateText(riskEventValue, riskEventMaxLength);

  // Determine which sections to show based on status
  const hasAnalysis = ['analyzed', 'planned', 'mitigated', 'not-finished'].includes(riskStatus);
  const hasPlanning = ['planned', 'mitigated', 'not-finished'].includes(riskStatus);
  const hasEvaluation = ['mitigated', 'not-finished'].includes(riskStatus);

  const handleCardClick = () => {
    if (clickable) {
      navigate(`/risks/${risk.id}/detail`);
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-(--color-card-border-dark) bg-white dark:bg-(--color-card-bg-dark) transition-colors ${
        clickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''
      } ${className}`}
      onClick={clickable ? handleCardClick : undefined}
    >
      {/* Collapsed View */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Header: Organization */}
            {risk.organization && (
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{risk.organization}</span>
                {showLocation && risk.location && (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {risk.location} {risk.regionCode && `(${risk.regionCode})`}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Title - Use riskEvent if available */}
            <div className="font-semibold text-gray-900 dark:text-white mt-1">
              <span className="block truncate" title={riskEventValue}>
                {riskEventText}
              </span>
            </div>

            {/* Division, Category, Eval */}
            <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
              {risk.division && (
                <div>
                  Division: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.division}</span>
                </div>
              )}
              {(risk.category || risk.riskCategory) && (
                <div>
                  Category: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.category || risk.riskCategory}</span>
                </div>
              )}
              {showEvaluationMonth && risk.evaluationMonth && (
                <div>
                  Eval: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.evaluationMonth}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Right side: Badge, Score Bar, Action Buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {showRiskLevel && <RiskLevelBadge score={risk.score} />}
            {showScoreBar && <RiskScoreBar score={risk.score} className="w-28" />}
            
            {/* Minimize/Maximize Button (like Card component) */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              <i className={`bi ${isExpanded ? 'bi-dash-square' : 'bi-plus-square'} text-lg`}></i>
            </button>

            {/* Remove Button */}
            {showRemoveButton && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(risk.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm"
                title="Remove Risk"
              >
                <i className="bi bi-trash"></i>
                <span className="hidden sm:inline">Remove</span>
              </button>
            )}

            {/* Action buttons based on status */}
            {showEvaluateButton && riskStatus === 'open-risk' && (
              <Link
                to={`/risks/${risk.id}/risk-analysis`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors shadow-sm"
                title="Risk Analysis"
              >
                <i className="bi bi-clipboard-check"></i>
                <span className="hidden sm:inline">Analyze</span>
              </Link>
            )}
            {showEvaluateButton && (riskStatus === 'analyzed' || riskStatus === 'not-finished') && (
              <Link
                to={`/risks/${risk.id}/mitigation-plan`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                title="Mitigation Plan"
              >
                <i className="bi bi-shield-check"></i>
                <span className="hidden sm:inline">Mitigate</span>
              </Link>
            )}
            {showEvaluateButton && (riskStatus === 'planned' || riskStatus === 'not-finished') && (
              <Link
                to={`/risks/${risk.id}/evaluation`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#ffc107] rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
                title="Monthly Evaluation"
              >
                <i className="bi bi-calendar-check"></i>
                <span className="hidden sm:inline">Evaluate</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Expanded View - Sections */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-(--color-card-border-dark) p-4 space-y-4 bg-gray-50 dark:bg-gray-800/30">
          {/* Section 1: Risk Identified */}
          <div className="border-l-4 border-blue-500 pl-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <i className="bi bi-clipboard-data mr-2 text-blue-500"></i>
              Risk Identified
            </div>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <span className="font-semibold">Risk Event:</span> {risk.riskEvent || risk.title || 'N/A'}
              </div>
              {risk.target && (
                <div>
                  <span className="font-semibold">Target:</span> {risk.target}
                </div>
              )}
              {risk.activity && (
                <div>
                  <span className="font-semibold">Activity:</span> {risk.activity}
                </div>
              )}
              {risk.riskCause && (
                <div>
                  <span className="font-semibold">Risk Cause:</span> {risk.riskCause}
                </div>
              )}
              {(risk.category || risk.riskCategory) && (
                <div>
                  <span className="font-semibold">Risk Category:</span> {risk.category || risk.riskCategory}
                </div>
              )}
              {risk.riskImpactExplanation && (
                <div>
                  <span className="font-semibold">Risk Impact Explanation:</span> {risk.riskImpactExplanation}
                </div>
              )}
              {risk.quantitativeRiskImpact && (
                <div>
                  <span className="font-semibold">Risk Impact:</span> {risk.quantitativeRiskImpact}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Analysis (if analyzed) */}
          {hasAnalysis && (
            <div className="border-l-4 border-green-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-graph-up mr-2 text-green-500"></i>
                Risk Analysis
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.impactDescription && (
                  <div>
                    <span className="font-semibold">Impact Description:</span> {risk.impactDescription}
                  </div>
                )}
                {risk.possibilityDescription && (
                  <div>
                    <span className="font-semibold">Probability Description:</span> {risk.possibilityDescription}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Risk Score:</span> {risk.score || 0}/25
                  <span className="ml-2 text-xs">
                    (Probability: {risk.possibility || risk.possibilityType || 0} × Impact: {risk.impact || risk.impactLevel || 0})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Planning (if planned) */}
          {hasPlanning && (
            <div className="border-l-4 border-yellow-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-shield-check mr-2 text-yellow-500"></i>
                Mitigation Planning
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.mitigationPlan && (
                  <div>
                    <span className="font-semibold">Mitigation Plan:</span> {risk.mitigationPlan}
                  </div>
                )}
                {risk.residualImpactDescription && (
                  <div>
                    <span className="font-semibold">Residual Impact:</span> {risk.residualImpactDescription}
                  </div>
                )}
                {risk.residualProbabilityDescription && (
                  <div>
                    <span className="font-semibold">Residual Probability:</span> {risk.residualProbabilityDescription}
                  </div>
                )}
                {risk.evaluationMonth && (
                  <div>
                    <span className="font-semibold">Evaluation Month:</span> {risk.evaluationMonth}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Evaluation (if evaluated) */}
          {hasEvaluation && (
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <i className="bi bi-calendar-check mr-2 text-purple-500"></i>
                Monthly Evaluation
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.evaluationStatus && (
                  <div>
                    <span className="font-semibold">Status:</span> {risk.evaluationStatus}
                  </div>
                )}
                {risk.evaluationNotes && (
                  <div>
                    <span className="font-semibold">Notes:</span> {risk.evaluationNotes}
                  </div>
                )}
                {risk.evaluator && (
                  <div>
                    <span className="font-semibold">Evaluator:</span> {risk.evaluator}
                  </div>
                )}
                {risk.evaluationDate && (
                  <div>
                    <span className="font-semibold">Date:</span> {risk.evaluationDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

