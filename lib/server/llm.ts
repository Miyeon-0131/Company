/** 从 Claude 回复中提取 JSON 对象（兼容纯 JSON 或 ```json 代码块） */
export function extractJsonObject<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("回复中未找到 JSON");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

/** 调用 Claude Messages API 生成文本 */
export async function chatClaude(system: string, user: string): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("未配置 CLAUDE_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const block = data.content?.find(
    (b: { type: string }) => b.type === "text"
  );
  if (!block?.text) throw new Error("Claude 返回内容为空");
  return block.text as string;
}
