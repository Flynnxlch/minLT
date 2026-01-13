import { computeRiskScore, formatRiskId, getRiskLevel } from '../utils/risk';

const today = new Date();
const monthsAgo = (n) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - n);
  d.setDate(12);
  return d.toISOString();
};

/**
 * Frontend-only seed data (Risk Register)
 * possibility: 1..5
 * impact: 1..5
 * score: 1..25 (possibility * impact)
 */
export const SAMPLE_RISKS = [
  {
    id: formatRiskId(1),
    title: 'Supplier disruption for critical components',
    category: 'Supply Chain',
    owner: 'Operations',
    regionCode: 'ID',
    location: 'Jakarta',
    possibility: 4,
    possibilityType: 4,
    impact: 5,
    impactLevel: 5,
    likelihood: 4, // Keep for backward compatibility
    mitigation: 'Dual-source critical parts; maintain 8-week safety stock for Tier-1 items.',
    evaluationMonth: '2026-01',
    createdAt: monthsAgo(5),
  },
  {
    id: formatRiskId(2),
    title: 'Cyber incident affecting customer data confidentiality',
    category: 'Information Security',
    owner: 'IT Security',
    regionCode: 'US',
    location: 'New York',
    possibility: 3,
    possibilityType: 3,
    impact: 5,
    impactLevel: 5,
    likelihood: 3, // Keep for backward compatibility
    mitigation: 'Enforce MFA, quarterly phishing drills, and harden SSO with conditional access.',
    evaluationMonth: '2026-01',
    createdAt: monthsAgo(4),
  },
  {
    id: formatRiskId(3),
    title: 'Regulatory non-compliance in reporting timelines',
    category: 'Compliance',
    owner: 'Legal',
    regionCode: 'GB',
    location: 'London',
    possibility: 3,
    possibilityType: 3,
    impact: 4,
    impactLevel: 4,
    likelihood: 3, // Keep for backward compatibility
    mitigation: 'Automate regulatory calendar reminders; define RACI for filings and approvals.',
    evaluationMonth: '2026-01',
    createdAt: monthsAgo(3),
  },
  {
    id: formatRiskId(4),
    title: 'Service outage due to single-region cloud dependency',
    category: 'Business Continuity',
    owner: 'Platform',
    regionCode: 'JP',
    location: 'Tokyo',
    possibility: 5,
    possibilityType: 5,
    impact: 5,
    impactLevel: 5,
    likelihood: 5, // Keep for backward compatibility
    mitigation: 'Implement multi-region failover and run quarterly DR tests with RTO/RPO targets.',
    evaluationMonth: '2026-01',
    createdAt: monthsAgo(2),
  },
  {
    id: formatRiskId(5),
    title: 'Key staff turnover impacting delivery timelines',
    category: 'People',
    owner: 'PMO',
    regionCode: 'AU',
    location: 'Sydney',
    possibility: 2,
    possibilityType: 2,
    impact: 4,
    impactLevel: 4,
    likelihood: 2, // Keep for backward compatibility
    mitigation: 'Create succession plan; rotate knowledge ownership; keep onboarding playbooks updated.',
    evaluationMonth: '2026-01',
    createdAt: monthsAgo(1),
  },
].map((r) => {
  const score = computeRiskScore(r);
  const level = getRiskLevel(score);
  return { ...r, score, level: level.label };
});


