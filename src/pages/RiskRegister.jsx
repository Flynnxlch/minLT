import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RiskCardExpandable from '../components/risk/RiskCardExpandable';
import ContentHeader from '../components/ui/ContentHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { RISK_LEVELS, getRiskLevel, sortRisksByScoreDesc } from '../utils/risk';

export default function RiskRegister() {
  const { risks, removeRisk } = useRisks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get levelKey from URL params, default to 'all'
  const levelKey = useMemo(() => {
    const lvl = searchParams.get('level');
    if (!lvl || lvl === 'all') return 'all';
    if (RISK_LEVELS.some((x) => x.key === lvl)) return lvl;
    return 'all';
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = sortRisksByScoreDesc(risks);

    return base.filter((r) => {
      const lvl = getRiskLevel(r.score);
      const matchesLevel = levelKey === 'all' ? true : (lvl ? lvl.key === levelKey : false);
      if (!matchesLevel) return false;
      if (!q) return true;
      const hay = `${r.id} ${r.title} ${r.category} ${r.owner} ${r.location} ${r.regionCode}`.toLowerCase();
      return hay.includes(q);
    });
  }, [risks, query, levelKey]);

  const handleRemoveRisk = async (riskId) => {
    setIsLoading(true);
    // Simulate async operation with delay
    await new Promise((resolve) => setTimeout(resolve, 280));
    removeRisk(riskId);
    setIsLoading(false);
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <>
      <ContentHeader
        title="Risk"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Risk Register' },
        ]}
      />

      <Card
        title="All Risks"
        collapsible
        headerExtra={
          <div className="flex items-center gap-2">
            <Link
              to="/risks/new"
              className="inline-flex items-center rounded-lg bg-[#0d6efd] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <i className="bi bi-plus-circle mr-2" />
              New Risk
            </Link>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          <div className="sm:col-span-7">
            <input
              className={inputBase}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, title, category, owner, location..."
            />
          </div>
          <div className="sm:col-span-5">
            <select
              className={inputBase}
              value={levelKey}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'all') {
                  searchParams.delete('level');
                  setSearchParams(searchParams, { replace: true });
                } else {
                  setSearchParams({ level: next }, { replace: true });
                }
              }}
            >
              <option value="all">All levels</option>
              {RISK_LEVELS.map((lvl) => (
                <option key={lvl.key} value={lvl.key}>
                  {lvl.label} ({lvl.min}-{lvl.max})
                </option>
              ))}
            </select>
          </div>
        </div>

        <LoadingSpinner isLoading={isLoading} delay={250} overlay={true}>
          <div className="space-y-3">
            {filtered.map((r) => (
              <RiskCardExpandable
                key={r.id}
                risk={r}
                showRiskLevel={true}
                showScoreBar={true}
                showRemoveButton={true}
                showEvaluateButton={true}
                showLocation={true}
                showEvaluationMonth={true}
                clickable={true}
                onRemove={handleRemoveRisk}
              />
            ))}

            {!filtered.length && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No risks found. <Link className="text-blue-600 dark:text-blue-400 hover:underline transition-colors" to="/risks/new">Create a new risk</Link>.
              </div>
            )}
          </div>
        </LoadingSpinner>
      </Card>
    </>
  );
}


