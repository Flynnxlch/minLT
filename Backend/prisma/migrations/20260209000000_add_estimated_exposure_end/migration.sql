-- Add optional end date for estimated exposure window in risk analyses.
ALTER TABLE "risk_analyses"
ADD COLUMN IF NOT EXISTS "estimated_exposure_end_date" TIMESTAMP(3);
