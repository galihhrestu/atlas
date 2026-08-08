import { z } from "zod";

const incidentStatusSchema = z.enum([
  "INVESTIGATION",
  "CORRECTIVE_ACTION",
  "REVISION_REQUIRED",
  "MANAGEMENT_REVIEW",
  "CLOSED"
]);

const actionStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]);

const optionalText = (maximum, label) =>
  z
    .string()
    .trim()
    .max(maximum, `${label} maksimal ${maximum} karakter.`)
    .optional()
    .default("");

const optionalDateSchema = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value, context) => {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Tanggal tidak valid."
      });
      return z.NEVER;
    }

    return date;
  });

const fiveWhyItemSchema = z
  .object({
    id: z.string().trim().max(100).optional().nullable(),
    question: optionalText(500, "Pertanyaan Five Why"),
    answer: optionalText(10_000, "Jawaban Five Why")
  })
  .strict();

const actionDraftSchema = z
  .object({
    id: z.string().trim().max(100).optional().nullable(),
    action: optionalText(20_000, "Corrective action"),
    pic: optionalText(200, "PIC"),
    targetDate: optionalDateSchema,
    status: actionStatusSchema.default("OPEN"),
    progress: z.coerce.number().int().min(0).max(100).default(0),
    evidence: optionalText(20_000, "Evidence"),
    note: optionalText(20_000, "Progress note")
  })
  .strict();

const investigationPayloadSchema = z
  .object({
    investigationDate: optionalDateSchema,
    investigator: optionalText(200, "Lead investigator"),
    teamMembers: optionalText(2_000, "Investigation team"),
    method: optionalText(255, "Investigation method"),
    verifiedChronology: optionalText(20_000, "Verified chronology"),
    findings: optionalText(20_000, "Investigation findings"),
    witnesses: optionalText(20_000, "Witnesses"),
    evidenceDescription: optionalText(20_000, "Evidence description"),
    immediateCause: optionalText(20_000, "Immediate cause"),
    rootCause: optionalText(20_000, "Root cause"),
    contributingFactor: optionalText(20_000, "Contributing factor"),
    fiveWhy: z.array(fiveWhyItemSchema).max(5).optional().default([]),
    actions: z.array(actionDraftSchema).max(100).optional().default([])
  })
  .strict();

const monitoringQuerySchema = z
  .object({
    search: z.string().trim().max(150).optional().default(""),
    status: incidentStatusSchema.optional()
  })
  .strict();

const updateNoteSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(1, "Progress update wajib diisi.")
      .max(10_000, "Progress update maksimal 10000 karakter.")
  })
  .strict();

function createValidationError(zodError, fallbackMessage) {
  const firstIssue = zodError.issues?.[0];
  const error = new Error(firstIssue?.message || fallbackMessage);
  error.statusCode = 422;
  error.details = zodError.issues;
  return error;
}

export function validateInvestigationIdentifier(value) {
  const result = z.string().trim().min(1).max(100).safeParse(value);

  if (!result.success) {
    throw createValidationError(
      result.error,
      "Identifier incident tidak valid."
    );
  }

  return result.data;
}

export function validateInvestigationMonitoringQuery(query) {
  const result = monitoringQuerySchema.safeParse(query);

  if (!result.success) {
    throw createValidationError(
      result.error,
      "Filter investigation tidak valid."
    );
  }

  return result.data;
}

export function validateInvestigationPayload(payload) {
  const result = investigationPayloadSchema.safeParse(payload);

  if (!result.success) {
    throw createValidationError(
      result.error,
      "Data investigation tidak valid."
    );
  }

  return result.data;
}

export function validateInvestigationUpdate(payload) {
  const result = updateNoteSchema.safeParse(payload);

  if (!result.success) {
    throw createValidationError(
      result.error,
      "Progress update tidak valid."
    );
  }

  return result.data;
}
