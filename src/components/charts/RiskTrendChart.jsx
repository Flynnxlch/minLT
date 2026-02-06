import Chart from 'chart.js/auto';
import { useEffect, useMemo, useRef, useState } from 'react';

const AXIS_TICK_COLOR = '#6b7280';
const GRID_LINE_COLOR = 'rgba(156, 163, 175, 0.22)';
const AXIS_BORDER_COLOR = 'rgba(156, 163, 175, 0.40)';
const CROSSHAIR_COLOR = 'rgba(156, 163, 175, 0.45)';

const crosshairPlugin = {
  id: 'crosshairLine',
  afterDraw(chart) {
    const { tooltip, ctx, chartArea } = chart;
    if (!tooltip || !tooltip.getActiveElements().length) return;
    const { top, bottom } = chartArea;
    const x = tooltip.caretX;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = CROSSHAIR_COLOR;
    ctx.stroke();
    ctx.restore();
  },
};

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

export default function RiskTrendChart({ risks = [], height = 300, period = '6months' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Keep chart month-window in sync with the user's realtime clock (handles month rollover / manual clock changes)
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  useEffect(() => {
    // For currentMonth mode, update more frequently (every minute) to catch day changes
    // For 6months mode, update every 30 seconds is sufficient
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

  const { labels, currentRiskRatio, inherentRiskRatio, residualRiskRatio } = useMemo(() => {
    const now = new Date();
    let labelsLocal = [];
    
    if (period === 'currentMonth') {
      // Generate labels for current month: from day 1 to today
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.getDate();
      
      labelsLocal = Array.from({ length: today }, (_, i) => {
        const d = new Date(currentYear, currentMonth, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    } else {
      // Generate 6 months: from 5 months ago to current month (0 = current month)
      labelsLocal = [5, 4, 3, 2, 1, 0].map((n) => monthStart(n));
    }

    const currentRatio = labelsLocal.map((startDate, index) => {
      let end;
      if (period === 'currentMonth') {
        // For current month mode, end is the current date/time for each day
        end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        // If this is today, use current time
        if (index === labelsLocal.length - 1) {
          end = now;
        }
      } else {
        // For 6 months mode, use end of month for past months, current time for current month
        const isCurrentMonth = index === labelsLocal.length - 1;
        end = isCurrentMonth ? now : monthEnd(startDate);
      }

      // All Risk at this point in time: only risks with created_at <= end (from DB). Past buckets do not follow new data; chart shows dynamic wave.
      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });
      const assessed = active.filter((r) => (r.currentScore || 0) > 0);
      if (!assessed.length) return 0;
      const sum = assessed.reduce((acc, r) => acc + (r.currentScore || 0), 0);
      return Math.round((sum / assessed.length) * 10) / 10;
    });

    // Calculate Inherent Risk Ratio: average of Total Inherent Score
    const inherentRatio = labelsLocal.map((startDate, index) => {
      let end;
      if (period === 'currentMonth') {
        // For current month mode, end is the current date/time for each day
        end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        // If this is today, use current time
        if (index === labelsLocal.length - 1) {
          end = now;
        }
      } else {
        // For 6 months mode, use end of month for past months, current time for current month
        const isCurrentMonth = index === labelsLocal.length - 1;
        end = isCurrentMonth ? now : monthEnd(startDate);
      }

      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });

      // Filter risks with inherent score > 0
      const withInherentScore = active.filter((r) => {
        const inherentScore = r.inherentScore || 0;
        return inherentScore > 0;
      });
      
      if (!withInherentScore.length) return 0;
      
      // Calculate average of inherent scores
      const sum = withInherentScore.reduce((acc, r) => acc + (r.inherentScore || 0), 0);
      return Math.round((sum / withInherentScore.length) * 10) / 10;
    });

    // Calculate Residual Risk Ratio: average of residual score (supports legacy final field)
    const residualRatio = labelsLocal.map((startDate, index) => {
      let end;
      if (period === 'currentMonth') {
        end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        if (index === labelsLocal.length - 1) {
          end = now;
        }
      } else {
        const isCurrentMonth = index === labelsLocal.length - 1;
        end = isCurrentMonth ? now : monthEnd(startDate);
      }

      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });

      const withResidualScore = active.filter((r) => {
        const residualScore = r.residualScore || r.residualScoreFinal || 0;
        return residualScore > 0;
      });

      if (!withResidualScore.length) return 0;

      const sum = withResidualScore.reduce(
        (acc, r) => acc + (r.residualScore || r.residualScoreFinal || 0),
        0,
      );
      return Math.round((sum / withResidualScore.length) * 10) / 10;
    });

    return {
      labels: labelsLocal,
      currentRiskRatio: currentRatio,
      inherentRiskRatio: inherentRatio,
      residualRiskRatio: residualRatio,
    };
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

    // Register plugin only once to avoid duplicate registrations
    if (!Chart.registry.plugins.get('crosshairLine')) {
      Chart.register(crosshairPlugin);
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Current Risk Ratio',
            data: currentRiskRatio,
            yAxisID: 'y',
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.14)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
          },
          {
            label: 'Inherent Risk Ratio',
            data: inherentRiskRatio,
            yAxisID: 'y',
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.10)',
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [6, 4],
          },
          {
            label: 'Residual Risk Ratio',
            data: residualRiskRatio,
            yAxisID: 'y',
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.10)',
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [4, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        events: ['mousemove', 'mousedown', 'mouseup', 'mouseout', 'touchstart', 'touchmove', 'touchend'],
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
            border: { color: AXIS_BORDER_COLOR },
            grid: { display: false },
            ticks: {
              color: AXIS_TICK_COLOR,
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
            suggestedMax: 25,
            border: { color: AXIS_BORDER_COLOR },
            grid: { color: GRID_LINE_COLOR },
            ticks: { color: AXIS_TICK_COLOR },
            title: {
              display: true,
              text: 'Score',
              color: AXIS_TICK_COLOR,
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
  }, [labels, currentRiskRatio, inherentRiskRatio, residualRiskRatio, period]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
