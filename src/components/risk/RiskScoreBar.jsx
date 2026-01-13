import { getRiskLevel } from '../../utils/risk';

export default function RiskScoreBar({ score, className = '' }) {
  const lvl = getRiskLevel(score);
  const s = Number(score) || 0;
  const pct = Math.round((Math.min(25, Math.max(0, s)) / 25) * 100);
  const barClass = lvl?.barClass ?? 'bg-transparent';

  return (
    <div className={`w-full ${className}`} aria-label={`Risk score ${score} out of 25`}>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


