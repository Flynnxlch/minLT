import Chart from 'chart.js/auto';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Parse date from API (ISO string or Date). Returns null if invalid. */
function parseDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthStart(offsetMonths = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthEnd(startDate) {
  const d = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function fmtMonthTick(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);
  const year = new Intl.DateTimeFormat('en-GB', { year: '2-digit' }).format(d);
  return `${month} '${year}`;
}

function fmtDateTitle(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(d);
}

function fmtDateTick(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);
  return `${day} ${month}`;
}

export default function RiskStatusTrendChart({ risks = [], height = 220, period = '6months' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Keep chart in sync with realtime (same as Indeks Risiko Gapura: per-day refresh for currentMonth, per-month for 6months)
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  useEffect(() => {
    const interval = period === 'currentMonth' ? 60_000 : 30_000;
    const id = setInterval(() => {
      const d = new Date();
      const key = period === 'currentMonth'
        ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        : `${d.getFullYear()}-${d.getMonth()}`;
      setMonthKey((prev) => (prev === key ? prev : key));
    }, interval);
    return () => clearInterval(id);
  }, [period]);

  // Point-in-time logic: All Risk = risks with created_at <= end; status at that date uses analyzedAt / plannedAt so chart shows wave (e.g. Jan 1: 3 analyzed, Jan 2: 2 analyzed after one moves to planned)
  const { labels, totalCount, analyzedCount, plannedCount } = useMemo(() => {
    const now = new Date();
    let labelsLocal = [];

    if (period === 'currentMonth') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.getDate();
      labelsLocal = Array.from({ length: today }, (_, i) => {
        const d = new Date(currentYear, currentMonth, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    } else {
      labelsLocal = [5, 4, 3, 2, 1, 0].map((n) => monthStart(n));
    }

    const total = [];
    const analyzed = [];
    const planned = [];

    for (let index = 0; index < labelsLocal.length; index++) {
      const start = labelsLocal[index];
      let end;
      if (period === 'currentMonth') {
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        if (index === labelsLocal.length - 1) {
          end = now;
        }
      } else {
        const isCurrentMonth = index === labelsLocal.length - 1;
        end = isCurrentMonth ? now : monthEnd(start);
      }

      // All Risk at this point in time: only risks that existed then (created_at <= end). Past buckets do not follow new data.
      const active = risks.filter((r) => {
        const created = parseDate(r.createdAt);
        if (!created) return false;
        return created <= end;
      });

      total.push(active.length);

      // Status at end date using timestamps (so chart is dynamic: e.g. 3 analyzed on Jan 1, 2 on Jan 2 when one becomes planned)
      // Analyzed at end = existed by end, was analyzed by end (analyzedAt <= end), and not yet planned by end (no plannedAt or plannedAt > end)
      let analyzedAtEnd = 0;
      let plannedAtEnd = 0;
      for (const r of active) {
        const analyzedAt = parseDate(r.analyzedAt);
        const plannedAt = parseDate(r.plannedAt);
        const wasPlannedByEnd = plannedAt != null && plannedAt <= end;
        const wasAnalyzedByEnd = analyzedAt != null && analyzedAt <= end;
        if (wasPlannedByEnd) {
          plannedAtEnd += 1;
        } else if (wasAnalyzedByEnd) {
          analyzedAtEnd += 1;
        }
      }
      analyzed.push(analyzedAtEnd);
      planned.push(plannedAtEnd);
    }

    return { labels: labelsLocal, totalCount: total, analyzedCount: analyzed, plannedCount: planned };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risks, period, monthKey]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const maxVal = Math.max(
      ...totalCount,
      ...analyzedCount,
      ...plannedCount,
      1
    );
    const suggestedMax = maxVal <= 1 ? 5 : Math.ceil(maxVal * 1.2);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Risiko',
            data: totalCount,
            borderColor: '#6c757d',
            backgroundColor: 'rgba(108, 117, 125, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
            order: 0,
          },
          {
            label: 'Analyzed',
            data: analyzedCount,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
            order: 1,
          },
          {
            label: 'Planned',
            data: plannedCount,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(33, 37, 41, 0.92)',
            padding: 10,
            displayColors: true,
            callbacks: {
              title: (items) => {
                const idx = items?.[0]?.dataIndex ?? 0;
                if (period === 'currentMonth') {
                  const d = labels[idx];
                  return new Intl.DateTimeFormat('en-GB', { 
                    day: 'numeric',
                    month: 'short', 
                    year: 'numeric' 
                  }).format(d);
                }
                return fmtDateTitle(labels[idx]);
              },
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
          axis: 'x',
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#6c757d',
              callback: (_value, index) => {
                if (period === 'currentMonth') {
                  return fmtDateTick(labels[index]);
                }
                return fmtMonthTick(labels[index]);
              },
              maxTicksLimit: period === 'currentMonth' ? 31 : undefined,
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax,
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { color: '#6c757d', precision: 0 },
            title: {
              display: true,
              text: 'Count',
              color: '#6c757d',
              font: { size: 12, weight: '600' },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [labels, totalCount, analyzedCount, plannedCount, period]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}


