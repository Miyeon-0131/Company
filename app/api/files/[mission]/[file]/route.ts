import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
};

const SAFE_NAME = /^[\w.\u4e00-\u9fa5-]+$/;

/** 下载任务生成的交付文件 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mission: string; file: string }> }
) {
  const { mission, file } = await params;
  const fileName = decodeURIComponent(file);

  if (!SAFE_NAME.test(mission) || !SAFE_NAME.test(fileName)) {
    return NextResponse.json({ error: "非法路径" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "generated", mission, fileName);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const inline = [".png", ".jpg", ".webp", ".html", ".json"].includes(ext);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
