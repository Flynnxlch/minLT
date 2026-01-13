import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RiskAnalysisForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { computeRiskScore } from '../utils/risk';

export default function InherentRiskEvaluation() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { risks, updateRisk } = useRisks();

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const handleSubmit = (payload) => {
    updateRisk(payload);
    navigate('/risks');
  };

  const handleCancel = () => {
    navigate('/risks');
  };

  // Calculate inherent score for display in header
  const inherentScore = useMemo(() => {
    if (!risk) return 0;
    return computeRiskScore({ 
      possibility: risk.possibilityType || 3, 
      impactLevel: risk.impactLevel || 4 
    });
  }, [risk]);

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Risk Analysis"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Risk Register', path: '/risks' },
            { label: 'Risk Analysis' },
          ]}
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Risk not found.</p>
          </div>
        </Card>
      </>
    );
  }

  // Check if risk status is "Open Risk" (score = 0)
  const isOpenRisk = (risk.score || 0) <= 0;
  if (!isOpenRisk) {
    return (
      <>
        <ContentHeader
          title="Risk Analysis"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Risk Register', path: '/risks' },
            { label: 'Risk Analysis' },
          ]}
        />
        <Card title={`Risk Analysis - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              This risk has already been analyzed. Risk analysis can only be performed on risks with status <span className="font-semibold">Open Risk</span>.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/risks')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Back to Risk Register
              </button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <ContentHeader
        title="Risk Analysis"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Risk Register', path: '/risks' },
          { label: 'Risk Analysis' },
        ]}
      />

      <Card
        title={`Risk Analysis - ${risk.id}`}
        outline
        color="primary"
        headerExtra={
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={inherentScore} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Score: {inherentScore}/25
            </span>
          </div>
        }
      >
        <RiskAnalysisForm
          risk={risk}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Card>
    </>
  );
}
