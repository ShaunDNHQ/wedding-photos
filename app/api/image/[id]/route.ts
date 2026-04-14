import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

function nodeStreamToWebStream(stream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        const uint8 =
          chunk instanceof Buffer ? new Uint8Array(chunk) : new Uint8Array(Buffer.from(chunk));
        controller.enqueue(uint8);
      });

      stream.on("end", () => {
        controller.close();
      });

      stream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      stream.destroy();
    },
  });
}

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

    const webStream = nodeStreamToWebStream(fileResponse.data as Readable);

    return new NextResponse(webStream, {
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
