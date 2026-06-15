import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/mail";
import { readAuthFromRequest } from "@/lib/server/google";
import { deliverEmail } from "@/lib/server/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 直接向指定邮箱发信（可附带某次任务的交付物） */
export async function POST(req: Request) {
  let body: {
    to?: string;
    missionId?: string;
    subject?: string;
    html?: string;
    prompt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const to = normalizeEmail(body.to ?? "");
  if (!isValidEmail(to)) {
    return NextResponse.json({ error: "请填写有效的收件人邮箱" }, { status: 400 });
  }

  const missionId =
    body.missionId && /^[\w-]+$/.test(body.missionId) ? body.missionId : undefined;
  const subject =
    body.subject?.trim() ||
    (body.prompt
      ? `【任务交付】${body.prompt.slice(0, 40)}`
      : "【AI Virtual Office】邮件测试");
  const html =
    body.html?.trim() ||
    (body.prompt
      ? `<h2>📦 任务交付</h2><p><b>指令：</b>${body.prompt}</p><p>由 AI Agent Virtual Office 发送。</p>`
      : "<p>这是一封来自 AI Agent Virtual Office 的测试邮件，邮件通道工作正常。</p>");

  try {
    const result = await deliverEmail({
      to,
      subject,
      html,
      missionId,
      gmailAuth: readAuthFromRequest(req),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-mail] 失败:", err);
    return NextResponse.json(
      { summary: `发信失败：${message}`, mode: "mock" },
      { status: 500 }
    );
  }
}
