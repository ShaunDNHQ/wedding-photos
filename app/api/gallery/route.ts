import { NextResponse } from "next/server";
import { getDrive } from "@/lib/googleDrive";

export const runtime = "nodejs";

export async function GET() {
  try {
    const drive = getDrive();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json({ error: "Missing Drive folder ID." }, { status: 500 });
    }

    const result = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      orderBy: "createdTime desc",
      pageSize: 100,
      fields: "files(id,name,createdTime,mimeType)",
    });

    const files = (result.data.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      url: `/api/image/${file.id}`,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load gallery." }, { status: 500 });
  }
}