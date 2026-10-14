type QuestionType = "multiple" | "short";
type Difficulty = "high" | "medium" | "low";

type GeneratedQuestion = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  acceptedAnswers?: string[];
  explanation: string;
  solutionSteps: string[];
  source: string;
  concept: string;
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanSource(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSentences(sourceText: string): string[] {
  const cleaned = cleanSource(sourceText);
  const chunks = cleaned
    .split(/(?<=[.!?。！？])\s+|\n+/u)
    .map((chunk) => chunk.replace(/^\d+[.)]\s*/, "").trim())
    .filter((chunk) => chunk.length >= 12);

  if (chunks.length > 0) return Array.from(new Set(chunks));

  return Array.from({ length: Math.ceil(cleaned.length / 120) }, (_, index) =>
    cleaned.slice(index * 120, index * 120 + 120).trim(),
  ).filter(Boolean);
}

function extractConcept(sentence: string): string {
  const definitionMatch = sentence.match(
    /([가-힣A-Za-z][가-힣A-Za-z0-9·\- ]{1,28}?)(?:은|는|이|가|란|이라는|이라고)\s/u,
  );
  if (definitionMatch?.[1]) {
    return definitionMatch[1].trim().replace(/\s{2,}/g, " ");
  }

  const tokens = sentence.match(/[가-힣]{2,}|[A-Za-z][A-Za-z0-9-]{2,}/g) ?? [];
  const stopWords = new Set([
    "그리고",
    "하지만",
    "때문에",
    "통해",
    "대한",
    "위해",
    "하는",
    "하는것",
    "있다",
    "있습니다",
    "것이다",
    "방법이다",
  ]);
  return tokens.find((token) => !stopWords.has(token)) ?? sentence.slice(0, 18);
}

function shortSentence(sentence: string): string {
  const compact = sentence.replace(/\s+/g, " ").trim();
  return compact.length > 78 ? `${compact.slice(0, 78)}…` : compact;
}

function normalizeAnswer(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/[\s\u200b]/g, "");
}

function createMultipleQuestion(
  sentence: string,
  sentences: string[],
  title: string,
  difficulty: Difficulty,
  index: number,
): GeneratedQuestion {
  const concept = extractConcept(sentence);
  const otherSentences = sentences.filter((candidate) => candidate !== sentence);
  const distractors = Array.from({ length: 3 }, (_, offset) => {
    const candidate = otherSentences[(index + offset) % Math.max(otherSentences.length, 1)];
    return candidate && candidate !== sentence
      ? shortSentence(candidate)
      : `${concept}와 관련된 다른 설명입니다.`;
  });
  const options = [shortSentence(sentence), ...distractors];
  const correctIndex = index % options.length;
  const rotated = options.slice(correctIndex).concat(options.slice(0, correctIndex));

  return {
    id: `notion-multiple-${index + 1}`,
    type: "multiple",
    difficulty,
    prompt: `다음 중 ‘${concept}’에 대한 원문 설명으로 가장 적절한 것은 무엇인가요?`,
    options: rotated,
    correctIndex: 0,
    explanation: `노션 원문은 ‘${concept}’을(를) 다음과 같이 설명합니다. “${sentence}” 이 문장에서 정의와 핵심 관계를 먼저 확인하면 정답을 고를 수 있습니다.`,
    solutionSteps: [
      `문제에서 묻는 핵심 개념은 ‘${concept}’입니다.`,
      "각 선택지를 원문에 직접 대입해 의미가 일치하는지 확인합니다.",
      "원문의 주장과 가장 정확히 일치하는 선택지를 정답으로 고릅니다.",
    ],
    source: `${title} · 원문 ${index + 1}`,
    concept,
  };
}

function createShortQuestion(
  sentence: string,
  title: string,
  difficulty: Difficulty,
  index: number,
): GeneratedQuestion {
  const concept = extractConcept(sentence);
  const normalized = normalizeAnswer(concept);

  return {
    id: `notion-short-${index + 1}`,
    type: "short",
    difficulty,
    prompt: `다음 원문이 설명하는 핵심 개념을 입력하세요.\n“${shortSentence(sentence)}”`,
    answer: concept,
    acceptedAnswers: [concept, normalized],
    explanation: `이 문장은 ‘${concept}’의 의미와 특징을 설명하고 있습니다. 문장 전체를 외우기보다 정의를 대표하는 핵심어를 찾아 답으로 정리하면 됩니다.`,
    solutionSteps: [
      "문장에서 ‘무엇이 무엇이다’ 또는 ‘무엇을 뜻한다’는 정의 구조를 찾습니다.",
      `정의의 주어로 반복되거나 강조되는 핵심어는 ‘${concept}’입니다.`,
      "띄어쓰기가 달라도 핵심어가 같으면 정답으로 인정합니다.",
    ],
    source: `${title} · 원문 ${index + 1}`,
    concept,
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "요청 형식을 확인해 주세요." }, 400);
  }

  const sourceText = typeof body.sourceText === "string" ? body.sourceText.trim() : "";
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Notion 페이지";
  const type: QuestionType = body.type === "short" ? "short" : "multiple";
  const difficulty: Difficulty = body.difficulty === "high" || body.difficulty === "low" ? body.difficulty : "medium";
  const requestedCount = Number(body.count);
  const count = Number.isFinite(requestedCount) ? Math.max(0, Math.min(100, Math.floor(requestedCount))) : 0;

  if (!sourceText) return json({ error: "문제를 만들 원문이 없습니다." }, 400);
  if (count === 0) return json({ questions: [], generator: "notion-rule-based" });

  const sentences = splitSentences(sourceText);
  if (sentences.length === 0) {
    return json({ error: "문제를 만들 수 있는 텍스트가 충분하지 않습니다." }, 422);
  }

  const questions = Array.from({ length: count }, (_, index) => {
    const sentence = sentences[index % sentences.length];
    return type === "short"
      ? createShortQuestion(sentence, title, difficulty, index)
      : createMultipleQuestion(sentence, sentences, title, difficulty, index);
  });

  return json({ questions, generator: "notion-rule-based" });
}
