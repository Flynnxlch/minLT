import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OtherRequest, UserList, UserRequest } from '../components/adm';
import DonutChart from '../components/charts/DonutChart';
import RiskStatusTrendChart from '../components/charts/RiskStatusTrendChart';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import RiskCardExpandable from '../components/risk/RiskCardExpandable';
import RiskMatrix from '../components/risk/RiskMatrix';
import RiskScoreBar from '../components/risk/RiskScoreBar';
import ContentHeader from '../components/ui/ContentHeader';
import { Card, SmallBox } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import {
  getRiskSummary,
  RISK_LEVELS,
  sortRisksByScoreDesc,
} from '../utils/risk';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../utils/riskStatus';

function monthNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const STATUS_COLORS = {
  'open-risk': '#adb5bd',
  analyzed: '#0d6efd',
  planned: '#ffc107',
  mitigated: '#20c997',
  'not-finished': '#fd7e14',
};

const REGION_COLORS = ['#0d6efd', '#20c997', '#ffc107', '#d63384', '#6f42c1', '#adb5bd', '#dc3545', '#0dcaf0'];

export default function Dashboard() {
  const { risks } = useRisks();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'risk';

  const summary = useMemo(() => getRiskSummary(risks), [risks]);
  const topRisks = useMemo(() => sortRisksByScoreDesc(risks).slice(0, 3), [risks]);

  const dueThisMonth = useMemo(() => {
    const m = monthNow();
    return risks.filter((r) => r.evaluationMonth === m).length;
  }, [risks]);

  const mitigationCoverage = useMemo(() => {
    if (!risks.length) return 0;
    const withMitigation = risks.filter((r) => (r.mitigation || '').trim().length > 0).length;
    return Math.round((withMitigation / risks.length) * 100);
  }, [risks]);

  const statusSummary = useMemo(() => {
    const order = ['open-risk', 'analyzed', 'planned', 'mitigated', 'not-finished'];
    const counts = new Map(order.map((k) => [k, 0]));
    for (const r of risks) {
      const s = getRiskStatus(r);
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    return order.map((key) => ({
      key,
      label: RISK_STATUS_CONFIG[key]?.label || key,
      count: counts.get(key) || 0,
      color: STATUS_COLORS[key] || '#6c757d',
    }));
  }, [risks]);

  const statusDonut = useMemo(() => {
    return {
      labels: statusSummary.map((x) => x.label),
      data: statusSummary.map((x) => x.count),
      colors: statusSummary.map((x) => x.color),
    };
  }, [statusSummary]);

  const regionSummary = useMemo(() => {
    const counts = new Map();
    for (const r of risks) {
      const key = String(r.regionCode || 'N/A').toUpperCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  const regionDonut = useMemo(() => {
    return {
      labels: regionSummary.map((x) => x.label),
      data: regionSummary.map((x) => x.count),
      colors: regionSummary.map((_, idx) => REGION_COLORS[idx % REGION_COLORS.length]),
    };
  }, [regionSummary]);

  // User Dashboard View
  if (mode === 'user') {
    return (
      <>
        <ContentHeader
          title="User Dashboard"
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'User Dashboard' },
          ]}
        />

        <div className="space-y-4">
          <UserList />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <UserRequest />
            </div>
            <div className="lg:col-span-6">
              <OtherRequest />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Risk Dashboard View (default)
  return (
    <>
      <ContentHeader
        title="Risk Dashboard"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Risk Dashboard' },
        ]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SmallBox title="Total Risks" value={String(summary.total)} icon="bi-clipboard-data" color="primary" link="/risks" linkText="Open register" />
        <SmallBox title="High + Extreme" value={String(summary.highPlus)} icon="bi-exclamation-triangle-fill" color="danger" link="/risks" linkText="Review priorities" />
        <SmallBox title="Mitigation Coverage" value={String(mitigationCoverage)} suffix="%" icon="bi-shield-check" color="success" link="/mitigations" linkText="Track actions" />
        <SmallBox title="Evaluations Due (This Month)" value={String(dueThisMonth)} icon="bi-calendar-check" color="warning" link="/evaluations" linkText="Plan reviews" />
      </div>

      {/* Monthly Recap Report (Open vs Planned) + Goal Completion (Region/Cabang) */}
      <Card
        title="Monthly Recap Report"
        collapsible
        headerExtra={
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0d6efd]" />
              Status Open
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#20c997]" />
              Status Planned
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Status Open vs Status Planned (last 6 months)
            </p>
            <RiskStatusTrendChart risks={risks} height={220} />
          </div>
          <div className="lg:col-span-4">
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
              Goal Completion
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              Region/Cabang distribution
            </p>
            {summary.total > 0 ? (
              <DonutChart labels={regionDonut.labels} data={regionDonut.data} colors={regionDonut.colors} height={220} />
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No risks yet.</div>
            )}
          </div>
        </div>
        {/* Region Legend - justified below charts */}
        {summary.total > 0 && regionSummary.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-(--color-card-border-dark)">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              {regionSummary.map((x, idx) => (
                <div key={x.key} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: REGION_COLORS[idx % REGION_COLORS.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{x.label}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{x.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Global Risk Index"
            collapsible
            headerExtra={
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0d6efd]" />
                  Avg score
                </span>
                <span className="inline-flex items-center gap-2" title="High+ = Menengah-Tinggi (16-19) + Tinggi (20-25) risk count">
                  <span className="h-2 w-2 rounded-full bg-[#dc3545]" />
                  High+ count
                </span>
              </div>
            }
          >
            <RiskTrendChart risks={risks} height={300} />
          </Card>

          <Card title="Risk Status Distribution" outline color="primary" collapsible>
            {summary.total > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <DonutChart labels={statusDonut.labels} data={statusDonut.data} colors={statusDonut.colors} height={220} />
                <div className="space-y-2">
                  {statusSummary.map((x) => (
                    <div key={x.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: x.color }} />
                        <span className="truncate text-gray-700 dark:text-gray-200">{x.label}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{x.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No risks yet.</div>
            )}
          </Card>

          {/* Risk Level Distribution and Average Risk Score (moved from Reports) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7">
              <Card title="Risk Level Distribution" collapsible>
                <div className="space-y-3">
                  {RISK_LEVELS.map((lvl) => {
                    const count = summary.counts[lvl.key] || 0;
                    const denom = summary.assessedTotal || 0;
                    const pct = denom ? Math.round((count / denom) * 100) : 0;
                    return (
                      <div key={lvl.key} className="flex items-center gap-2 sm:gap-3">
                        <div className="w-20 sm:w-28 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{lvl.label}</div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className={lvl.barClass} style={{ width: `${pct}%`, height: '100%' }} />
                          </div>
                        </div>
                        <div className="w-16 sm:w-24 text-right text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                          {count} ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="xl:col-span-5">
              <Card title="Average Risk Score" collapsible>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-semibold text-gray-700 dark:text-gray-200">{summary.avgScore}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Avg score across all risks</div>
                  </div>
                  <RiskScoreBar score={summary.avgScore} className="w-full sm:w-48" />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Risk Matrix"
            collapsible
            color="primary"
            gradient
            footer={
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-900 dark:text-white/90">
                <span className="font-semibold">Legend:</span>
                {RISK_LEVELS.map((lvl) => (
                  <span key={lvl.key} className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lvl.mapColor }} />
                    {lvl.label} ({lvl.min}-{lvl.max})
                  </span>
                ))}
              </div>
            }
          >
            <div className="h-[260px] bg-white/10 dark:bg-gray-800/20 rounded-lg overflow-hidden border border-white/20 dark:border-gray-700/30">
              <RiskMatrix risks={risks} />
            </div>
          </Card>

          <Card title="Risk List (sorted by score)" collapsible>
            <div className="space-y-3">
              {topRisks.map((r) => (
                <RiskCardExpandable
                  key={r.id}
                  risk={r}
                  showRiskLevel={false}
                  showScoreBar={false}
                  showLocation={true}
                  showEvaluationMonth={true}
                />
              ))}
              {!topRisks.length && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No risks yet. Add one using "New Risk Entry".</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

