import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from "jose";

export interface JWTPayload extends JoseJWTPayload {
  sub: string; // JWT standard requires sub to be string
  email?: string;
  role?: string;
  userId?: number; // Store numeric ID separately if needed
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Generate JWT token dengan payload custom
 * @param payload - Data yang akan dienkripsi dalam token
 * @param expiresIn - Waktu expired (default: 1d)
 */
export async function generateToken(
  payload: JWTPayload,
  expiresIn: string = "1d"
) {
  const secret = getSecret();
  const jwtPayload = {
    ...payload,
    sub: String(payload.sub), // Convert to string for JWT standard
  };
  return await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn) // expired 1 jam (default)
    .sign(secret);
}

/**
 * Verifikasi JWT token dan return payload jika valid
 * @param token - JWT token string
 * @returns Decoded payload atau null jika invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Decode token tanpa verifikasi (hanya untuk debug/development)
 * @param token - JWT token string
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    return payload as JWTPayload;
  } catch (error) {
    console.error("JWT decode failed:", error);
    return null;
  }
}

/**
 * Generate refresh token dengan expired time lebih lama
 * @param payload - Data yang akan dienkripsi dalam token
 */
export async function generateRefreshToken(payload: JWTPayload) {
  return generateToken(payload, "7d"); // expired 7 hari
}

/**
 * Extract token dari Authorization header
 * @param authHeader - Authorization header value
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}
