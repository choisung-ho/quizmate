import { env as workerEnv } from "cloudflare:workers";

type JsonRecord = Record<string, unknown>;

const NOTION_API_BASE = "https://api.notion.com/v1";
const DEFAULT_NOTION_VERSION = "2026-03-11";

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" ? (value as JsonRecord) : undefined;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function runtimeValue(name: string): string | undefined {
  try {
    const value = (workerEnv as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.length > 0) return value;
  } catch {
    // The Cloudflare binding is unavailable during a plain local type check.
  }

  if (typeof process !== "undefined") {
    const value = process.env[name];
    if (value) return value;
  }

  return undefined;
}

function json(data: JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeNotionId(value: string): string | null {
  const uuid = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0];

  const compact = value.match(/[0-9a-f]{32}/i);
  if (!compact) return null;

  const id = compact[0];
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

function plainText(richText: unknown): string {
  if (!Array.isArray(richText)) return "";
  return richText
    .map((item) => {
      const record = asRecord(item);
      if (typeof record?.plain_text === "string") return record.plain_text;
      const text = asRecord(record?.text);
      if (typeof text?.content === "string") return text.content;
      return "";
    })
    .join("");
}

function pageTitle(page: JsonRecord): string {
  const properties = asRecord(page.properties);
  if (properties) {
    for (const property of Object.values(properties)) {
      const record = asRecord(property);
      if (record?.type === "title") {
        const title = plainText(record.title);
        if (title) return title;
      }
    }
  }

  const emoji = textValue(asRecord(page.icon)?.emoji);
  return emoji ? `${emoji} Notion 페이지` : "Notion 페이지";
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<mention-page url="[^"]+">([^<]+)<\/mention-page>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blockText(block: JsonRecord): string {
  const type = textValue(block.type);
  const data = type ? asRecord(block[type]) : undefined;
  if (!type || !data) return "";

  if (type === "child_page") return textValue(data.title);
  if (type === "child_database") return textValue(data.title);
  if (type === "code") return plainText(data.rich_text);
  if (type === "equation") return textValue(data.expression);
  if (type === "table_row") {
    return Array.isArray(data.cells) ? data.cells.map(plainText).join(" | ") : "";
  }

  return plainText(data.rich_text);
}

async function notionFetch(path: string, token: string, version: string): Promise<Response> {
  return fetch(`${NOTION_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
    },
  });
}

async function readBlockChildren(
  blockId: string,
  token: string,
  version: string,
  depth = 0,
): Promise<string[]> {
  if (depth > 4) return [];

  const pieces: string[] = [];
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);

    const response = await notionFetch(
      `/blocks/${blockId}/children?${query.toString()}`,
      token,
      version,
    );
    if (!response.ok) return pieces;

    const payload = (await response.json()) as JsonRecord;
    const blocks = Array.isArray(payload.results)
      ? payload.results.map(asRecord).filter((block): block is JsonRecord => Boolean(block))
      : [];

    for (const block of blocks) {
      const text = blockText(block);
      if (text) pieces.push(text);
      if (block.has_children === true && typeof block.id === "string") {
        pieces.push(...(await readBlockChildren(block.id, token, version, depth + 1)));
      }
    }

    cursor = payload.has_more === true && typeof payload.next_cursor === "string"
      ? payload.next_cursor
      : undefined;
  } while (cursor);

  return pieces;
}

export async function POST(request: Request): Promise<Response> {
  const token = runtimeValue("NOTION_TOKEN") ?? runtimeValue("NOTION_API_KEY");
  if (!token) {
    return json(
      {
        error:
          "노션 연결이 아직 설정되지 않았습니다. 서버 환경 변수에 NOTION_TOKEN을 추가한 뒤 다시 시도해 주세요.",
      },
      503,
    );
  }

  let body: JsonRecord;
  try {
    body = (await request.json()) as JsonRecord;
  } catch {
    return json({ error: "요청 형식을 확인해 주세요." }, 400);
  }

  const rawId = typeof body.id === "string" ? body.id.trim() : "";
  const pageId = normalizeNotionId(rawId);
  if (!pageId) {
    return json({ error: "유효한 노션 페이지 URL 또는 페이지 ID를 입력해 주세요." }, 400);
  }

  const version = runtimeValue("NOTION_API_VERSION") ?? DEFAULT_NOTION_VERSION;

  try {
    const pageResponse = await notionFetch(`/pages/${pageId}`, token, version);
    if (!pageResponse.ok) {
      const errorPayload = (await pageResponse.json().catch(() => ({}))) as JsonRecord;
      const message = textValue(errorPayload.message) || "페이지에 접근할 수 없습니다.";
      return json(
        {
          error: `${message} 노션에서 해당 페이지를 연결에 공유했는지 확인해 주세요.`,
        },
        pageResponse.status === 404 ? 404 : 502,
      );
    }

    const page = (await pageResponse.json()) as JsonRecord;
    const markdownResponse = await notionFetch(`/pages/${pageId}/markdown`, token, version);

    let text = "";
    let blockCount = 0;
    let truncated = false;

    if (markdownResponse.ok) {
      const markdownPayload = (await markdownResponse.json()) as JsonRecord;
      text = markdownToText(textValue(markdownPayload.markdown));
      truncated = Boolean(markdownPayload.truncated);
      blockCount = Array.isArray(markdownPayload.unknown_block_ids)
        ? markdownPayload.unknown_block_ids.length
        : text ? text.split(/\n+/).filter(Boolean).length : 0;
    }

    if (!text) {
      const blocks = await readBlockChildren(pageId, token, version);
      text = blocks.join("\n").trim();
      blockCount = blocks.length;
    }

    if (!text) {
      return json({ error: "페이지에서 읽을 수 있는 텍스트를 찾지 못했습니다." }, 422);
    }

    return json({
      id: pageId,
      title: pageTitle(page),
      url: textValue(page.url),
      text: text.slice(0, 40000),
      blockCount,
      truncated,
    });
  } catch {
    return json({ error: "노션 서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 502);
  }
}
