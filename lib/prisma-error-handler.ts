import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

/**
 * Interface untuk error response yang konsisten
 */
export interface PrismaErrorResponse {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Mapping Prisma error codes ke pesan user-friendly
 */
const ERROR_MESSAGES: Record<string, string> = {
  P2000: "The provided value is too long for the field",
  P2001: "Record not found",
  P2002: "Duplicate entry", // Will be customized based on field
  P2003: "Foreign key constraint failed",
  P2004: "Database constraint failed",
  P2011: "Null constraint violation",
  P2012: "Missing required value",
  P2013: "Missing required argument",
  P2014: "Relation violation",
  P2015: "Related record not found",
  P2016: "Query interpretation error",
  P2017: "Relations not connected",
  P2018: "Required connected records not found",
  P2019: "Input error",
  P2020: "Value out of range",
  P2021: "Table does not exist",
  P2022: "Column does not exist",
  P2023: "Inconsistent column data",
  P2024: "Connection timeout",
  P2025: "Record to delete does not exist",
  P2026: "Database query error",
  P2027: "Multiple errors occurred",
};

/**
 * Mapping field names ke pesan yang lebih user-friendly (Indonesia)
 */
const FIELD_NAMES: Record<string, string> = {
  email: "Email",
  noWa: "Nomor WhatsApp",
  name: "Nama",
  password: "Password",
  phone: "Nomor Telepon",
  username: "Username",
};

/**
 * Extract target field dari Prisma error meta
 */
function extractTargetField(meta?: Record<string, unknown>): string {
  if (!meta?.target) return "field";

  if (Array.isArray(meta.target)) {
    return meta.target[0] as string;
  }

  if (typeof meta.target === "string") {
    // Handle "Users_noWa_key" format - extract field name
    const match = meta.target.match(/Users_(\w+)_key/);
    if (match) {
      return match[1]; // Return "noWa" from "Users_noWa_key"
    }
    return meta.target;
  }

  return "field";
}

/**
 * Generate user-friendly error message untuk duplicate entry
 */
function getDuplicateMessage(field: string): string {
  const fieldName = FIELD_NAMES[field] || field;
  return `${fieldName} sudah terdaftar. Silakan gunakan ${fieldName.toLowerCase()} yang lain.`;
}

/**
 * Handle Prisma errors dan return response yang konsisten
 * Support both PrismaClientKnownRequestError instance dan plain object
 */
export function handlePrismaError(error: unknown): PrismaErrorResponse | null {
  // Check if it's a Prisma error instance
  if (error instanceof PrismaClientKnownRequestError) {
    const errorCode = error.code;
    const field = extractTargetField(error.meta);
    return buildErrorResponse(errorCode, field);
  }

  // Check if it's a plain object with Prisma error properties
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "name" in error &&
    error.name === "PrismaClientKnownRequestError"
  ) {
    const errorCode = (error as { code: string }).code;
    const meta = (error as { meta?: Record<string, unknown> }).meta;
    const field = extractTargetField(meta);
    return buildErrorResponse(errorCode, field);
  }

  return null; // Bukan Prisma error
}

/**
 * Build error response based on error code and field
 */
function buildErrorResponse(
  errorCode: string,
  field: string
): PrismaErrorResponse {
  // Handle specific error codes
  switch (errorCode) {
    case "P2002": // Unique constraint violation
      return {
        message: getDuplicateMessage(field),
        field,
        code: errorCode,
      };

    case "P2003": // Foreign key constraint
      return {
        message: "Data yang Anda rujuk tidak ditemukan di database",
        field,
        code: errorCode,
      };

    case "P2025": // Record not found
      return {
        message: "Data yang Anda cari tidak ditemukan",
        code: errorCode,
      };

    case "P2011": // Null constraint
      return {
        message: `${FIELD_NAMES[field] || field} wajib diisi`,
        field,
        code: errorCode,
      };

    case "P2000": // Value too long
      return {
        message: `${FIELD_NAMES[field] || field} terlalu panjang`,
        field,
        code: errorCode,
      };

    case "P2024": // Connection timeout
      return {
        message: "Koneksi database timeout. Silakan coba lagi.",
        code: errorCode,
      };

    default:
      // Generic error message
      return {
        message: ERROR_MESSAGES[errorCode] || "Terjadi kesalahan pada database",
        code: errorCode,
      };
  }
}

/**
 * Wrapper function untuk menghandle Prisma operations dengan error handling
 */
export async function handlePrismaOperation<T>(
  operation: () => Promise<T>
): Promise<
  { success: true; data: T } | { success: false; error: PrismaErrorResponse }
> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const prismaError = handlePrismaError(error);

    if (prismaError) {
      return { success: false, error: prismaError };
    }

    // Non-Prisma error
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: {
        message: "Terjadi kesalahan yang tidak terduga",
        code: "UNKNOWN",
      },
    };
  }
}
