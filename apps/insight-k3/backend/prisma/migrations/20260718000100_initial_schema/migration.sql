-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'OPERATOR', 'MANAGEMENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'REJECTED', 'INVESTIGATION', 'CORRECTIVE_ACTION', 'MANAGEMENT_REVIEW', 'REVISION_REQUIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CorrectiveActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ControlHierarchy" AS ENUM ('ELIMINATION', 'SUBSTITUTION', 'ENGINEERING_CONTROL', 'ADMINISTRATIVE_CONTROL', 'PPE');

-- CreateEnum
CREATE TYPE "EffectivenessStatus" AS ENUM ('NOT_REVIEWED', 'MONITORING', 'EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE');

-- CreateEnum
CREATE TYPE "ManagementReviewStatus" AS ENUM ('WAITING_REVIEW', 'REVISION_REQUIRED', 'APPROVED_AND_CLOSED');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('INCIDENT_EVIDENCE', 'INVESTIGATION_EVIDENCE', 'CORRECTIVE_ACTION_EVIDENCE', 'MANAGEMENT_ATTACHMENT');

-- CreateEnum
CREATE TYPE "AuditEvent" AS ENUM ('CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'SUBMIT', 'CLOSE', 'LOGIN', 'LOGOUT', 'EXPORT', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(200),
    "department" VARCHAR(150),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "incident_code" VARCHAR(40) NOT NULL,
    "reporter_id" UUID NOT NULL,
    "incident_date" TIMESTAMPTZ(6) NOT NULL,
    "location" VARCHAR(150) NOT NULL,
    "department" VARCHAR(150) NOT NULL,
    "type" VARCHAR(150) NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "object_involved" VARCHAR(255),
    "description" TEXT NOT NULL,
    "unsafe_action" VARCHAR(255),
    "sop_violation" BOOLEAN,
    "unsafe_condition" VARCHAR(255),
    "contributing_factor" TEXT,
    "initial_root_cause" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "closed_by_id" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "investigation_date" TIMESTAMPTZ(6),
    "lead_investigator_id" UUID,
    "lead_investigator_name" VARCHAR(200),
    "team_members" JSONB,
    "method" VARCHAR(255),
    "verified_chronology" TEXT,
    "findings" TEXT,
    "witnesses" TEXT,
    "evidence_description" TEXT,
    "immediate_cause" TEXT,
    "root_cause" TEXT,
    "contributing_factor" TEXT,
    "five_why" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "submitted_by_name" VARCHAR(200),
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_actions" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "investigation_id" UUID,
    "action" TEXT NOT NULL,
    "control_hierarchy" "ControlHierarchy",
    "pic_user_id" UUID,
    "pic_name" VARCHAR(200) NOT NULL,
    "target_date" DATE NOT NULL,
    "status" "CorrectiveActionStatus" NOT NULL DEFAULT 'OPEN',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evidence_summary" TEXT,
    "note" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "effectiveness_status" "EffectivenessStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "effectiveness_note" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_updates" (
    "id" UUID NOT NULL,
    "investigation_id" UUID NOT NULL,
    "author_id" UUID,
    "author_name" VARCHAR(200) NOT NULL,
    "note" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_reviews" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "status" "ManagementReviewStatus" NOT NULL DEFAULT 'WAITING_REVIEW',
    "note" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "management_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "investigation_id" UUID,
    "corrective_action_id" UUID,
    "uploaded_by_id" UUID,
    "category" "AttachmentCategory" NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_username" VARCHAR(100) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "action" "AuditEvent" NOT NULL,
    "record_type" VARCHAR(100) NOT NULL,
    "record_id" VARCHAR(100) NOT NULL,
    "incident_id" UUID,
    "description" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_incident_code_key" ON "incidents"("incident_code");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_department_idx" ON "incidents"("department");

-- CreateIndex
CREATE INDEX "incidents_location_idx" ON "incidents"("location");

-- CreateIndex
CREATE INDEX "incidents_incident_date_idx" ON "incidents"("incident_date");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_incident_id_key" ON "investigations"("incident_id");

-- CreateIndex
CREATE INDEX "corrective_actions_incident_id_idx" ON "corrective_actions"("incident_id");

-- CreateIndex
CREATE INDEX "corrective_actions_status_idx" ON "corrective_actions"("status");

-- CreateIndex
CREATE INDEX "corrective_actions_target_date_idx" ON "corrective_actions"("target_date");

-- CreateIndex
CREATE INDEX "investigation_updates_investigation_id_created_at_idx" ON "investigation_updates"("investigation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "management_reviews_incident_id_key" ON "management_reviews"("incident_id");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storage_key_key" ON "attachments"("storage_key");

-- CreateIndex
CREATE INDEX "attachments_incident_id_idx" ON "attachments"("incident_id");

-- CreateIndex
CREATE INDEX "attachments_category_idx" ON "attachments"("category");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_action_idx" ON "audit_logs"("module", "action");

-- CreateIndex
CREATE INDEX "audit_logs_record_type_record_id_idx" ON "audit_logs"("record_type", "record_id");

-- CreateIndex
CREATE INDEX "audit_logs_incident_id_idx" ON "audit_logs"("incident_id");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_lead_investigator_id_fkey" FOREIGN KEY ("lead_investigator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_pic_user_id_fkey" FOREIGN KEY ("pic_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_updates" ADD CONSTRAINT "investigation_updates_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_updates" ADD CONSTRAINT "investigation_updates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_reviews" ADD CONSTRAINT "management_reviews_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_reviews" ADD CONSTRAINT "management_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_corrective_action_id_fkey" FOREIGN KEY ("corrective_action_id") REFERENCES "corrective_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
