

import { NextResponse } from "next/server";
import sendEmail from "@/lib/sendEmail"; // adjust this import to wherever sendEmail actually lives in your project
import { prisma } from "@/lib/db";
import { defaultContact } from "@/lib/site-content";

/* =========================================================================
   POST /api/contact
   Receives the Iccha Store contact form and emails it using your existing
   sendEmail(to, subject, html) helper (nodemailer + Gmail).

   Env vars used:
   - EMAIL_USER          the Gmail address sendEmail sends FROM (already
                          required by sendEmail itself)
   - CONTACT_TO_EMAIL    optional — where enquiries should land. Falls back
                          to EMAIL_USER, so if you skip this, enquiries just
                          arrive in the same inbox you send from.
   ========================================================================= */

// type ContactPayload = {
//   name: string;
//   shopName: string;
//   phone: string;
//   email: string;
//   city: string;
//   message: string;
// };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ContactPayload = {
  name: string;
  shopName: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  whatsappNumber?: string;
};

export async function POST(req: Request) {
  let body: Partial<ContactPayload>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { name, shopName, phone, email, city, message } = body;

  if (!name || !phone || !city || !message) {
    return NextResponse.json(
      {
        error: "Name, phone, city, and message are required.",
      },
      { status: 400 }
    );
  }

  const configured = await prisma.$queryRaw<Array<{ content: unknown }>>`SELECT "content" FROM "SiteContent" WHERE "key" = 'contact' LIMIT 1`.catch(() => []);
  const contactContent = configured[0]?.content && typeof configured[0].content === "object" ? configured[0].content as Record<string, unknown> : defaultContact;
  const requestedNumber = typeof body.whatsappNumber === "string" ? body.whatsappNumber : "";
  const whatsappNumber = requestedNumber.replace(/\D/g, "") || String(contactContent.whatsapp || defaultContact.whatsapp).replace(/\D/g, "");

  const whatsappMessage = `
New Iccha Store Enquiry

Name: ${name}
Shop Name: ${shopName || "—"}
Phone: ${phone}
Email: ${email || "—"}
City: ${city}

Message:
${message}
`.trim();

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;
  
  return NextResponse.json({
    success: true,
    whatsappUrl,
  });
}
