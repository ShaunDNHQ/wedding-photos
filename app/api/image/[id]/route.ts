import { NextResponse } from "next/server";
import { getDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const drive = getDrive();

    const meta = await drive.files.get({
      fileId: id,
      fields: "mimeType,name",
    });

    const mimeType = meta.data.mimeType || "application/octet-stream";

    const fileResponse = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "stream" }
    );

    return new NextResponse(fileResponse.data as ReadableStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Image not found", { status: 404 });
  }
}