import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import sendEmail from "@/lib/sendEmail";
import {
  PASSWORD_RESET_COOKIE,
  PASSWORD_RESET_TTL_SECONDS,
  signPasswordResetChallenge,
  verifyPasswordResetChallenge,
} from "@/lib/auth/password-reset-challenge";

const OTP_TTL_MS = PASSWORD_RESET_TTL_SECONDS * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const GENERIC_RESPONSE = {
  success: true,
  message: "If an account uses this email, a password reset code has been sent.",
};

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, name: true, updatedAt: true },
    });

    if (!user?.email) {
      const response = NextResponse.json(
        { success: false, error: "No account is registered with this email address." },
        { status: 404 }
      );
      response.cookies.set(PASSWORD_RESET_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const existingToken = request.cookies.get(PASSWORD_RESET_COOKIE)?.value;
    if (existingToken) {
      try {
        const existing = await verifyPasswordResetChallenge(existingToken);
        if (existing.email === email && Date.now() - existing.sentAt < RESEND_WAIT_MS) {
          return NextResponse.json(GENERIC_RESPONSE);
        }
      } catch {
        // Expired or invalid challenge; issue a new one below.
      }
    }

    const now = Date.now();
    const expiresAt = now + OTP_TTL_MS;
    const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const token = await signPasswordResetChallenge(
      {
        purpose: "password-reset",
        userId: user.id,
        email: user.email,
        otp,
        userUpdatedAt: user.updatedAt.getTime(),
        sentAt: now,
        attempts: 0,
      },
      expiresAt
    );

    const sent = await sendEmail(
      user.email,
      "Your Iccha password reset code",
      `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#292524">
        <h2 style="color:#831843">Reset your password</h2>
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>Use this one-time code to reset your Iccha account password:</p>
        <p style="font-size:30px;font-weight:bold;letter-spacing:8px;color:#831843;padding:16px 0">${otp}</p>
        <p>This code expires in 5 minutes and can only be used once. If you did not request this, you can ignore this email.</p>
      </div>`
    );

    if (!sent) {
      return NextResponse.json(
        { success: false, error: "We could not send the email right now. Please try again shortly." },
        { status: 503 }
      );
    }

    const response = NextResponse.json(GENERIC_RESPONSE);
    response.cookies.set(PASSWORD_RESET_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: PASSWORD_RESET_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Password reset OTP request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === "development" && error instanceof Error
          ? `Could not start password reset: ${error.message}`
          : "Could not start password reset. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(PASSWORD_RESET_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}
