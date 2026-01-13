import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RiskCard from '../components/risk/RiskCard';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { sortRisksByScoreDesc } from '../utils/risk';
import { getRiskStatus } from '../utils/riskStatus';

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function MonthlyEvaluations() {
  const { risks } = useRisks();

  const { list, isFallback } = useMemo(() => {
    const m = monthNow();
    const planned = sortRisksByScoreDesc(risks).filter((r) => {
      const status = getRiskStatus(r);
      return status === 'planned' || status === 'not-finished';
    });
    const dueThisMonth = planned.filter((r) => r.evaluationMonth === m);

    // If nothing matches the strict "due this month" criteria, still show planned risks
    // so the page never looks empty when there are risks ready to evaluate.
    const fallback = dueThisMonth.length === 0 && planned.length > 0;
    return { list: dueThisMonth.length ? dueThisMonth : planned, isFallback: fallback };
  }, [risks]);

  return (
    <>
      <ContentHeader
        title="Monthly Evaluation"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Monthly Evaluation' },
        ]}
      />

      <Card title={isFallback ? 'Risks Ready for Monthly Evaluation' : 'Due This Month (Planned / Not Finished)'} collapsible>
        <div className="space-y-3">
          {isFallback && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              No risks matched the current-month schedule. Showing all risks with status <span className="font-semibold">Planned</span> / <span className="font-semibold">Not Finished</span>.
            </div>
          )}
          {list.map((r) => (
            <div key={r.id} className="space-y-3">
              <RiskCard
                risk={r}
                showLocation={true}
                showEvaluationMonth={true}
              />
              <div className="flex justify-end">
                <Link
                  to={`/risks/${r.id}/evaluation`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors shadow-sm"
                  title="Evaluate Mitigation"
                >
                  <i className="bi bi-clipboard-check"></i>
                  <span className="hidden sm:inline">Evaluate</span>
                </Link>
              </div>
            </div>
          ))}
          {!list.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No risks ready for monthly evaluation yet. Create a mitigation plan first.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}


