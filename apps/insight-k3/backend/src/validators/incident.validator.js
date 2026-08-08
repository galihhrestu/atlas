import { z } from "zod";

const severitySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL"
]);

const estateSchema = z.enum(["MO", "Terunen", "Sepaku", "Senoni"]);
const locationTypeSchema = z.enum([
  "MO",
  "BLOCK_COMPARTMENT",
  "HAULING_ROAD",
  "COMPARTMENT_ROAD"
]);

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

const incidentDateSchema = z
  .string()
  .trim()
  .min(1, "Tanggal incident wajib diisi.")
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Tanggal incident tidak valid."
  )
  .transform((value) => new Date(value));

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
        message: "Tanggal target completion tidak valid."
      });
      return z.NEVER;
    }

    return date;
  });

function buildLocationLabel(input) {
  const detail = input.locationDetail?.trim();

  if (input.estate === "MO") {
    return detail ? `MO - ${detail}` : "MO";
  }

  if (input.locationType === "BLOCK_COMPARTMENT") {
    const base = `${input.estate} - ${input.block}${input.compartment}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (input.locationType === "HAULING_ROAD") {
    const base = `${input.estate} - Hauling Road ${input.haulingRoad}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (input.locationType === "COMPARTMENT_ROAD") {
    const base = `${input.estate} - ${input.block}${input.compartment} - Compartment Road ${input.compartmentRoad}`;
    return detail ? `${base} - ${detail}` : base;
  }

  return input.location || input.estate;
}

const createIncidentSchema = z
  .object({
    incidentDate: incidentDateSchema,
    location: optionalText(150, "Lokasi"),
    estate: estateSchema,
    locationType: locationTypeSchema,
    block: optionalText(10, "Blok"),
    compartment: optionalText(20, "Kompartemen"),
    haulingRoad: optionalText(80, "Jalan hauling"),
    compartmentRoad: optionalText(50, "Nomor jalan kompartemen"),
    locationDetail: optionalText(80, "Detail lokasi"),
    department: z
      .string()
      .trim()
      .min(1, "Departemen wajib diisi.")
      .max(150, "Departemen maksimal 150 karakter."),
    type: z
      .string()
      .trim()
      .min(1, "Jenis incident wajib diisi.")
      .max(150, "Jenis incident maksimal 150 karakter."),
    severity: severitySchema.default("LOW"),
    objectInvolved: optionalText(255, "Objek yang terlibat"),
    description: z
      .string()
      .trim()
      .min(5, "Deskripsi incident minimal 5 karakter.")
      .max(20_000, "Deskripsi incident terlalu panjang."),
    unsafeAction: optionalText(255, "Unsafe action"),
    sopViolation: z.boolean().nullable().optional().default(null),
    unsafeCondition: optionalText(255, "Unsafe condition"),
    contributingFactor: optionalText(20_000, "Faktor kontribusi"),
    rootCauseCategory: optionalText(150, "Kategori akar penyebab"),
    initialRootCause: optionalText(20_000, "Dugaan akar penyebab"),
    initialActionPlan: optionalText(20_000, "Initial corrective action"),
    initialPic: optionalText(200, "PIC usulan"),
    initialTargetDate: optionalDateSchema
  })
  .strict()
  .superRefine((input, context) => {
    if (input.estate === "MO") {
      if (input.locationType !== "MO") {
        context.addIssue({
          code: "custom",
          path: ["locationType"],
          message: "Estate MO harus menggunakan tipe lokasi MO."
        });
      }
    } else {
      if (input.locationType === "MO") {
        context.addIssue({
          code: "custom",
          path: ["locationType"],
          message: "Tipe lokasi MO hanya dapat digunakan untuk estate MO."
        });
      }

      if (
        ["BLOCK_COMPARTMENT", "COMPARTMENT_ROAD"].includes(
          input.locationType
        )
      ) {
        if (!input.block) {
          context.addIssue({
            code: "custom",
            path: ["block"],
            message: "Blok wajib diisi untuk lokasi ini."
          });
        } else if (!/^[A-Z]$/i.test(input.block)) {
          context.addIssue({
            code: "custom",
            path: ["block"],
            message: "Blok harus berupa satu huruf A sampai Z."
          });
        }

        if (!input.compartment) {
          context.addIssue({
            code: "custom",
            path: ["compartment"],
            message: "Kompartemen wajib diisi untuk lokasi ini."
          });
        } else if (!/^\d{1,3}$/.test(input.compartment)) {
          context.addIssue({
            code: "custom",
            path: ["compartment"],
            message: "Kompartemen harus berupa angka 1 sampai 999."
          });
        } else {
          const compartmentNumber = Number(input.compartment);

          if (compartmentNumber < 1 || compartmentNumber > 999) {
            context.addIssue({
              code: "custom",
              path: ["compartment"],
              message: "Kompartemen harus berada pada rentang 1 sampai 999."
            });
          }
        }
      }

      if (input.locationType === "HAULING_ROAD" && !input.haulingRoad) {
        context.addIssue({
          code: "custom",
          path: ["haulingRoad"],
          message: "Nama atau kode jalan hauling wajib diisi."
        });
      }

      if (
        input.locationType === "COMPARTMENT_ROAD" &&
        !input.compartmentRoad
      ) {
        context.addIssue({
          code: "custom",
          path: ["compartmentRoad"],
          message: "Nomor atau kode jalan kompartemen wajib diisi."
        });
      }
    }

    const normalized = {
      ...input,
      block: input.block?.toUpperCase() || null
    };
    const generatedLocation = buildLocationLabel(normalized);

    if (generatedLocation.length > 150) {
      context.addIssue({
        code: "custom",
        path: ["locationDetail"],
        message:
          "Gabungan informasi lokasi terlalu panjang. Persingkat detail lokasi."
      });
    }
  })
  .transform((input) => ({
    ...input,
    block: input.block?.toUpperCase() || null
  }));

function createValidationError(zodError) {
  const firstIssue = zodError.issues?.[0];
  const error = new Error(
    firstIssue?.message || "Data laporan incident tidak valid."
  );

  error.statusCode = 422;
  error.details = zodError.issues;
  return error;
}

export function validateCreateIncidentInput(payload) {
  const result = createIncidentSchema.safeParse(payload);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

const incidentStatusSchema = z.enum([
  "PENDING",
  "REJECTED",
  "INVESTIGATION",
  "CORRECTIVE_ACTION",
  "MANAGEMENT_REVIEW",
  "REVISION_REQUIRED",
  "CLOSED"
]);

const positiveIntegerFromQuery = (defaultValue, maximum = 10_000) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return defaultValue;
      }

      return Number(value);
    },
    z.number().int().min(1).max(maximum)
  );

