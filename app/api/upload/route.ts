import { NextResponse } from "next/server";
import { Readable } from "stream";
import { getDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

const MAX_FILES = 10;
const MAX_SIZE_MB = 20;

function isAllowedType(type: string) {
  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ].includes(type);
}

function bufferToStream(buffer: Buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: Request) {
  try {
    const pin = req.headers.get("x-gallery-pin") || "";

    if (process.env.GALLERY_PIN && pin !== process.env.GALLERY_PIN) {
      return NextResponse.json({ error: "Invalid event code." }, { status: 401 });
    }

    const form = await req.formData();
    const files = form.getAll("files");

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed at once.` },
        { status: 400 }
      );
    }

    const drive = getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json({ error: "Missing Drive folder ID." }, { status: 500 });
    }

    const uploaded: { id: string; name: string }[] = [];

    for (const item of files) {
      if (!(item instanceof File)) continue;

      if (!isAllowedType(item.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${item.type}` },
          { status: 400 }
        );
      }

      const sizeMb = item.size / (1024 * 1024);
      if (sizeMb > MAX_SIZE_MB) {
        return NextResponse.json(
          { error: `${item.name} is larger than ${MAX_SIZE_MB}MB.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await item.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await drive.files.create({
        requestBody: {
          name: item.name || `photo-${Date.now()}.jpg`,
          parents: [folderId],
        },
        media: {
          mimeType: item.type,
          body: bufferToStream(buffer),
        },
        fields: "id,name",
      });

      if (result.data.id) {
        uploaded.push({
          id: result.data.id,
          name: result.data.name || "photo",
        });
      }
    }

    return NextResponse.json({ ok: true, uploaded });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}