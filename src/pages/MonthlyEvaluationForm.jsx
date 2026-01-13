import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EvaluationForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useAuth } from '../context/AuthContext';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus } from '../utils/riskStatus';

export default function MonthlyEvaluationForm() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { risks, updateRisk } = useRisks();

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const evaluator = user?.name || 'Current User';
  const currentScore = risk?.score || 0;

  const handleAccept = (payload) => {
    updateRisk(payload);
    navigate('/evaluations');
  };

  const handleReject = (payload) => {
    updateRisk(payload);
    navigate('/evaluations');
  };

  const handleCancel = () => {
    navigate('/evaluations');
  };

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Monthly Evaluation"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Monthly Evaluation', path: '/evaluations' },
            { label: 'Evaluation Form' },
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

  // Check if risk status is "Planned" or "Not Finished"
  const riskStatus = getRiskStatus(risk);

  if (riskStatus !== 'planned' && riskStatus !== 'not-finished') {
    return (
      <>
        <ContentHeader
          title="Monthly Evaluation"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Monthly Evaluation', path: '/evaluations' },
            { label: 'Evaluation Form' },
          ]}
        />
        <Card title={`Monthly Evaluation - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {riskStatus === 'open-risk' 
                ? 'This risk has not been analyzed yet. Please run Risk Analysis first.'
                : riskStatus === 'analyzed'
                ? 'This risk does not have a mitigation plan yet. Please create a Mitigation Plan first.'
                : 'Monthly evaluation can only be performed on risks with status "Planned" or "Not Finished".'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {riskStatus === 'open-risk' && (
                <button
                  type="button"
                  onClick={() => navigate(`/risks/${risk.id}/risk-analysis`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-clipboard-check" />
                  Analyze Risk
                </button>
              )}
              {(riskStatus === 'analyzed' || riskStatus === 'not-finished') && (
                <button
                  type="button"
                  onClick={() => navigate(`/risks/${risk.id}/mitigation-plan`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-shield-check" />
                  Create Mitigation Plan
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Back
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
        title="Monthly Evaluation"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Monthly Evaluation', path: '/evaluations' },
          { label: 'Evaluation Form' },
        ]}
      />

      <Card
        title={`Monthly Evaluation - ${risk.id}`}
        outline
        color="primary"
        headerExtra={
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={currentScore} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Current: {currentScore}/25</span>
          </div>
        }
      >
        <EvaluationForm
          risk={risk}
          evaluator={evaluator}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
        />
      </Card>
    </>
  );
}
