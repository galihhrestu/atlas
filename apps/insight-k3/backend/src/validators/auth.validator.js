import { z } from "zod";

const loginSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(3, "Username atau email minimal 3 karakter.")
      .max(255, "Username atau email maksimal 255 karakter."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(128, "Password maksimal 128 karakter.")
  })
  .strict();

function createValidationError(zodError) {
  const firstIssue = zodError.issues?.[0];
  const error = new Error(
    firstIssue?.message || "Data permintaan tidak valid."
  );

  error.statusCode = 422;
  error.details = zodError.issues;
  return error;
}

export function validateLoginInput(payload) {
  const validationResult = loginSchema.safeParse(payload);

  if (!validationResult.success) {
    throw createValidationError(validationResult.error);
  }

  return validationResult.data;
}
