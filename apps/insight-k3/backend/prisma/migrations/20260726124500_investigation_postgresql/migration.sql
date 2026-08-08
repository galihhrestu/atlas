-- DB-3: allow incomplete corrective-action drafts to live in PostgreSQL
-- while the incident is still in the Investigation stage.
ALTER TABLE "investigations"
ADD COLUMN "action_plan_draft" JSONB;
