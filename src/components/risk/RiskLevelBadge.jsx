import { getRiskLevel } from '../../utils/risk';

export default function RiskLevelBadge({ score, className = '' }) {
  const lvl = getRiskLevel(score);
  if (!lvl) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${lvl.badgeClass} ${className}`}
      title={`${lvl.label} (${lvl.min}-${lvl.max})`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${lvl.dotClass}`} />
      <span>{lvl.label}</span>
      <span className="text-gray-600 dark:text-gray-300 font-medium">·</span>
      <span className="font-semibold">{score}</span>
      <span className="text-gray-600 dark:text-gray-300 font-medium">/25</span>
    </span>
  );
}


