import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import { generatedDir } from "@/lib/server/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_NAME = /^[\w.-]+$/;

/** 一键打包：把某次任务生成的全部文件压缩成一个 zip 下载（本地开发兜底） */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mission: string }> }
) {
  const { mission } = await params;
  if (!SAFE_NAME.test(mission)) {
    return NextResponse.json({ error: "非法路径" }, { status: 400 });
  }

  const dir = path.join(generatedDir(), mission);
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter(
      (name) => !name.startsWith(".") && SAFE_NAME.test(name)
    );
  } catch {
    return NextResponse.json(
      { error: "该任务暂无文件（线上环境请使用页面内的下载按钮）" },
      { status: 404 }
    );
  }
  if (!files.length) {
    return NextResponse.json({ error: "该任务暂无文件" }, { status: 404 });
  }

  const zip = new JSZip();
  for (const name of files) {
    const data = await fs.readFile(path.join(dir, name));
    zip.file(name, data);
  }
  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  const zipName = `交付成果_${mission}.zip`;
  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`,
    },
  });
}
