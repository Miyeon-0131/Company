import JSZip from "jszip";
import { Artifact } from "@/lib/types";

function base64ToBytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 从内存缓存或服务器拉取完整 Artifact */
export async function resolveArtifact(
  artifact: Artifact,
  cache: Record<string, Artifact>
): Promise<Artifact | null> {
  if (artifact.dataBase64) return artifact;
  const cached = cache[artifact.url];
  if (cached?.dataBase64) return cached;
  try {
    const res = await fetch(artifact.url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
    return {
      ...artifact,
      dataBase64: btoa(bin),
      mimeType:
        artifact.mimeType ??
        res.headers.get("content-type") ??
        "application/octet-stream",
    };
  } catch {
    return null;
  }
}

/** 下载单个交付文件（优先浏览器缓存，线上与本地行为一致） */
export async function downloadArtifact(
  artifact: Artifact,
  cache: Record<string, Artifact>
): Promise<void> {
  const resolved = await resolveArtifact(artifact, cache);
  if (resolved?.dataBase64) {
    const blob = new Blob([base64ToBytes(resolved.dataBase64)], {
      type: resolved.mimeType ?? "application/octet-stream",
    });
    triggerBlobDownload(blob, resolved.name);
    return;
  }
  throw new Error(
    "文件已过期或不可用。请重新执行一次任务后再下载（线上环境文件不持久保存在服务器）。"
  );
}

/** 一键打包下载全部交付物 */
export async function downloadAllArtifacts(
  artifacts: Artifact[],
  cache: Record<string, Artifact>,
  missionId: string
): Promise<void> {
  const unique = new Map<string, Artifact>();
  artifacts.forEach((a) => unique.set(a.name, a));

  const resolved = await Promise.all(
    [...unique.values()].map((a) => resolveArtifact(a, cache))
  );
  const ready = resolved.filter((a): a is Artifact => !!a?.dataBase64);

  if (ready.length > 0) {
    const zip = new JSZip();
    ready.forEach((a) => zip.file(a.name, base64ToBytes(a.dataBase64!)));
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    triggerBlobDownload(blob, `交付成果_${missionId}.zip`);
    return;
  }

  // 本地开发兜底：走服务端 zip
  const res = await fetch(`/api/download/${missionId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ??
        "打包失败，请重新执行任务后再试"
    );
  }
  const blob = await res.blob();
  triggerBlobDownload(blob, `交付成果_${missionId}.zip`);
}
