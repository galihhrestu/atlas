import { z } from "zod";

const roleSchema = z.enum([
  "USER",
  "OPERATOR",
  "MANAGEMENT",
  "ADMIN"
]);

const statusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED"
]);

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(100, "Username maksimal 100 karakter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung."
  )
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .email("Format email tidak valid.")
  .max(255, "Email maksimal 255 karakter.")
  .transform((value) => value.toLowerCase());

const optionalText = (maximum, label) =>
  z
    .union([
      z.string().trim().max(maximum, `${label} maksimal ${maximum} karakter.`),
      z.null()
    ])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value || null;
    });

const passwordSchema = z
  .string()
  .min(12, "Password minimal 12 karakter.")
  .max(128, "Password maksimal 128 karakter.")
  .refine((value) => /[a-z]/.test(value), {
    message: "Password harus memiliki huruf kecil."
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password harus memiliki huruf besar."
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password harus memiliki angka."
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password harus memiliki simbol."
  });

const createUserSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    fullName: optionalText(200, "Nama lengkap"),
    department: optionalText(150, "Departemen"),
    role: roleSchema.default("USER"),
    status: statusSchema.default("ACTIVE")
  })
  .strict();

const updateUserSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    fullName: optionalText(200, "Nama lengkap"),
    department: optionalText(150, "Departemen"),
    role: roleSchema.optional(),
    status: statusSchema.optional()
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Tidak ada perubahan pengguna yang dikirim."
  );

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema
  })
  .strict();

const listUserQuerySchema = z
  .object({
    search: z.string().trim().max(255).optional().default(""),
    role: z.union([roleSchema, z.literal("")]).optional().default(""),
    status: z.union([statusSchema, z.literal("")]).optional().default(""),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(5).max(100).optional().default(10)
  })
  .strip();

const userIdSchema = z
  .string()
  .uuid("ID pengguna tidak valid.");

function createValidationError(zodError) {
  const firstIssue = zodError.issues?.[0];
  const error = new Error(
    firstIssue?.message || "Data permintaan tidak valid."
  );

  error.statusCode = 422;
  error.details = zodError.issues;
  return error;
}

function parseSchema(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

export function validateListUserQuery(query) {
  return parseSchema(listUserQuerySchema, query);
}

export function validateCreateUserInput(payload) {
  return parseSchema(createUserSchema, payload);
}

export function validateUpdateUserInput(payload) {
  return parseSchema(updateUserSchema, payload);
}

export function validateResetPasswordInput(payload) {
  return parseSchema(resetPasswordSchema, payload);
}

export function validateUserId(userId) {
  return parseSchema(userIdSchema, userId);
}
