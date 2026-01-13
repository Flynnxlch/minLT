import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

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
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
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

export default function RiskTrendChart({ risks = [], height = 300 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Keep chart month-window in sync with the user's realtime clock (handles month rollover / manual clock changes)
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      setMonthKey((prev) => (prev === key ? prev : key));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const { labels, avgScore, highPlusCount } = useMemo(() => {
    // Generate 6 months: from 5 months ago to current month (0 = current month)
    const labelsLocal = [5, 4, 3, 2, 1, 0].map((n) => monthStart(n));
    const now = new Date();

    const avg = labelsLocal.map((startDate, index) => {
      // For current month (index 5), use current date/time, otherwise use end of month
      const isCurrentMonth = index === labelsLocal.length - 1;
      const end = isCurrentMonth ? now : monthEnd(startDate);
      
      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });
      const assessed = active.filter((r) => (r.score || 0) > 0);
      if (!assessed.length) return 0;
      const sum = assessed.reduce((acc, r) => acc + (r.score || 0), 0);
      return Math.round((sum / assessed.length) * 10) / 10;
    });

    const highPlus = labelsLocal.map((startDate, index) => {
      // For current month (index 5), use current date/time, otherwise use end of month
      const isCurrentMonth = index === labelsLocal.length - 1;
      const end = isCurrentMonth ? now : monthEnd(startDate);
      
      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });
      return active.filter((r) => (r.score || 0) >= 15).length;
    });

    return { labels: labelsLocal, avgScore: avg, highPlusCount: highPlus };
  }, [risks, monthKey]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    Chart.register(crosshairPlugin);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg risk score',
            data: avgScore,
            yAxisID: 'y',
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
          },
          {
            label: 'High+ (count)', // High+ = High (score 15-21) + Extreme (score 22-30) risks combined
            data: highPlusCount,
            yAxisID: 'y2',
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.10)',
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [6, 4],
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
              callback: (_value, index) => fmtMonthTick(labels[index]),
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 25,
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { color: '#6c757d' },
            title: {
              display: true,
              text: 'Score',
              color: '#6c757d',
              font: { size: 12, weight: '600' },
            },
          },
          y2: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#6c757d' },
            title: {
              display: true,
              text: 'High+',
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
  }, [labels, avgScore, highPlusCount]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}


