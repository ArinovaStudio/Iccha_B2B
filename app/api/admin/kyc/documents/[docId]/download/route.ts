
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guard";
import { LocalStorageService } from "@/lib/services/storageService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const guard = await requireStaff(request);

  if ("error" in guard) {
    return NextResponse.json(
      { success: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { docId } = await params;

  const inlineRequested =
    request.nextUrl.searchParams.get("inline") === "true";

  const doc = await prisma.kYCDocument.findUnique({
    where: { id: docId },
    include: {
      mediaAsset: true,
    },
  });

  if (!doc) {
    return NextResponse.json(
      { success: false, error: "Document not found" },
      { status: 404 }
    );
  }

  if (!doc.mediaAsset) {
    return NextResponse.json(
      { success: false, error: "Media asset not found" },
      { status: 404 }
    );
  }

  const fileData = await LocalStorageService.getFileBuffer(
    doc.mediaAsset.storageKey
  );

  if (!fileData) {
    return NextResponse.json(
      { success: false, error: "File missing from storage" },
      { status: 404 }
    );
  }

  const mimeType = doc.mimeType || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");

  const disposition =
    inlineRequested && isImage ? "inline" : "attachment";

  const originalFilename = doc.originalFilename || "document";

  // ASCII-safe fallback filename for the HTTP header.
  const fallbackFilename = originalFilename
    .replace(/[\r\n"]/g, "")
    .replace(/[\\/]/g, "_")
    .replace(/[^\x20-\x7E]/g, "_");

  // UTF-8 encoded filename preserves the original Unicode characters.
  const encodedFilename = encodeURIComponent(originalFilename).replace(
    /['()*]/g,
    (char) =>
      `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return new NextResponse(
    new Uint8Array(fileData.buffer),
    {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition":
          `${disposition}; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
