-- DB-2: persist reporter's initial corrective-action proposal and operator rejection metadata.
ALTER TABLE "incidents"
ADD COLUMN "initial_action_plan" TEXT,
ADD COLUMN "initial_pic" VARCHAR(200),
ADD COLUMN "initial_target_date" DATE,
ADD COLUMN "rejected_by_id" UUID,
ADD COLUMN "rejected_at" TIMESTAMPTZ(6);

ALTER TABLE "incidents"
ADD CONSTRAINT "incidents_rejected_by_id_fkey"
FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
