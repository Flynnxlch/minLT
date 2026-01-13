import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import RiskScoreBar from '../components/risk/RiskScoreBar';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../utils/riskStatus';

const TABS = [
  { id: 'identified', label: 'Risk Identified', icon: 'bi-clipboard-data' },
  { id: 'analysis', label: 'Risk Analysis', icon: 'bi-graph-up' },
  { id: 'planning', label: 'Mitigation Planning', icon: 'bi-shield-check' },
  { id: 'evaluation', label: 'Monthly Evaluation', icon: 'bi-calendar-check' },
];

export default function RiskDetail() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { risks } = useRisks();
  const [activeTab, setActiveTab] = useState('identified');

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Risk Detail"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'All Risks', path: '/risks' },
            { label: 'Detail' },
          ]}
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Risk not found.</p>
            <button
              type="button"
              onClick={() => navigate('/risks')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0c9361] text-white rounded-lg hover:bg-[#0a7a4f] transition-colors"
            >
              Back to All Risks
            </button>
          </div>
        </Card>
      </>
    );
  }

  const riskStatus = getRiskStatus(risk);
  const statusConfig = RISK_STATUS_CONFIG[riskStatus] || RISK_STATUS_CONFIG['open-risk'];

  // Determine which tabs to show based on status
  const hasAnalysis = ['analyzed', 'planned', 'mitigated', 'not-finished'].includes(riskStatus);
  const hasPlanning = ['planned', 'mitigated', 'not-finished'].includes(riskStatus);
  const hasEvaluation = ['mitigated', 'not-finished'].includes(riskStatus);

  const availableTabs = TABS.filter((tab) => {
    if (tab.id === 'identified') return true;
    if (tab.id === 'analysis') return hasAnalysis;
    if (tab.id === 'planning') return hasPlanning;
    if (tab.id === 'evaluation') return hasEvaluation;
    return false;
  });

  // Ensure active tab is available
  if (!availableTabs.find((t) => t.id === activeTab)) {
    setActiveTab('identified');
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identified':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Event</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.riskEvent || risk.title || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.target || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Activity</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.activity || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Cause</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.riskCause || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Category</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.category || risk.riskCategory || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Impact Explanation</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.riskImpactExplanation || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Impact (Quantitative)</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.quantitativeRiskImpact || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Organization</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.organization || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Region Code</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.regionCode || 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Impact Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.impactDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Impact Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.impact || risk.impactLevel || 0} / 5</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Probability Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.possibilityDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Probability Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.possibility || risk.possibilityType || 0} / 5</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Risk Score</label>
              <div className="flex items-center gap-4">
                <RiskLevelBadge score={risk.score || 0} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{risk.score || 0} / 25</span>
                <div className="flex-1 max-w-md">
                  <RiskScoreBar score={risk.score || 0} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mitigation Plan</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.mitigationPlan || risk.mitigation || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Residual Impact Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.residualImpactDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Residual Impact Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.residualImpactLevel || 0} / 5</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Residual Probability Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.residualProbabilityDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Residual Probability Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.residualProbabilityType || 0} / 5</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluation Month</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.evaluationMonth || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Division</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.division || 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'evaluation':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluation Status</label>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{risk.evaluationStatus || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluation Date</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.evaluationDate || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluator</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.evaluator || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluation Notes</label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.evaluationNotes || 'N/A'}</p>
            </div>
            {risk.evaluatorNote && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Evaluator Note</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.evaluatorNote}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Impact Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.currentImpactDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Impact Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.currentImpactLevel || 0} / 5</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Probability Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.currentProbabilityDescription || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Probability Level</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.currentProbabilityType || 0} / 5</p>
              </div>
            </div>
            {risk.lastEvaluatedAt && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Last Evaluated</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(risk.lastEvaluatedAt).toLocaleString('en-GB')}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <ContentHeader
        title={`Risk Detail - ${risk.id}`}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'All Risks', path: '/risks' },
          { label: risk.id || 'Detail' },
        ]}
      />

      {/* Risk Summary Card */}
      <Card className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {risk.riskEvent || risk.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                {statusConfig.label}
              </span>
              {risk.organization && <span>· {risk.organization}</span>}
              {risk.location && <span>· {risk.location}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskLevelBadge score={risk.score || 0} />
            <button
              type="button"
              onClick={() => navigate('/risks')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation (Browser-style) */}
      <div className="flex flex-wrap items-end gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-(--color-card-bg-dark) text-[#0c9361] border-t-2 border-[#0c9361]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <i className={`${tab.icon} mr-1.5 sm:mr-2`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c9361]"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        {renderTabContent()}
      </Card>
    </>
  );
}

