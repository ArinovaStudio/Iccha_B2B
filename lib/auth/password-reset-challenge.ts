import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const PASSWORD_RESET_COOKIE = "iccha_password_reset";
export const PASSWORD_RESET_TTL_SECONDS = 5 * 60;

export type PasswordResetChallenge = JWTPayload & {
  purpose: "password-reset";
  userId: string;
  email: string;
  otp: string;
  userUpdatedAt: number;
  sentAt: number;
  attempts: number;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signPasswordResetChallenge(
  challenge: PasswordResetChallenge,
  expiresAt: number
) {
  const payload = { ...challenge };
  delete payload.iat;
  delete payload.exp;
  delete payload.nbf;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(secretKey());
}

export async function verifyPasswordResetChallenge(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  if (
    payload.purpose !== "password-reset" ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.otp !== "string" ||
    typeof payload.userUpdatedAt !== "number" ||
    typeof payload.sentAt !== "number" ||
    typeof payload.attempts !== "number"
  ) {
    throw new Error("Invalid password reset challenge.");
  }
  return payload as PasswordResetChallenge;
}
