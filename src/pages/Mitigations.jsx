import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import RiskCard from '../components/risk/RiskCard';
import { useRisks } from '../context/RiskContext';
import { sortRisksByScoreDesc } from '../utils/risk';
import { getRiskStatus } from '../utils/riskStatus';

export default function Mitigations() {
  const { risks } = useRisks();
  const navigate = useNavigate();

  // Only show risks with status "Analyzed" or "Not Finished" (can create mitigation plan)
  const eligible = useMemo(() => {
    return sortRisksByScoreDesc(risks).filter((r) => {
      const status = getRiskStatus(r);
      return status === 'analyzed' || status === 'not-finished';
    });
  }, [risks]);

  return (
    <>
      <ContentHeader
        title="Mitigation Plans"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Mitigation Plans' },
        ]}
      />

      <Card title="Mitigation Overview" collapsible>
        <div className="space-y-3">
          {eligible.map((r) => (
            <RiskCard
              key={r.id}
              risk={r}
              showLocation={false}
              showEvaluationMonth={false}
              showMitigation={true}
              onClick={() => navigate(`/risks/${r.id}/mitigation-plan`)}
            />
          ))}
          {!eligible.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No assessed risks yet. Analyze a risk first, then create its mitigation plan.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}


