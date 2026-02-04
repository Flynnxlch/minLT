import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RiskCard from '../components/risk/RiskCard';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus } from '../utils/riskStatus';

/**
 * Open Risks: risks that are Open Risk (newly created, not yet analyzed).
 * Clicking a card opens the Analyze Risk form (same as "Analyze" button on All Risks).
 */
export default function OpenRisks() {
  const { risks } = useRisks();
  const navigate = useNavigate();

  // Only risks with status "open-risk" (score 0 / not analyzed yet), newest first
  const openRisks = useMemo(() => {
    return risks
      .filter((r) => getRiskStatus(r) === 'open-risk')
      .sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });
  }, [risks]);

  return (
    <>
      <ContentHeader
        title="Risiko Belum Dianalisis"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Risiko Belum Dianalisis' },
        ]}
      />

      <Card
        title="Open Risk"
        headerExtra={
          <div className="flex items-center gap-2">
            <Link
              to="/risks/new"
              className="inline-flex items-center rounded-lg bg-[#0d6efd] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <i className="bi bi-plus-circle mr-2" />
              Risiko Baru
            </Link>
          </div>
        }
      >
        <div className="space-y-3">
          {openRisks.map((r) => (
            <RiskCard
              key={r.id}
              risk={r}
              showLocation={true}
              showEvaluationMonth={false}
              onClick={() => navigate(`/risks/${r.id}/risk-analysis`)}
            />
          ))}
          {!openRisks.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada risiko Open Risk. Risiko yang baru dibuat akan muncul di sini. Klik risiko di{' '}
              <Link className="text-blue-600 dark:text-blue-400 hover:underline" to="/risks">
                Semua Risiko
              </Link>{' '}
              lalu gunakan tombol &quot;Analyze&quot;, atau{' '}
              <Link className="text-blue-600 dark:text-blue-400 hover:underline" to="/risks/new">
                buat risiko baru
              </Link>
              .
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
