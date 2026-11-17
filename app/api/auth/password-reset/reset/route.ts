import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  PASSWORD_RESET_COOKIE,
  PASSWORD_RESET_TTL_SECONDS,
  signPasswordResetChallenge,
  verifyPasswordResetChallenge,
} from "@/lib/auth/password-reset-challenge";

const MAX_ATTEMPTS = 5;

const resetSchema = z.object({
  email: z.string().trim().email().max(254),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export async function POST(request: NextRequest) {
  const clearCookie = (response: NextResponse) => {
    response.cookies.set(PASSWORD_RESET_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  try {
    const parsed = resetSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid reset details." },
        { status: 400 }
      );
    }

    const token = request.cookies.get(PASSWORD_RESET_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "This code is invalid or expired. Request a new code." },
        { status: 400 }
      );
    }

    let challenge;
    try {
      challenge = await verifyPasswordResetChallenge(token);
    } catch {
      return clearCookie(NextResponse.json(
        { success: false, error: "This code is invalid or expired. Request a new code." },
        { status: 400 }
      ));
    }

    if (challenge.email !== parsed.data.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "This code does not match the email address." },
        { status: 400 }
      );
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return clearCookie(NextResponse.json(
        { success: false, error: "Too many incorrect attempts. Request a new code." },
        { status: 429 }
      ));
    }

    if (parsed.data.otp !== challenge.otp) {
      const attempts = challenge.attempts + 1;
      const response = NextResponse.json(
        {
          success: false,
          error: attempts >= MAX_ATTEMPTS
            ? "Too many incorrect attempts. Request a new code."
            : `Incorrect code. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`,
        },
        { status: attempts >= MAX_ATTEMPTS ? 429 : 400 }
      );

      if (attempts >= MAX_ATTEMPTS) return clearCookie(response);

      const expiresAt = Number(challenge.exp) * 1000;
      const updatedToken = await signPasswordResetChallenge(
        { ...challenge, attempts },
        expiresAt
      );
      response.cookies.set(PASSWORD_RESET_COOKIE, updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
      });
      return response;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const updated = await prisma.user.updateMany({
      where: {
        id: challenge.userId,
        email: challenge.email,
        updatedAt: new Date(challenge.userUpdatedAt),
      },
      data: { passwordHash },
    });

    if (updated.count !== 1) {
      return clearCookie(NextResponse.json(
        { success: false, error: "This code is invalid or expired. Request a new code." },
        { status: 400 }
      ));
    }

    const response = NextResponse.json({
      success: true,
      message: "Your password has been reset. Sign in with your new password.",
    });
    return clearCookie(response);
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { success: false, error: "Could not reset your password. Please try again." },
      { status: 500 }
    );
  }
}
