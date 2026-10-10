import { NextRequest, NextResponse } from "next/server";
import { getPhoto } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = getPhoto(Number(id));
  if (!photo) {
    return new NextResponse("Photo introuvable.", { status: 404 });
  }
  const body = Buffer.from(photo.data);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": photo.mime_type || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
