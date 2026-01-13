import { useMemo } from 'react';
import { computeRiskScore, getRiskLevel } from '../../utils/risk';

const POSSIBILITY_LABELS = {
  1: 'Sangat Jarang Terjadi',
  2: 'Jarang Terjadi',
  3: 'Bisa Terjadi',
  4: 'Sangat Mungkin Terjadi',
  5: 'Hampir Pasti Terjadi',
};

const IMPACT_LABELS = {
  1: 'Low',
  2: 'Low to Moderate',
  3: 'Moderate',
  4: 'Moderate to High',
  5: 'High',
};

export default function RiskMatrix({ risks = [], onCellClick }) {
  // Build matrix: [possibility][impact] = count of risks (5x5)
  const matrix = useMemo(() => {
    const grid = Array(5)
      .fill(null)
      .map(() => Array(5).fill(0));

    for (const risk of risks) {
      // score=0 means not evaluated; don't include it in the matrix counts
      if ((risk.score || 0) <= 0) continue;
      // Support both old (likelihood) and new (possibility) naming
      const p = Math.max(1, Math.min(5, risk.possibility || risk.possibilityType || risk.likelihood || 1)) - 1; // 0-4
      const i = Math.max(1, Math.min(5, risk.impactLevel || risk.impact || 1)) - 1; // 0-4
      grid[p][i] += 1;
    }

    return grid;
  }, [risks]);

  const getCellColor = (possibility, impact) => {
    const score = computeRiskScore({ possibility, impactLevel: impact });
    const level = getRiskLevel(score);
    return level.mapColor;
  };

  const getCellOpacity = (count) => {
    if (count === 0) return 0.15;
    if (count === 1) return 0.4;
    if (count <= 3) return 0.6;
    return 0.85;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header row: Impact labels */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 shrink-0">
        <div className="w-16 shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 px-1 py-1 border-r border-gray-300 dark:border-gray-600">
        </div>
        {[1, 2, 3, 4, 5].map((impact) => (
          <div
            key={impact}
            className="flex-1 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-0.5 py-1 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
          >
            <span className="text-xs">{impact}</span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
              {IMPACT_LABELS[impact]}
            </span>
          </div>
        ))}
      </div>

      {/* Matrix rows */}
      {[1, 2, 3, 4, 5].map((possibility, pIdx) => (
        <div key={possibility} className="flex flex-1 border-b border-gray-300 dark:border-gray-600 last:border-b-0">
          {/* Possibility label */}
          <div className="w-16 shrink-0 flex flex-col items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200 px-1 py-0.5 border-r border-gray-300 dark:border-gray-600">
            <span className="text-xs">{possibility}</span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center line-clamp-1">
              {POSSIBILITY_LABELS[possibility]}
            </span>
          </div>

          {/* Impact cells */}
          {[1, 2, 3, 4, 5].map((impact, iIdx) => {
            const count = matrix[pIdx][iIdx];
            const score = computeRiskScore({ possibility, impactLevel: impact });
            const level = getRiskLevel(score);
            const bgColor = getCellColor(possibility, impact);
            const opacity = getCellOpacity(count);

            return (
              <div
                key={impact}
                onClick={() => onCellClick?.({ possibility, impact, score, level, count })}
                className="flex-1 flex items-center justify-center border-r border-gray-300 dark:border-gray-600 last:border-r-0 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 dark:hover:ring-gray-500 relative group"
                style={{
                  backgroundColor: `${bgColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                }}
                title={`Probabilitas: ${possibility} (${POSSIBILITY_LABELS[possibility]}), Dampak: ${impact} (${IMPACT_LABELS[impact]}), Score: ${score} (${level.label}), Risks: ${count}`}
              >
                {/* Score */}
                <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {score}
                </span>
                {/* Count badge */}
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 text-[9px] font-bold px-1 py-0 rounded-full shadow-sm">
                    {count}
                  </span>
                )}
                {/* Level label on hover */}
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 dark:bg-black/70 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {level.label}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

