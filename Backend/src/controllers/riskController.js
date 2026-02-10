import { prisma } from '../lib/prisma.js';
import { clearCacheByPattern, deleteCache, getCache, setCache } from '../utils/cache.js';
import { generateRiskId, getRiskLevel } from '../utils/risk.js';

/**
 * Risk controller - handles risk-related API endpoints
 */
export const riskController = {
  /**
   * Get all risks (filtered by user role and cabang)
   */
  getAll: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(request.url);
      const regionCode = url.searchParams.get('regionCode');
      
      // Sorting parameter
      const sortBy = url.searchParams.get('sortBy') || 'highest-risk'; // Default: highest-risk
      
      // Refresh parameter: if true, bypass cache and fetch fresh data from database
      const forceRefresh = url.searchParams.get('refresh') === 'true';
      
      // Log for debugging (can be removed in production)
      if (forceRefresh) {
        console.log('[Cache] Force refresh requested - bypassing cache and fetching fresh data from database');
      }

      // Build where clause
      const where = {};
      
      // Filter by user role and region_cabang
      // Special case: If user has region_cabang = 'KPS', show all risks from all region_code
      // Otherwise, filter by user's region_cabang
      if (user.userRole === 'ADMIN_CABANG') {
        // If region_cabang is KPS, don't filter by regionCode (show all)
        // Otherwise, filter by user's region_cabang
        if (user.regionCabang && user.regionCabang !== 'KPS') {
          where.regionCode = user.regionCabang;
        }
        // If region_cabang is KPS, where.regionCode is not set, so all risks are shown
      } else if (user.userRole === 'USER_BIASA') {
        // For USER_BIASA, also check region_cabang
        if (user.regionCabang && user.regionCabang !== 'KPS') {
          // If region_cabang is not KPS, filter by regionCode
          where.regionCode = user.regionCabang;
        }
        // If region_cabang is KPS, show all risks from all region_code
        // Note: We don't filter by userId here because requirement is to show all risks from all regions if KPS
      }
      // ADMIN_PUSAT can see all (no filter applied)

      // If regionCode query parameter is provided, it overrides the above filter
      if (regionCode) {
        where.regionCode = regionCode;
      }

      // Cache key includes user role, regionCode filter, and sortBy
      const cacheKey = `risks:${user.userRole}:${user.regionCabang || 'all'}:${regionCode || 'all'}:sort:${sortBy}`;
      
      // Cache Strategy:
      // - Normal request (no refresh): Use cache with 2-minute TTL for optimal performance
      // - Force refresh (refresh=true): Skip cache completely, fetch fresh from database, then cache the result
      if (forceRefresh) {
        // Force refresh: Clear ALL risks cache to ensure fresh data
        // This ensures we get fresh data from database, not from cache
        console.log(`[Cache] Force refresh - Clearing all risks cache`);
        clearCacheByPattern('risks:');
        // Explicitly delete this specific cache key as well
        deleteCache(cacheKey);
      } else {
        // Normal request: Check cache first
        const cachedData = getCache(cacheKey);
        if (cachedData) {
          console.log(`[Cache] Returning cached data for key: ${cacheKey}`);
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'private, max-age=120', // 2 minutes browser cache
            },
          });
        }
        console.log(`[Cache] Cache miss for key: ${cacheKey} - fetching from database`);
      }

      // Fetch all risks (for sorting by calculated score)
      // OPTIMIZED: Select only needed columns to reduce payload size and query time
      const allRisks = await prisma.risk.findMany({
        where,
        select: {
          // Risk table fields
          id: true,
          userId: true,
          riskEvent: true,
          title: true,
          organization: true,
          division: true,
          target: true,
          riskEventDescription: true,
          riskCause: true,
          riskImpactExplanation: true,
          category: true,
          riskCategoryType: true,
          regionCode: true,
          evaluationRequested: true,
          evaluationRequestedAt: true,
          createdAt: true,
          updatedAt: true,
          // User relation - only needed fields
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // Analysis relation - only fields used in response
          analysis: {
            select: {
              existingControl: true,
              controlType: true,
              controlLevel: true,
              controlEffectivenessAssessment: true,
              estimatedExposureDate: true,
              estimatedExposureEndDate: true,
              keyRiskIndicator: true,
              kriUnit: true,
              kriValueSafe: true,
              kriValueCaution: true,
              kriValueDanger: true,
              impactDescription: true,
              impactLevel: true,
              possibilityType: true,
              possibilityDescription: true,
              inherentScore: true,
              inherentLevel: true,
              residualImpactDescription: true,
              residualImpactLevel: true,
              residualPossibilityType: true,
              residualPossibilityDescription: true,
              residualScore: true,
              residualLevel: true,
              analyzedAt: true,
            },
          },
          // Mitigation relation - only fields that actually exist in RiskMitigation model
          mitigation: {
            select: {
              handlingType: true,
              mitigationPlan: true,
              mitigationOutput: true,
              mitigationBudget: true,
              mitigationActual: true,
              progressMitigation: true,
              realizationTarget: true,
              targetKpi: true,
              inherentScore: true,
              // Note: residual fields (residualImpactDescription, residualScore, etc.) 
              // are NOT in RiskMitigation - they only exist in RiskAnalysis
              // The formatting code handles this with fallbacks to analysis values
              currentImpactDescription: true,
              currentImpactLevel: true,
              currentProbabilityDescription: true,
              currentProbabilityType: true,
              currentScore: true,
              currentLevel: true,
              plannedAt: true,
            },
          },
          // Evaluations - only latest one, only needed fields
          evaluations: {
            select: {
              evaluationStatus: true,
              evaluationNotes: true,
              evaluationDate: true,
              evaluator: true,
              evaluatorNote: true,
              lastEvaluatedAt: true,
              currentImpactDescription: true,
              currentProbabilityDescription: true,
            },
            orderBy: { lastEvaluatedAt: 'desc' },
            take: 1,
          },
        },
      });

      // OPTIMIZED: Combine score calculation, sorting, and formatting in one pass
      // Pre-compute title for sorting to avoid repeated calculations
      const risksWithMetadata = allRisks.map(risk => {
        // Calculate score and level - prioritize currentScore from mitigation, then inherentScore
        let score = 0;
        let level = null;
        if (risk.mitigation?.currentScore) {
          score = risk.mitigation.currentScore;
          level = risk.mitigation.currentLevel || getRiskLevel(score)?.label;
        } else if (risk.analysis?.inherentScore) {
          score = risk.analysis.inherentScore;
          level = risk.analysis.inherentLevel;
        } else if (risk.mitigation?.residualScoreFinal) {
          score = risk.mitigation.residualScoreFinal;
          level = getRiskLevel(score)?.label;
        }
        
        // Pre-compute title for sorting (avoid repeated toLowerCase calls)
        const titleForSort = (risk.title || risk.riskEvent || risk.id || '').toLowerCase();
        
        return {
          risk,
          calculatedScore: score,
          calculatedLevel: level,
          titleForSort,
        };
      });

      // Sort based on sortBy parameter (optimized with pre-computed values)
      risksWithMetadata.sort((a, b) => {
        // Pre-compute scores once for all cases
        const scoreA = a.calculatedScore || 0;
        const scoreB = b.calculatedScore || 0;
        const scoreDiff = scoreB - scoreA; // For descending (highest first)
        
        switch (sortBy) {
          case 'highest-risk':
            if (scoreA === scoreB) {
              return a.titleForSort.localeCompare(b.titleForSort);
            }
            return scoreDiff; // Descending order (highest first)
          
          case 'lowest-risk':
            if (scoreA === scoreB) {
              return a.titleForSort.localeCompare(b.titleForSort);
            }
            return -scoreDiff; // Ascending order (lowest first)
          
          case 'a-to-z':
            return a.titleForSort.localeCompare(b.titleForSort);
          
          case 'z-to-a':
            return b.titleForSort.localeCompare(a.titleForSort);
          
          default: // 'highest-risk'
            if (scoreA === scoreB) {
              return a.titleForSort.localeCompare(b.titleForSort);
            }
            return scoreDiff;
        }
      });

      // Transform to frontend format in single pass (optimized)
      const formattedRisks = risksWithMetadata.map(({ risk, calculatedScore, calculatedLevel }) => {
        // Use pre-calculated score and level
        const score = calculatedScore || 0;
        const level = calculatedLevel || null;

        // OPTIMIZED: Build response object directly without spread operators
        const formattedRisk = {
          id: risk.id,
          userId: risk.userId,
          riskEvent: risk.riskEvent,
          title: risk.title || risk.riskEvent,
          organization: risk.organization,
          division: risk.division,
          target: risk.target,
          riskEventDescription: risk.riskEventDescription,
          riskCause: risk.riskCause,
          riskImpactExplanation: risk.riskImpactExplanation,
          category: risk.category,
          riskCategoryType: risk.riskCategoryType,
          regionCode: risk.regionCode,
          evaluationRequested: risk.evaluationRequested || false,
          evaluationRequestedAt: risk.evaluationRequestedAt?.toISOString(),
          score,
          level,
          createdAt: risk.createdAt.toISOString(),
          updatedAt: risk.updatedAt.toISOString(),
        };

        // Include analysis data (only if exists)
        if (risk.analysis) {
          Object.assign(formattedRisk, {
            existingControl: risk.analysis.existingControl,
            controlType: risk.analysis.controlType,
            controlLevel: risk.analysis.controlLevel,
            controlEffectivenessAssessment: risk.analysis.controlEffectivenessAssessment,
            estimatedExposureDate: risk.analysis.estimatedExposureDate?.toISOString(),
            estimatedExposureEndDate: risk.analysis.estimatedExposureEndDate?.toISOString(),
            keyRiskIndicator: risk.analysis.keyRiskIndicator,
            kriUnit: risk.analysis.kriUnit,
            kriValueSafe: risk.analysis.kriValueSafe,
            kriValueCaution: risk.analysis.kriValueCaution,
            kriValueDanger: risk.analysis.kriValueDanger,
            impactDescription: risk.analysis.impactDescription,
            impactLevel: risk.analysis.impactLevel,
            possibilityType: risk.analysis.possibilityType,
            possibilityDescription: risk.analysis.possibilityDescription,
            inherentScore: risk.analysis.inherentScore,
            inherentLevel: risk.analysis.inherentLevel,
            residualImpactDescription: risk.analysis.residualImpactDescription,
            residualImpactLevel: risk.analysis.residualImpactLevel,
            residualPossibilityType: risk.analysis.residualPossibilityType,
            residualPossibilityDescription: risk.analysis.residualPossibilityDescription,
            residualScore: risk.analysis.residualScore,
            residualLevel: risk.analysis.residualLevel,
            analyzedAt: risk.analysis.analyzedAt?.toISOString(),
          });
        }

        // Include mitigation data (only if exists)
        if (risk.mitigation) {
          Object.assign(formattedRisk, {
            handlingType: risk.mitigation.handlingType,
            mitigationPlan: risk.mitigation.mitigationPlan,
            mitigationOutput: risk.mitigation.mitigationOutput,
            mitigationBudget: risk.mitigation.mitigationBudget,
            mitigationActual: risk.mitigation.mitigationActual,
            progressMitigation: risk.mitigation.progressMitigation,
            realizationTarget: risk.mitigation.realizationTarget,
            targetKpi: risk.mitigation.targetKpi,
            // Prefer mitigation residual values if present, otherwise keep analysis values
            // Note: residual fields don't exist in RiskMitigation, so always use analysis values
            residualImpactDescription: risk.analysis?.residualImpactDescription,
            residualImpactLevel: risk.analysis?.residualImpactLevel,
            residualProbabilityDescription: risk.analysis?.residualPossibilityDescription,
            residualProbabilityType: risk.analysis?.residualPossibilityType,
            residualScore: risk.analysis?.residualScore,
            residualScoreFinal: risk.analysis?.residualScore,
            // inherentScore should always come from analysis, not mitigation
            // This ensures consistency - inherentScore in risk_mitigations should match risk_analyses
            inherentScore: risk.analysis?.inherentScore ?? risk.mitigation.inherentScore,
            // Current Risk (after mitigation) - kondisi risiko terkini
            currentImpactDescription: risk.mitigation.currentImpactDescription,
            currentImpactLevel: risk.mitigation.currentImpactLevel,
            currentProbabilityDescription: risk.mitigation.currentProbabilityDescription,
            currentProbabilityType: risk.mitigation.currentProbabilityType,
            currentScore: risk.mitigation.currentScore,
            currentLevel: risk.mitigation.currentLevel,
            plannedAt: risk.mitigation.plannedAt?.toISOString(),
          });
        }

        // Include latest evaluation (only if exists)
        if (risk.evaluations?.[0]) {
          const evaluation = risk.evaluations[0];
          Object.assign(formattedRisk, {
            // Transform evaluationStatus from enum format (UPPERCASE with underscore) to form format (lowercase with dash)
            evaluationStatus: evaluation.evaluationStatus === 'EFFECTIVE' ? 'effective' :
                              evaluation.evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                              evaluation.evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                              evaluation.evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                              evaluation.evaluationStatus?.toLowerCase() || null,
            evaluationNotes: evaluation.evaluationNotes,
            evaluationDate: evaluation.evaluationDate?.toISOString(),
            evaluator: evaluation.evaluator,
            evaluatorNote: evaluation.evaluatorNote,
            lastEvaluatedAt: evaluation.lastEvaluatedAt?.toISOString(),
            // Only include descriptions, not levels/types (those come from mitigation)
            currentImpactDescription: evaluation.currentImpactDescription,
            currentProbabilityDescription: evaluation.currentProbabilityDescription,
          });
        }

        return formattedRisk;
      });

      // Prepare response (no pagination)
      const responseData = {
        risks: formattedRisks,
      };

      // Save to cache after query (with 2-minute TTL)
      // This applies to both normal requests and force refresh requests
      // After force refresh, the fresh data is cached for subsequent requests
      setCache(cacheKey, responseData);
      if (forceRefresh) {
        console.log(`[Cache] Fresh data fetched and cached for key: ${cacheKey}`);
      }

      // Set cache-control headers based on refresh parameter
      // If force refresh, prevent browser caching; otherwise allow caching
      const cacheHeaders = forceRefresh
        ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        : {
            'Cache-Control': 'private, max-age=120', // 2 minutes browser cache
          };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...cacheHeaders,
        },
      });
    } catch (error) {
      console.error('Get risks error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Get single risk by ID
   */
  getById: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          analysis: true,
          mitigation: true,
          evaluations: {
            orderBy: { lastEvaluatedAt: 'desc' },
          },
        },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'ADMIN_CABANG') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // If region_cabang is KPS, allow access (no check needed)
      }
      if (user.userRole === 'USER_BIASA') {
        // For USER_BIASA with region_cabang = 'KPS', allow access to all risks
        // For USER_BIASA with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && risk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Note: We don't check userId here because requirement is to show all risks from all regions if KPS
        // If you want to also check userId for non-KPS users, you can add: && risk.userId !== user.id
      }

      // Calculate score and level from analysis if available
      let score = 0;
      let level = null;
      if (risk.analysis?.inherentScore) {
        score = risk.analysis.inherentScore;
        level = risk.analysis.inherentLevel;
      } else if (risk.mitigation?.residualScoreFinal) {
        score = risk.mitigation.residualScoreFinal;
        level = getRiskLevel(score).label;
      }

      // Format response (similar to getAll)
      const formattedRisk = {
        id: risk.id,
        userId: risk.userId,
        riskEvent: risk.riskEvent,
        title: risk.title || risk.riskEvent,
        organization: risk.organization,
        division: risk.division,
        target: risk.target,
        riskEventDescription: risk.riskEventDescription,
        riskCause: risk.riskCause,
        riskImpactExplanation: risk.riskImpactExplanation,
        category: risk.category,
        riskCategoryType: risk.riskCategoryType,
        regionCode: risk.regionCode,
        evaluationRequested: risk.evaluationRequested || false,
        evaluationRequestedAt: risk.evaluationRequestedAt?.toISOString(),
        score,
        level,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString(),
        ...(risk.analysis && {
          existingControl: risk.analysis.existingControl,
          controlType: risk.analysis.controlType,
          controlLevel: risk.analysis.controlLevel,
          controlEffectivenessAssessment: risk.analysis.controlEffectivenessAssessment,
          estimatedExposureDate: risk.analysis.estimatedExposureDate?.toISOString(),
          estimatedExposureEndDate: risk.analysis.estimatedExposureEndDate?.toISOString(),
          keyRiskIndicator: risk.analysis.keyRiskIndicator,
          kriUnit: risk.analysis.kriUnit,
          kriValueSafe: risk.analysis.kriValueSafe,
          kriValueCaution: risk.analysis.kriValueCaution,
          kriValueDanger: risk.analysis.kriValueDanger,
          impactDescription: risk.analysis.impactDescription,
          impactLevel: risk.analysis.impactLevel,
          possibilityType: risk.analysis.possibilityType,
          possibilityDescription: risk.analysis.possibilityDescription,
          inherentScore: risk.analysis.inherentScore,
          inherentLevel: risk.analysis.inherentLevel,
          residualImpactDescription: risk.analysis.residualImpactDescription,
          residualImpactLevel: risk.analysis.residualImpactLevel,
          residualPossibilityType: risk.analysis.residualPossibilityType,
          residualPossibilityDescription: risk.analysis.residualPossibilityDescription,
          residualScore: risk.analysis.residualScore,
          residualLevel: risk.analysis.residualLevel,
          analyzedAt: risk.analysis.analyzedAt?.toISOString(),
        }),
        ...(risk.mitigation && {
          handlingType: risk.mitigation.handlingType,
          mitigationPlan: risk.mitigation.mitigationPlan,
          mitigationOutput: risk.mitigation.mitigationOutput,
          mitigationBudget: risk.mitigation.mitigationBudget,
          mitigationActual: risk.mitigation.mitigationActual,
          progressMitigation: risk.mitigation.progressMitigation,
          realizationTarget: risk.mitigation.realizationTarget,
          targetKpi: risk.mitigation.targetKpi,
          // inherentScore should always come from analysis, not mitigation
          // This ensures consistency - inherentScore in risk_mitigations should match risk_analyses
          inherentScore: risk.analysis?.inherentScore ?? risk.mitigation.inherentScore,
          // Current risk (after mitigation) if available
          currentImpactDescription: risk.mitigation.currentImpactDescription,
          currentImpactLevel: risk.mitigation.currentImpactLevel,
          currentProbabilityDescription: risk.mitigation.currentProbabilityDescription,
          currentProbabilityType: risk.mitigation.currentProbabilityType,
          currentScore: risk.mitigation.currentScore,
          currentLevel: risk.mitigation.currentLevel,
          plannedAt: risk.mitigation.plannedAt?.toISOString(),
        }),
        evaluations: risk.evaluations.map(evaluation => ({
          id: evaluation.id,
          // Transform evaluationStatus from enum format to form format
          evaluationStatus: evaluation.evaluationStatus === 'EFFECTIVE' ? 'effective' :
                            evaluation.evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                            evaluation.evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                            evaluation.evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                            evaluation.evaluationStatus?.toLowerCase() || null,
          evaluationNotes: evaluation.evaluationNotes,
          evaluationDate: evaluation.evaluationDate?.toISOString(),
          evaluator: evaluation.evaluator,
          evaluatorNote: evaluation.evaluatorNote,
          lastEvaluatedAt: evaluation.lastEvaluatedAt?.toISOString(),
          // Only include descriptions, not levels/types (those come from mitigation)
          currentImpactDescription: evaluation.currentImpactDescription,
          currentProbabilityDescription: evaluation.currentProbabilityDescription,
          userId: evaluation.userId,
        })),
      };

      return new Response(JSON.stringify({ risk: formattedRisk }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create new risk
   */
  create: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        riskEvent,
        organization,
        division,
        target,
        riskEventDescription,
        riskCause,
        riskImpactExplanation,
        category,
        riskCategoryType,
        regionCode,
      } = body;

      if (!riskEvent) {
        return new Response(
          JSON.stringify({ error: 'Risk event is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Auto-detect cabang from user if not provided
      // For ADMIN_CABANG and USER_BIASA, always use their regionCabang (cannot override)
      // For ADMIN_PUSAT, use provided regionCode or default to user.regionCabang or 'KPS'
      let finalRegionCode;
      if (user.userRole === 'ADMIN_PUSAT') {
        // ADMIN_PUSAT can specify any regionCode
        finalRegionCode = regionCode || user.regionCabang || 'KPS';
      } else {
        // ADMIN_CABANG and USER_BIASA: always use their regionCabang
        finalRegionCode = user.regionCabang || 'KPS';
        // If they try to send a different regionCode, ignore it and use their regionCabang
        if (regionCode && regionCode !== user.regionCabang) {
          console.warn(`User ${user.id} (${user.userRole}) tried to set regionCode to ${regionCode}, but using their regionCabang ${user.regionCabang} instead`);
        }
      }

      // Generate risk ID
      const riskId = generateRiskId();

      // Create risk
      const risk = await prisma.risk.create({
        data: {
          id: riskId,
          userId: user.id,
          riskEvent: riskEvent.trim(),
          title: riskEvent.trim(),
          organization: organization || null,
          division: division || null,
          target: target || null,
          riskEventDescription: riskEventDescription || null,
          riskCause: riskCause || null,
          riskImpactExplanation: riskImpactExplanation || null,
          category: category || null,
          riskCategoryType: riskCategoryType || null,
          regionCode: finalRegionCode,
        },
      });

      // Clear cache when risk is created
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Risk created successfully',
          risk: {
            id: risk.id,
            riskEvent: risk.riskEvent,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Update risk
   */
  update: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if risk exists and user has access
      const existingRisk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!existingRisk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'ADMIN_CABANG') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      if (user.userRole === 'USER_BIASA') {
        // For USER_BIASA with region_cabang = 'KPS', allow access to all risks
        // For USER_BIASA with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Also check userId for USER_BIASA (they can only update their own risks)
        if (existingRisk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      const body = await request.json();
      const updateData = {};

      // Only update provided fields (sesuai dengan schema baru)
      if (body.riskEvent !== undefined) updateData.riskEvent = body.riskEvent.trim();
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.organization !== undefined) updateData.organization = body.organization;
      if (body.division !== undefined) updateData.division = body.division;
      if (body.target !== undefined) updateData.target = body.target;
      if (body.riskEventDescription !== undefined) updateData.riskEventDescription = body.riskEventDescription;
      if (body.riskCause !== undefined) updateData.riskCause = body.riskCause;
      if (body.riskImpactExplanation !== undefined) updateData.riskImpactExplanation = body.riskImpactExplanation;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.riskCategoryType !== undefined) updateData.riskCategoryType = body.riskCategoryType;
      if (body.regionCode !== undefined) updateData.regionCode = body.regionCode;
      if (body.evaluationRequested !== undefined) updateData.evaluationRequested = body.evaluationRequested;
      if (body.evaluationRequestedAt !== undefined) {
        updateData.evaluationRequestedAt = body.evaluationRequestedAt ? new Date(body.evaluationRequestedAt) : null;
      }

      // Clear cache when risk is updated
      clearCacheByPattern('risks:');

      const risk = await prisma.risk.update({
        where: { id: riskId },
        data: updateData,
      });

      return new Response(
        JSON.stringify({
          message: 'Risk updated successfully',
          risk: {
            id: risk.id,
            riskEvent: risk.riskEvent,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Update risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Delete risk
   */
  delete: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const existingRisk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!existingRisk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check access
      // Special case: If user has region_cabang = 'KPS', allow access to all risks
      if (user.userRole === 'ADMIN_CABANG') {
        // If region_cabang is not KPS, check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      if (user.userRole === 'USER_BIASA') {
        // For USER_BIASA with region_cabang = 'KPS', allow access to all risks
        // For USER_BIASA with region_cabang != 'KPS', check if risk.regionCode matches
        if (user.regionCabang && user.regionCabang !== 'KPS' && existingRisk.regionCode !== user.regionCabang) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Also check userId for USER_BIASA (they can only delete their own risks)
        if (existingRisk.userId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      await prisma.risk.delete({
        where: { id: riskId },
      });

      // Clear cache when risk is deleted
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({ message: 'Risk deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Delete risk error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk analysis
   */
  createOrUpdateAnalysis: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        existingControl,
        controlType,
        controlLevel,
        controlEffectivenessAssessment,
        estimatedExposureDate,
        estimatedExposureEndDate,
        keyRiskIndicator,
        kriUnit,
        kriValueSafe,
        kriValueCaution,
        kriValueDanger,
        impactDescription,
        impactLevel,
        possibilityType,
        possibilityDescription,
        residualImpactDescription,
        residualImpactLevel,
        residualPossibilityType,
        residualPossibilityDescription,
      } = body;

      // Trust scores sent by frontend (already computed via RiskMatrix)
      const inherentScore = body.inherentScore !== undefined ? Number(body.inherentScore) : null;
      const inherentLevel = body.inherentLevel !== undefined
        ? body.inherentLevel
        : inherentScore
          ? getRiskLevel(inherentScore)?.label ?? null
          : null;

      const residualScore = body.residualScore !== undefined ? Number(body.residualScore) : null;
      const residualLevel = body.residualLevel !== undefined
        ? body.residualLevel
        : residualScore
          ? getRiskLevel(residualScore)?.label ?? null
          : null;

      // Upsert analysis
      const analysis = await prisma.riskAnalysis.upsert({
        where: { riskId },
        update: {
          existingControl: existingControl !== undefined && existingControl !== '' ? existingControl : null,
          controlType: controlType !== undefined && controlType !== '' ? controlType : null,
          controlLevel: controlLevel !== undefined && controlLevel !== '' ? controlLevel : null,
          controlEffectivenessAssessment: controlEffectivenessAssessment !== undefined && controlEffectivenessAssessment !== '' ? controlEffectivenessAssessment : null,
          estimatedExposureDate: estimatedExposureDate ? new Date(estimatedExposureDate) : null,
          estimatedExposureEndDate: estimatedExposureEndDate ? new Date(estimatedExposureEndDate) : null,
          keyRiskIndicator: keyRiskIndicator || null,
          kriUnit: kriUnit || null,
          kriValueSafe: kriValueSafe || null,
          kriValueCaution: kriValueCaution || null,
          kriValueDanger: kriValueDanger || null,
          impactDescription: impactDescription || null,
          impactLevel: impactLevel !== undefined ? Number(impactLevel) : null,
          possibilityType: possibilityType !== undefined ? Number(possibilityType) : null,
          possibilityDescription: possibilityDescription || null,
          inherentScore: inherentScore !== null ? inherentScore : null,
          inherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: residualImpactLevel !== undefined ? Number(residualImpactLevel) : null,
          residualPossibilityType: residualPossibilityType !== undefined ? Number(residualPossibilityType) : null,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: residualScore !== null ? residualScore : null,
          residualLevel,
          analyzedAt: new Date(),
        },
        create: {
          riskId,
          existingControl: existingControl !== undefined && existingControl !== '' ? existingControl : null,
          controlType: controlType !== undefined && controlType !== '' ? controlType : null,
          controlLevel: controlLevel !== undefined && controlLevel !== '' ? controlLevel : null,
          controlEffectivenessAssessment: controlEffectivenessAssessment !== undefined && controlEffectivenessAssessment !== '' ? controlEffectivenessAssessment : null,
          estimatedExposureDate: estimatedExposureDate ? new Date(estimatedExposureDate) : null,
          estimatedExposureEndDate: estimatedExposureEndDate ? new Date(estimatedExposureEndDate) : null,
          keyRiskIndicator: keyRiskIndicator || null,
          kriUnit: kriUnit || null,
          kriValueSafe: kriValueSafe || null,
          kriValueCaution: kriValueCaution || null,
          kriValueDanger: kriValueDanger || null,
          impactDescription: impactDescription || null,
          impactLevel: impactLevel !== undefined ? Number(impactLevel) : null,
          possibilityType: possibilityType !== undefined ? Number(possibilityType) : null,
          possibilityDescription: possibilityDescription || null,
          inherentScore: inherentScore !== null ? inherentScore : null,
          inherentLevel,
          residualImpactDescription: residualImpactDescription || null,
          residualImpactLevel: residualImpactLevel !== undefined ? Number(residualImpactLevel) : null,
          residualPossibilityType: residualPossibilityType !== undefined ? Number(residualPossibilityType) : null,
          residualPossibilityDescription: residualPossibilityDescription || null,
          residualScore: residualScore !== null ? residualScore : null,
          residualLevel,
          analyzedAt: new Date(),
        },
      });

      return new Response(
        JSON.stringify({
          message: 'Risk analysis saved successfully',
          analysis: {
            inherentScore: analysis.inherentScore,
            inherentLevel: analysis.inherentLevel,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update analysis error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk mitigation
   */
  createOrUpdateMitigation: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists and get analysis to ensure inherentScore is from analysis
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
        include: {
          analysis: true,
        },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        handlingType,
        mitigationPlan,
        mitigationOutput,
        mitigationBudget,
        mitigationActual,
        progressMitigation,
        realizationTarget,
        targetKpi,
        // current risk (after mitigation)
        currentImpactDescription,
        currentImpactLevel,
        currentProbabilityDescription,
        currentProbabilityType,
        currentScore,
        currentLevel,
      } = body;

      // Always get inherentScore from risk_analyses, not from payload
      // This ensures inherentScore is never affected by current_score or residual_score
      const inherentScore = risk.analysis?.inherentScore ?? null;

      if (!mitigationPlan) {
        return new Response(
          JSON.stringify({ error: 'Mitigation plan is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Upsert mitigation
      const mitigation = await prisma.riskMitigation.upsert({
        where: { riskId },
        update: {
          handlingType: handlingType || null,
          mitigationPlan: mitigationPlan.trim(),
          mitigationOutput: mitigationOutput || null,
          mitigationBudget: mitigationBudget ? Number(mitigationBudget) : null,
          mitigationActual: mitigationActual ? Number(mitigationActual) : null,
          progressMitigation: progressMitigation || null,
          realizationTarget: realizationTarget || null,
          targetKpi: targetKpi || null,
          inherentScore: inherentScore || null,
          currentImpactDescription: currentImpactDescription || null,
          currentImpactLevel: currentImpactLevel !== undefined ? Number(currentImpactLevel) : null,
          currentProbabilityDescription: currentProbabilityDescription || null,
          currentProbabilityType: currentProbabilityType !== undefined ? Number(currentProbabilityType) : null,
          currentScore: currentScore !== undefined ? Number(currentScore) : null,
          currentLevel: currentLevel || null,
          plannedAt: new Date(),
        },
        create: {
          riskId,
          handlingType: handlingType || null,
          mitigationPlan: mitigationPlan.trim(),
          mitigationOutput: mitigationOutput || null,
          mitigationBudget: mitigationBudget ? Number(mitigationBudget) : null,
          mitigationActual: mitigationActual ? Number(mitigationActual) : null,
          progressMitigation: progressMitigation || null,
          realizationTarget: realizationTarget || null,
          targetKpi: targetKpi || null,
          inherentScore: inherentScore || null,
          currentImpactDescription: currentImpactDescription || null,
          currentImpactLevel: currentImpactLevel !== undefined ? Number(currentImpactLevel) : null,
          currentProbabilityDescription: currentProbabilityDescription || null,
          currentProbabilityType: currentProbabilityType !== undefined ? Number(currentProbabilityType) : null,
          currentScore: currentScore !== undefined ? Number(currentScore) : null,
          currentLevel: currentLevel || null,
          plannedAt: new Date(),
        },
      });

      // Clear cache when mitigation is created/updated
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Mitigation plan saved successfully',
          mitigation: {
            id: mitigation.id,
            riskId: mitigation.riskId,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update mitigation error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create or update risk evaluation
   */
  createOrUpdateEvaluation: async (request, riskId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify risk exists
      const risk = await prisma.risk.findUnique({
        where: { id: riskId },
      });

      if (!risk) {
        return new Response(
          JSON.stringify({ error: 'Risk not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const {
        evaluationStatus,
        evaluationNotes,
        evaluationDate,
        evaluator,
        evaluatorNote,
        currentImpactDescription,
        currentProbabilityDescription,
      } = body;

      // Transform evaluationStatus from form format (lowercase with dash) to enum format (UPPERCASE with underscore)
      // Form: 'effective', 'ineffective', 'partially-effective', 'not-started'
      // Enum: 'EFFECTIVE', 'NOT_EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'NOT_STARTED'
      const statusMap = {
        'effective': 'EFFECTIVE',
        'ineffective': 'NOT_EFFECTIVE',
        'partially-effective': 'PARTIALLY_EFFECTIVE',
        'not-started': 'NOT_STARTED',
      };
      const mappedStatus = statusMap[evaluationStatus] || evaluationStatus || 'NOT_STARTED';

      // Create evaluation - only save fields that are input by user
      // Note: currentImpactLevel, currentProbabilityType, and score are NOT saved
      // as they are only for display (calculated from risk mitigation)
      const evaluation = await prisma.riskEvaluation.create({
        data: {
          riskId,
          userId: user.id,
          evaluationStatus: mappedStatus,
          evaluationNotes: evaluationNotes || null,
          evaluationDate: evaluationDate ? new Date(evaluationDate) : new Date(),
          evaluator: evaluator || user.name,
          evaluatorNote: evaluatorNote || null,
          lastEvaluatedAt: new Date(),
          // Only save descriptions, not levels/types/scores (those are for display only)
          currentImpactDescription: currentImpactDescription || null,
          currentProbabilityDescription: currentProbabilityDescription || null,
        },
      });

      // Clear cache when evaluation is created/updated
      clearCacheByPattern('risks:');

      return new Response(
        JSON.stringify({
          message: 'Evaluation saved successfully',
          evaluation: {
            id: evaluation.id,
            // Transform evaluationStatus from enum format to form format
            evaluationStatus: evaluation.evaluationStatus === 'EFFECTIVE' ? 'effective' :
                              evaluation.evaluationStatus === 'NOT_EFFECTIVE' ? 'ineffective' :
                              evaluation.evaluationStatus === 'PARTIALLY_EFFECTIVE' ? 'partially-effective' :
                              evaluation.evaluationStatus === 'NOT_STARTED' ? 'not-started' :
                              evaluation.evaluationStatus?.toLowerCase() || null,
            evaluationDate: evaluation.evaluationDate?.toISOString(),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create/update evaluation error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
