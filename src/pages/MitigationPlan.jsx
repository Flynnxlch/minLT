import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MitigationPlanForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus } from '../utils/riskStatus';

export default function MitigationPlan() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { risks, updateRisk } = useRisks();

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const handleSubmit = (payload) => {
    updateRisk(payload);
    navigate('/mitigations');
  };

  const handleCancel = () => {
    navigate('/mitigations');
  };

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Mitigation Plan"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Mitigation Plans', path: '/mitigations' },
            { label: 'Mitigation Plan' },
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

  // Check if risk status is "Analyzed" or "Not Finished"
  const riskStatus = getRiskStatus(risk);
  const canCreateMitigation = riskStatus === 'analyzed' || riskStatus === 'not-finished';

  if (!canCreateMitigation) {
    return (
      <>
        <ContentHeader
          title="Mitigation Plan"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'Mitigation Plans', path: '/mitigations' },
            { label: 'Mitigation Plan' },
          ]}
        />
        <Card title={`Mitigation Plan - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {riskStatus === 'open-risk' 
                ? 'This risk has not been analyzed yet. Please run Risk Analysis first.'
                : 'Mitigation plan can only be created for risks with status "Analyzed" or "Not Finished".'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {riskStatus === 'open-risk' && (
                <Link
                  to={`/risks/${risk.id}/risk-analysis`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-clipboard-check" />
                  Analyze Risk
                </Link>
              )}
              <button
                type="button"
                onClick={() => navigate('/mitigations')}
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
        title="Mitigation Plan"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Mitigation Plans', path: '/mitigations' },
          { label: 'Mitigation Plan' },
        ]}
      />

      <Card
        title={`Mitigation Plan - ${risk.id}`}
        outline
        color="primary"
        headerExtra={
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={risk.score} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Score: {risk.score}/25</span>
          </div>
        }
      >
        <MitigationPlanForm
          risk={risk}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Card>
    </>
  );
}
