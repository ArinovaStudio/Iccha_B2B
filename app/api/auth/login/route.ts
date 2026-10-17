import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/session";

const PENDING_STATUSES = ["APPLICATION_RECEIVED", "UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED"];

// --- helpers to tell an email apart from a phone number -------------------

function isEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneFormat(value: string): boolean {
  // allow spaces, dashes, parens while typing, then check the digits
  const digitsOnly = value.replace(/[\s\-()]/g, "");
  return /^\+?\d{7,15}$/.test(digitsOnly);
}

function normalizePhone(value: string): string {
  // keep a leading + if present, strip everything else that isn't a digit
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

// --- schema -----------------------------------------------------------

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or phone number is required")
    .refine((val) => isEmailFormat(val) || isPhoneFormat(val), {
      message: "Enter a valid email or phone number",
    }),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const usingEmail = isEmailFormat(identifier);

    let user = await prisma.user.findFirst({
      where: usingEmail
        ? { email: identifier.toLowerCase() }
        : { mobile: normalizePhone(identifier) },
      include: { retailerProfile: true },
    });

    // Mobile login: the number may have been saved with a country code
    // (+91...) but typed without it (or the other way round), so fall back
    // to matching on the last 10 digits.
    if (!user && !usingEmail) {
      const last10 = normalizePhone(identifier).replace(/\D/g, "").slice(-10);
      if (last10.length === 10) {
        user = await prisma.user.findFirst({
          where: { mobile: { endsWith: last10 } },
          include: { retailerProfile: true },
        });
      }
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Approval gate — retailers only, staff roles skip this entirely
    if (user.role === "RETAILER") {
      const status = user.retailerProfile?.status;

      if (status && PENDING_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "PENDING_APPROVAL",
            message: "Your application is awaiting admin approval.",
          },
          { status: 403 }
        );
      }

      if (status === "DEACTIVATED") {
        const token = await createSessionToken({
          userId: user.id,
          role: user.role,
          email: user.email,
        });

        const response = NextResponse.json(
          {
            success: false,
            error: "DEACTIVATED",
            message:
              "Your retailer account has been deactivated due to inactivity.",
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              retailerStatus: status,
            },
          },
          { status: 403 }
        );

        response.cookies.set(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_DURATION_SECONDS,
        });

        return response;
      }

      if (status === "REJECTED" || status === "SUSPENDED") {
        return NextResponse.json(
          {
            success: false,
            error: status,
            message:
              status === "REJECTED"
                ? "Your application was not approved. Contact support for details."
                : "Your account has been suspended. Contact support.",
          },
          { status: 403 }
        );
      }
    }

    if (user.role === "VENDOR") {
      const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
      if (!vendorProfile || !vendorProfile.isActive) {
        return NextResponse.json(
          { success: false, error: "SUSPENDED", message: "Your vendor account is inactive. Contact support." },
          { status: 403 }
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createSessionToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        retailerStatus: user.retailerProfile?.status,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}