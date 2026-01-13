import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SAMPLE_RISKS } from '../data/sampleRisks';
import { computeRiskScore, getRiskLevel } from '../utils/risk';

const STORAGE_KEY = 'minlt:risk-register:v1';

const RiskContext = createContext(null);

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_RISKS.map(normalizeRisk);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE_RISKS.map(normalizeRisk);
    return parsed.map(normalizeRisk);
  } catch {
    return SAMPLE_RISKS.map(normalizeRisk);
  }
}

function normalizeRisk(input) {
  // If score is explicitly set (e.g., from mitigation plan), use it and don't recalculate
  // This prevents normalizeRisk from overwriting residual scores
  let score = input.score;
  
  // Only compute score if it's not explicitly set and possibility/impact exist
  if (score === undefined || score === null) {
    const hasPossibility = (input.possibility || input.possibilityType || input.likelihood) && 
                          (input.possibility || input.possibilityType || input.likelihood) !== 0;
    const hasImpact = (input.impactLevel || input.impact) && 
                      (input.impactLevel || input.impact) !== 0;
    
    score = (hasPossibility && hasImpact) ? computeRiskScore(input) : 0;
  }
  
  // Ensure score is a number
  score = Number(score) || 0;
  
  const lvl = getRiskLevel(score);
  return {
    ...input,
    score,
    level: lvl?.label ?? null,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const next = [normalizeRisk(action.payload), ...state];
      return next;
    }
    case 'remove': {
      return state.filter((r) => r.id !== action.payload);
    }
    case 'update': {
      return state.map((r) => {
        if (r.id !== action.payload.id) return r;
        return normalizeRisk({ ...r, ...action.payload });
      });
    }
    default:
      return state;
  }
}

export function RiskProvider({ children }) {
  const [risks, dispatch] = useReducer(reducer, undefined, hydrate);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
    } catch {
      // ignore storage errors
    }
  }, [risks]);

  const api = useMemo(() => {
    return {
      risks,
      addRisk: (risk) => dispatch({ type: 'add', payload: risk }),
      updateRisk: (risk) => dispatch({ type: 'update', payload: risk }),
      removeRisk: (id) => dispatch({ type: 'remove', payload: id }),
    };
  }, [risks]);

  return <RiskContext.Provider value={api}>{children}</RiskContext.Provider>;
}

export function useRisks() {
  const ctx = useContext(RiskContext);
  if (!ctx) throw new Error('useRisks must be used within a RiskProvider');
  return ctx;
}


