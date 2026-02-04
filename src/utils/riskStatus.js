/**
 * Calculate risk status based on risk data
 * 
 * Status flow:
 * - "Open Risk" - when score is 0/null (not analyzed yet)
 * - "Analyzed" - when risk-analysis is completed (has score > 0, but no mitigation plan)
 * - "Planned" - when mitigation plan is created (has mitigationPlan)
 * - "Mitigated" - when evaluation keberhasilan is completed and effective (evaluationStatus = 'effective')
 * - "Need Improvement" - when evaluation keberhasilan is completed but not effective (evaluationStatus != 'effective')
 */
export function getRiskStatus(risk) {
  if (!risk) return 'open-risk';

  const score = risk.score || 0;
  const hasMitigationPlan = (risk.mitigationPlan || risk.mitigation || '').trim().length > 0;
  const evaluationStatus = risk.evaluationStatus;

  // Open Risk: score is 0/null (not analyzed)
  if (score <= 0) {
    return 'open-risk';
  }

  // If has evaluation status, check if mitigated or need improvement
  if (evaluationStatus) {
    if (evaluationStatus === 'effective') {
      return 'mitigated';
    } else {
      return 'not-finished';
    }
  }

  // Planned: has mitigation plan but no evaluation yet
  if (hasMitigationPlan) {
    return 'planned';
  }

  // Analyzed: has score but no mitigation plan
  return 'analyzed';
}

export const RISK_STATUS_CONFIG = {
  'open-risk': {
    label: 'Open Risk',
    badgeClass: 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200',
    description: 'Risk has not been analyzed yet',
  },
  'analyzed': {
    label: 'Analyzed',
    badgeClass: 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    description: 'Risk analysis completed',
  },
  'planned': {
    label: 'Planned',
    badgeClass: 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
    description: 'Mitigation plan created',
  },
  'mitigated': {
    label: 'Mitigated',
    badgeClass: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300',
    description: 'Mitigation completed and effective',
  },
  'not-finished': {
    label: 'Need Improvement',
    badgeClass: 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'Mitigation not yet effective',
  },
};