const listIncidentsQuerySchema = z
  .object({
    page: positiveIntegerFromQuery(1, 100_000),
    limit: positiveIntegerFromQuery(20, 100),
    search: z.string().trim().max(150).optional().default(""),
    status: incidentStatusSchema.optional(),
    severity: severitySchema.optional(),
    estate: z.string().trim().max(50).optional(),
    locationType: z.string().trim().max(50).optional(),
    department: z.string().trim().max(150).optional(),
    type: z.string().trim().max(150).optional(),
    sortBy: z
      .enum(["incidentDate", "createdAt", "updatedAt", "severity", "status"])
      .optional()
      .default("incidentDate"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc")
  })
  .passthrough();

const incidentIdentifierSchema = z
  .string()
  .trim()
  .min(1, "ID incident wajib tersedia.")
  .max(100, "ID incident tidak valid.");

const incidentDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: optionalText(5_000, "Alasan penolakan")
  })
  .strict()
  .superRefine((input, context) => {
    if (
      input.decision === "REJECT" &&
      (!input.rejectionReason || input.rejectionReason.trim().length < 3)
    ) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "Alasan penolakan wajib diisi minimal 3 karakter."
      });
    }
  })
  .transform((input) => ({
    decision: input.decision,
    rejectionReason:
      input.decision === "REJECT" ? input.rejectionReason : null
  }));

export function validateListIncidentsQuery(query) {
  const result = listIncidentsQuerySchema.safeParse(query);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

export function validateIncidentIdentifier(value) {
  const result = incidentIdentifierSchema.safeParse(value);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

export function validateIncidentDecisionInput(payload) {
  const result = incidentDecisionSchema.safeParse(payload);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}
