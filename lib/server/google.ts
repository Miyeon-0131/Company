/**
 * Gmail OAuth 工具：让用户用 Google 账号授权，应用即可代表用户发信。
 * 需要在 .env.local 配置 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET。
 */

export const GMAIL_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

export const AUTH_COOKIE = "gmail_auth";

export interface GmailAuth {
  email: string;
  refreshToken: string;
}

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

/** 第一步：构造 Google 授权同意页 URL */
export function buildAuthUrl(origin: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline", // 拿到 refresh_token
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}

/** 第二步：用授权码换取 token */
export async function exchangeCode(
  code: string,
  origin: string
): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  return res.json();
}

/** 用 refresh_token 换取新的 access_token（发信前调用，免去过期判断） */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google refresh ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** 从 id_token (JWT) 解出邮箱 */
export function emailFromIdToken(idToken?: string): string {
  if (!idToken) return "";
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString("utf8")
    );
    return payload.email ?? "";
  } catch {
    return "";
  }
}

/** 把 {email, refreshToken} 编码成 cookie 值 */
export function encodeAuthCookie(auth: GmailAuth): string {
  return Buffer.from(JSON.stringify(auth)).toString("base64url");
}

export function decodeAuthCookie(value?: string): GmailAuth | null {
  if (!value) return null;
  try {
    const auth = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as GmailAuth;
    return auth.email && auth.refreshToken ? auth : null;
  } catch {
    return null;
  }
}

/** 从请求头里读出已登录的 Gmail 授权 */
export function readAuthFromRequest(req: Request): GmailAuth | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  if (!match) return null;
  return decodeAuthCookie(decodeURIComponent(match.split("=").slice(1).join("=")));
}

/** 构造 RFC822 邮件并通过 Gmail API 发送（支持附件） */
export async function sendGmail(
  refreshToken: string,
  options: {
    from: string;
    to: string;
    subject: string;
    html: string;
    attachments: { filename: string; content: Buffer }[];
  }
): Promise<void> {
  const accessToken = await refreshAccessToken(refreshToken);
  const boundary = `b_${Date.now().toString(36)}`;
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`;

  const parts: string[] = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${subjectEncoded}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(options.html).toString("base64").replace(/(.{76})/g, "$1\r\n"),
  ];

  for (const att of options.attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: application/octet-stream; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      att.content.toString("base64").replace(/(.{76})/g, "$1\r\n")
    );
  }
  parts.push(`--${boundary}--`);

  const raw = Buffer.from(parts.join("\r\n")).toString("base64url");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );
  if (!res.ok) throw new Error(`Gmail send ${res.status}: ${await res.text()}`);
}
