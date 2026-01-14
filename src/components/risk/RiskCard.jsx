import { Link } from 'react-router-dom';
import { getRiskLevel } from '../../utils/risk';
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
 * Reusable Risk Card Component
 * 
 * @param {Object} risk - Risk data object
 * @param {boolean} showRiskLevel - Show risk level badge (default: true)
 * @param {boolean} showScoreBar - Show risk score bar (default: false)
 * @param {boolean} showRemoveButton - Show remove button (default: false)
 * @param {boolean} showEvaluateButton - Show evaluate button for risks without mitigation (default: false)
 * @param {boolean} showEvaluationMonth - Show evaluation month (default: true)
 * @param {boolean} showMitigation - Show mitigation text (default: false)
 * @param {number} mitigationLineClamp - Number of lines to clamp mitigation text (default: 0 = no clamp)
 * @param {number} riskEventMaxLength - Max characters for Risk Event title (default: 18)
 * @param {number} mitigationMaxLength - Max characters for Mitigation text (default: 25)
 * @param {Function} onRemove - Callback when remove button is clicked
 * @param {string} className - Additional CSS classes
 */
export default function RiskCard({
  risk,
  showRiskLevel = true,
  showScoreBar = false,
  showRemoveButton = false,
  showEvaluateButton = false,
  showEvaluationMonth = true,
  showMitigation = false,
  mitigationLineClamp = 0,
  riskEventMaxLength = 18,
  mitigationMaxLength = 25,
  onRemove,
  onClick,
  className = '',
}) {
  if (!risk) return null;
  const isClickable = typeof onClick === 'function';
  const riskStatus = getRiskStatus(risk);
  const statusConfig = RISK_STATUS_CONFIG[riskStatus] || RISK_STATUS_CONFIG['open-risk'];
  const riskEventValue = risk.riskEvent || risk.title || '';
  const riskEventText = truncateText(riskEventValue, riskEventMaxLength);
  const mitigationValue = risk.mitigationPlan || risk.mitigation || '';
  const mitigationText = truncateText(mitigationValue, mitigationMaxLength);
  const hasMitigation = mitigationValue.trim().length > 0;

  const getMitigationClasses = () => {
    if (mitigationLineClamp === 0) return '';
    // Use Tailwind's line-clamp utilities
    const clampMap = {
      1: 'line-clamp-1',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
    };
    return clampMap[mitigationLineClamp] || '';
  };

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-(--color-card-border-dark) bg-white dark:bg-(--color-card-bg-dark) p-3 transition-colors ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''
      } ${className}`}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Header: Organization | Cabang */}
          {(risk.organization || risk.regionCode) && (
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {risk.organization && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{risk.organization}</span>
              )}
              {risk.organization && risk.regionCode && (
                <span className="text-xs text-gray-400 dark:text-gray-500">|</span>
              )}
              {risk.regionCode && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{risk.regionCode}</span>
              )}
            </div>
          )}

          {/* Title - Use riskEvent if available, otherwise fallback to title */}
          <div className="font-semibold text-gray-900 dark:text-white mt-1">
            <span className="block truncate" title={riskEventValue}>
              {riskEventText}
            </span>
          </div>
          
          {/* Division and Risk Category (replacing Owner) */}
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
            {/* Risk Level - only show if score > 0 and status is not open-risk */}
            {(() => {
              // Don't show if status is open-risk or score is 0 or falsy
              if (riskStatus === 'open-risk' || !risk.score || risk.score <= 0) {
                return null;
              }
              const riskLevel = getRiskLevel(risk.score);
              return riskLevel ? (
                <div>
                  Risk Level: <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskLevel.badgeClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${riskLevel.dotClass}`} />
                    <span>{riskLevel.label}</span>
                  </span>
                </div>
              ) : null;
            })()}
            
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

        {/* Right side: Badge, Score Bar, Remove Button, Evaluate Button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {showRiskLevel && risk.score && risk.score > 0 && riskStatus !== 'open-risk' && <RiskLevelBadge score={risk.score} />}
          {showScoreBar && <RiskScoreBar score={risk.score} className="w-24" />}
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

      {/* Mitigation */}
      {showMitigation && hasMitigation && (
        <div className={`mt-2 text-sm text-gray-600 dark:text-gray-300 ${getMitigationClasses()}`}>
          <span className="font-semibold text-gray-700 dark:text-gray-200">Mitigation:</span> {mitigationText}
        </div>
      )}

      {/* Additional info for Mitigations page */}
      {!showEvaluationMonth && risk.evaluationMonth && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Monthly evaluation: <span className="font-semibold text-gray-700 dark:text-gray-200">{risk.evaluationMonth}</span>
        </div>
      )}
    </div>
  );
}

