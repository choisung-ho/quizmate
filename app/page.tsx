"use client";

import { useMemo, useState, type CSSProperties } from "react";

type Screen = "setup" | "quiz" | "results";
type QuestionType = "multiple" | "short";
type Difficulty = "high" | "medium" | "low";

type QuizQuestion = {
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

type SourceDocument = {
  title: string;
  text: string;
  url?: string;
  blockCount?: number;
  mode: "demo" | "notion";
};

type GradedQuestion = QuizQuestion & {
  userAnswer: string;
  isCorrect: boolean;
};

type QuizResult = {
  correct: number;
  total: number;
  questions: GradedQuestion[];
};

const demoSource: SourceDocument = {
  title: "학습과 기억의 핵심",
  text:
    "인출 연습은 자료를 다시 읽는 대신 기억에서 정보를 꺼내는 학습 전략이다. 분산 학습은 한 번에 몰아서 공부하는 대신 시간 간격을 두고 학습하는 방식이다. 청킹은 서로 관련된 정보를 하나의 의미 단위로 묶어 작업 기억의 부담을 줄이는 방법이다. 부호화 특수성 원리는 학습할 때와 비슷한 단서가 주어질 때 기억이 더 잘 떠오른다는 원리다.",
  mode: "demo",
};

const demoQuestionBank: QuizQuestion[] = [
  {
    id: "demo-multiple-1",
    type: "multiple",
    difficulty: "low",
    prompt: "자료를 보지 않고 기억에서 답을 꺼내는 학습 전략은 무엇인가요?",
    options: ["정교화", "인출 연습", "주의 분할", "수동적 재독"],
    correctIndex: 1,
    explanation:
      "인출 연습은 답을 다시 읽는 데서 멈추지 않고, 자료를 덮은 뒤 기억 속 정보를 꺼내 보는 전략입니다. 꺼내는 과정 자체가 기억 경로를 강화합니다.",
    solutionSteps: [
      "문장에서 ‘기억에서 답을 꺼낸다’는 행동을 찾습니다.",
      "이 행동을 설명하는 개념은 인출 연습입니다.",
      "따라서 두 번째 선택지를 고릅니다.",
    ],
    source: "학습과 기억의 핵심 · 인출 연습",
    concept: "인출 연습",
  },
  {
    id: "demo-multiple-2",
    type: "multiple",
    difficulty: "medium",
    prompt: "분산 학습을 가장 잘 설명하는 문장은 무엇인가요?",
    options: [
      "한 번의 긴 학습 세션에 모든 내용을 몰아 넣는다.",
      "시간 간격을 두고 여러 번에 나누어 학습한다.",
      "학습 중에는 답을 전혀 확인하지 않는다.",
      "서로 관계없는 내용을 하나의 묶음으로 만든다.",
    ],
    correctIndex: 1,
    explanation:
      "분산 학습의 핵심은 학습을 여러 세션으로 나누고 그 사이에 시간 간격을 두는 것입니다. 한 번에 몰아서 공부하는 방식과 대비됩니다.",
    solutionSteps: [
      "분산이라는 말에서 ‘나누어 배치한다’는 뜻을 떠올립니다.",
      "선택지 중 시간 간격과 반복 학습을 함께 말하는 문장을 찾습니다.",
      "두 번째 선택지가 분산 학습의 정의와 일치합니다.",
    ],
    source: "학습과 기억의 핵심 · 분산 학습",
    concept: "분산 학습",
  },
  {
    id: "demo-multiple-3",
    type: "multiple",
    difficulty: "high",
    prompt: "작업 기억의 부담을 줄이는 방법으로 가장 적절한 것은 무엇인가요?",
    options: [
      "관련된 정보를 의미 단위로 묶는다.",
      "모든 정보를 한 번에 소리 내어 반복한다.",
      "새로운 정보와 기존 지식을 분리해 둔다.",
      "정보를 더 작은 조각으로 무작위로 나눈다.",
    ],
    correctIndex: 0,
    explanation:
      "청킹은 서로 관련된 정보를 하나의 의미 단위로 묶는 방법입니다. 개별 항목을 따로 기억하는 부담이 줄어들기 때문에 작업 기억을 효율적으로 사용할 수 있습니다.",
    solutionSteps: [
      "문제의 기준은 ‘작업 기억의 부담을 줄이는가’입니다.",
      "관련된 정보를 하나의 의미 단위로 묶는 행동이 청킹입니다.",
      "따라서 첫 번째 선택지가 정답입니다.",
    ],
    source: "학습과 기억의 핵심 · 청킹",
    concept: "청킹",
  },
  {
    id: "demo-multiple-4",
    type: "multiple",
    difficulty: "medium",
    prompt: "부호화 특수성 원리를 적용한 학습 방법은 무엇인가요?",
    options: [
      "시험과 비슷한 단서를 포함해 연습한다.",
      "학습한 내용과 관련 없는 장소에서만 복습한다.",
      "기억을 떠올리지 않고 내용을 반복해서 읽는다.",
      "모든 단서를 없애고 순수하게 암기한다.",
    ],
    correctIndex: 0,
    explanation:
      "부호화 특수성 원리는 학습 당시의 단서와 인출할 때의 단서가 비슷할수록 기억이 잘 떠오른다는 설명입니다. 시험 상황과 유사한 단서로 연습하는 것이 핵심입니다.",
    solutionSteps: [
      "원리의 핵심 단어는 ‘학습할 때와 비슷한 단서’입니다.",
      "시험과 비슷한 단서를 포함한 연습을 찾습니다.",
      "첫 번째 선택지가 원리를 직접 적용합니다.",
    ],
    source: "학습과 기억의 핵심 · 부호화 특수성",
    concept: "부호화 특수성",
  },
  {
    id: "demo-short-1",
    type: "short",
    difficulty: "low",
    prompt: "자료를 보지 않고 기억에서 정보를 꺼내는 학습 전략을 입력하세요.",
    answer: "인출 연습",
    acceptedAnswers: ["인출 연습", "인출연습", "retrieval practice"],
    explanation:
      "인출 연습은 자료를 다시 읽는 대신 기억에서 정보를 꺼내 보는 방식입니다. 정답을 확인하기 전 스스로 회상하는 과정이 중요합니다.",
    solutionSteps: [
      "‘기억에서 정보를 꺼낸다’는 핵심 행동을 찾습니다.",
      "이 행동을 부르는 학습 전략은 인출 연습입니다.",
      "띄어쓰기를 포함해 ‘인출 연습’이라고 입력합니다.",
    ],
    source: "학습과 기억의 핵심 · 인출 연습",
    concept: "인출 연습",
  },
  {
    id: "demo-short-2",
    type: "short",
    difficulty: "medium",
    prompt: "공부를 여러 번의 시간 간격으로 나누어 하는 학습 방식을 입력하세요.",
    answer: "분산 학습",
    acceptedAnswers: ["분산 학습", "분산학습", "spaced practice", "spacing effect"],
    explanation:
      "분산 학습은 학습 세션 사이에 간격을 두는 방식입니다. 한 번에 몰아서 공부하는 것보다 장기 기억에 유리한 학습 습관으로 알려져 있습니다.",
    solutionSteps: [
      "문제에서 ‘여러 번’과 ‘시간 간격’이라는 단서를 확인합니다.",
      "두 단서를 함께 설명하는 개념은 분산 학습입니다.",
      "따라서 답란에 분산 학습을 입력합니다.",
    ],
    source: "학습과 기억의 핵심 · 분산 학습",
    concept: "분산 학습",
  },
  {
    id: "demo-short-3",
    type: "short",
    difficulty: "high",
    prompt: "서로 관련된 정보를 하나의 의미 단위로 묶는 방법을 입력하세요.",
    answer: "청킹",
    acceptedAnswers: ["청킹", "청크", "chunking"],
    explanation:
      "청킹은 여러 정보를 서로 관련된 의미 단위로 묶는 방법입니다. 항목 하나하나를 기억하기보다 묶음 전체를 다루게 해 작업 기억의 부담을 낮춥니다.",
    solutionSteps: [
      "‘하나의 의미 단위로 묶는다’는 행동을 찾습니다.",
      "이 전략의 이름은 청킹(chunking)입니다.",
      "한글로 청킹 또는 영어로 chunking을 입력할 수 있습니다.",
    ],
    source: "학습과 기억의 핵심 · 청킹",
    concept: "청킹",
  },
  {
    id: "demo-short-4",
    type: "short",
    difficulty: "medium",
    prompt: "학습할 때와 비슷한 단서가 주어질 때 기억이 더 잘 떠오른다는 원리를 입력하세요.",
    answer: "부호화 특수성 원리",
    acceptedAnswers: ["부호화 특수성 원리", "부호화 특수성", "encoding specificity"],
    explanation:
      "부호화 특수성 원리는 정보를 학습할 때 함께 저장된 단서가 인출 상황에서도 제공될 때 기억이 더 잘 회복된다는 원리입니다.",
    solutionSteps: [
      "학습 상황과 인출 상황의 단서가 비슷하다는 부분을 찾습니다.",
      "이 관계를 설명하는 개념은 부호화 특수성 원리입니다.",
      "핵심어까지 포함해 답을 적으면 가장 정확합니다.",
    ],
    source: "학습과 기억의 핵심 · 부호화 특수성",
    concept: "부호화 특수성",
  },
];

const difficultyLabels: Record<Difficulty, string> = {
  high: "상",
  medium: "중",
  low: "하",
};

function createDemoQuestions(
  type: QuestionType,
  difficulty: Difficulty,
  count: number,
): QuizQuestion[] {
  const candidates = demoQuestionBank.filter((question) => question.type === type);
  return Array.from({ length: count }, (_, index) => {
    const question = candidates[index % candidates.length];
    return {
      ...question,
      id: `${question.id}-${index + 1}`,
      difficulty,
    };
  });
}

function normalizeAnswer(value: string): string {
  return value
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s\u200b]/g, "")
    .replace(/[.,!?;:()[\]{}"'`~·]/g, "");
}

function isQuestionCorrect(question: QuizQuestion, userAnswer: string): boolean {
  if (question.type === "multiple") {
    return userAnswer !== "" && Number(userAnswer) === question.correctIndex;
  }

  const normalized = normalizeAnswer(userAnswer);
  return Boolean(
    normalized &&
      question.acceptedAnswers?.some((answer) => normalizeAnswer(answer) === normalized),
  );
}

function difficultyDescription(difficulty: Difficulty): string {
  if (difficulty === "high") return "개념을 응용하고 비교해요";
  if (difficulty === "low") return "핵심 내용을 바로 확인해요";
  return "핵심 개념을 연결해요";
}

function AppIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    home: "⌂",
    book: "▤",
    chart: "◒",
    settings: "⚙",
    arrow: "↗",
    back: "←",
    check: "✓",
    sparkle: "✦",
    notion: "N",
    question: "?",
  };

  return (
    <span className={`app-icon app-icon-${name}`} aria-hidden="true">
      {icons[name] ?? "•"}
    </span>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [sourceMode, setSourceMode] = useState<"demo" | "notion">("demo");
  const [source, setSource] = useState<SourceDocument>(demoSource);
  const [notionPageInput, setNotionPageInput] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("multiple");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [answers, questions],
  );

  function resetToSetup() {
    setScreen("setup");
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setGenerateError("");
  }

  async function fetchNotionPage(): Promise<SourceDocument | null> {
    if (!notionPageInput.trim()) {
      setSourceError("노션 페이지 URL 또는 페이지 ID를 입력해 주세요.");
      return null;
    }

    setSourceLoading(true);
    setSourceError("");

    try {
      const response = await fetch("/api/notion/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notionPageInput.trim() }),
      });
      const payload = (await response.json()) as {
        title?: string;
        text?: string;
        url?: string;
        blockCount?: number;
        error?: string;
      };

      if (!response.ok || !payload.text) {
        throw new Error(payload.error ?? "노션 페이지를 불러오지 못했습니다.");
      }

      const nextSource: SourceDocument = {
        title: payload.title ?? "노션 페이지",
        text: payload.text,
        url: payload.url,
        blockCount: payload.blockCount,
        mode: "notion",
      };
      setSource(nextSource);
      setSourceMode("notion");
      return nextSource;
    } catch (error) {
      setSourceError(
        error instanceof Error
          ? error.message
          : "노션 페이지를 불러오지 못했습니다. 연결 설정을 확인해 주세요.",
      );
      return null;
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerateError("");
    if (count === 0) {
      setGenerateError("문제 개수를 1개 이상으로 설정해 주세요.");
      return;
    }

    setIsGenerating(true);
    let activeSource = source;

    try {
      if (sourceMode === "notion" && source.mode !== "notion") {
        const loadedSource = await fetchNotionPage();
        if (!loadedSource) return;
        activeSource = loadedSource;
      }

      if (activeSource.mode === "demo") {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        setQuestions(createDemoQuestions(questionType, difficulty, count));
      } else {
        const response = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: activeSource.title,
            sourceText: activeSource.text,
            type: questionType,
            difficulty,
            count,
          }),
        });
        const payload = (await response.json()) as {
          questions?: QuizQuestion[];
          error?: string;
        };
        if (!response.ok || !payload.questions?.length) {
          throw new Error(payload.error ?? "문제를 만들지 못했습니다.");
        }
        setQuestions(payload.questions);
      }

      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setScreen("quiz");
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : "문제를 만드는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function chooseAnswer(value: string) {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value }));
  }

  function gradeQuiz() {
    const gradedQuestions = questions.map((question) => {
      const userAnswer = answers[question.id] ?? "";
      return {
        ...question,
        userAnswer,
        isCorrect: isQuestionCorrect(question, userAnswer),
      };
    });
    setResult({
      correct: gradedQuestions.filter((question) => question.isCorrect).length,
      total: gradedQuestions.length,
      questions: gradedQuestions,
    });
    setScreen("results");
  }

  function moveToQuestion(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={resetToSetup} aria-label="퀴즈메이트 홈">
          <span className="brand-mark">Q</span>
          <span className="brand-name">퀴즈메이트</span>
        </button>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="주 메뉴">
          <button
            className={`side-nav-item ${screen === "setup" ? "is-active" : ""}`}
            onClick={resetToSetup}
          >
            <AppIcon name="home" />
            <span>학습 홈</span>
            <span className="nav-ping" />
          </button>
          <button
            className={`side-nav-item ${screen === "quiz" ? "is-active" : ""}`}
            onClick={() => questions.length > 0 && setScreen("quiz")}
          >
            <AppIcon name="book" />
            <span>진행 중인 퀴즈</span>
          </button>
          <button
            className={`side-nav-item ${screen === "results" ? "is-active" : ""}`}
            onClick={() => result && setScreen("results")}
          >
            <AppIcon name="chart" />
            <span>학습 리포트</span>
          </button>
        </nav>

        <div className="sidebar-section-label sidebar-section-label-spaced">COLLECTION</div>
        <div className="collection-card">
          <div className="collection-icon"><AppIcon name="notion" /></div>
          <div>
            <strong>{source.mode === "notion" ? "내 노션 자료" : "샘플 노트"}</strong>
            <span>{source.mode === "notion" ? "연결된 페이지" : "바로 체험하기"}</span>
          </div>
          <span className="collection-dot" />
        </div>

        <div className="sidebar-bottom">
          <div className="streak-card">
            <div className="streak-topline"><span>오늘의 학습</span><AppIcon name="sparkle" /></div>
            <strong>12분</strong>
            <div className="streak-track"><span /></div>
            <small>어제보다 4분 더 집중했어요</small>
          </div>
          <button className="side-nav-item settings-item" type="button">
            <AppIcon name="settings" />
            <span>환경 설정</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>LEARNING SPACE</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{screen === "setup" ? "새 퀴즈" : screen === "quiz" ? "풀이 중" : "결과 리포트"}</strong>
          </div>
          <div className="topbar-actions">
            <span className="sync-status"><span className="sync-dot" /> 로컬에 자동 저장됨</span>
            <button className="profile-button" type="button" aria-label="프로필 메뉴">김<span>·</span></button>
          </div>
        </header>

        {screen === "setup" && (
          <SetupScreen
            source={source}
            sourceMode={sourceMode}
            setSourceMode={(mode) => {
              setSourceMode(mode);
              setSourceError("");
              if (mode === "demo") setSource(demoSource);
            }}
            notionPageInput={notionPageInput}
            setNotionPageInput={setNotionPageInput}
            sourceLoading={sourceLoading}
            sourceError={sourceError}
            fetchNotionPage={fetchNotionPage}
            questionType={questionType}
            setQuestionType={setQuestionType}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            count={count}
            setCount={setCount}
            isGenerating={isGenerating}
            generateError={generateError}
            onGenerate={handleGenerate}
          />
        )}

        {screen === "quiz" && currentQuestion && (
          <QuizScreen
            source={source}
            questions={questions}
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            answers={answers}
            answeredCount={answeredCount}
            onChooseAnswer={chooseAnswer}
            onMove={moveToQuestion}
            onGrade={gradeQuiz}
          />
        )}

        {screen === "results" && result && (
          <ResultsScreen
            result={result}
            source={source}
            onRetry={() => {
              setAnswers({});
              setCurrentIndex(0);
              setScreen("quiz");
            }}
            onSetup={resetToSetup}
          />
        )}
      </main>
    </div>
  );
}

type SetupScreenProps = {
  source: SourceDocument;
  sourceMode: "demo" | "notion";
  setSourceMode: (mode: "demo" | "notion") => void;
  notionPageInput: string;
  setNotionPageInput: (value: string) => void;
  sourceLoading: boolean;
  sourceError: string;
  fetchNotionPage: () => Promise<SourceDocument | null>;
  questionType: QuestionType;
  setQuestionType: (type: QuestionType) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  count: number;
  setCount: (count: number) => void;
  isGenerating: boolean;
  generateError: string;
  onGenerate: () => void;
};

function SetupScreen({
  source,
  sourceMode,
  setSourceMode,
  notionPageInput,
  setNotionPageInput,
  sourceLoading,
  sourceError,
  fetchNotionPage,
  questionType,
  setQuestionType,
  difficulty,
  setDifficulty,
  count,
  setCount,
  isGenerating,
  generateError,
  onGenerate,
}: SetupScreenProps) {
  return (
    <div className="setup-page page-enter">
      <section className="welcome-section">
        <div className="welcome-copy">
          <div className="eyebrow-pill"><span /> NOTION × ACTIVE RECALL</div>
          <h1>읽은 것을<br /><em>문제로 바꾸세요.</em></h1>
          <p>노션에 쌓아 둔 지식을 문제로 꺼내 보고,<br />잊기 전에 내 것으로 만들어 보세요.</p>
        </div>
        <div className="welcome-aside">
          <div className="aside-number">01</div>
          <div className="aside-line" />
          <p>문제 설정부터<br /><strong>풀이 리포트</strong>까지</p>
          <AppIcon name="arrow" />
        </div>
      </section>

      <section className="setup-grid">
        <div className="config-card panel-card">
          <div className="panel-heading">
            <div>
              <span className="section-index">01 / CONFIGURE</span>
              <h2>어떻게 풀어볼까요?</h2>
            </div>
            <span className="config-status">3 STEP</span>
          </div>

          <div className="form-section source-section">
            <div className="form-label-row">
              <span className="field-title">문제의 재료</span>
              <span>어디서 가져올까요?</span>
            </div>
            <div className="source-switcher">
              <button
                type="button"
                className={sourceMode === "demo" ? "is-selected" : ""}
                onClick={() => setSourceMode("demo")}
              >
                <span className="source-bullet demo-bullet">✦</span>
                <span><strong>샘플 노트</strong><small>바로 체험하기</small></span>
                {sourceMode === "demo" && <AppIcon name="check" />}
              </button>
              <button
                type="button"
                className={sourceMode === "notion" ? "is-selected" : ""}
                onClick={() => setSourceMode("notion")}
              >
                <span className="source-bullet notion-bullet">N</span>
                <span><strong>Notion 페이지</strong><small>내 자료 연결하기</small></span>
                {sourceMode === "notion" && <AppIcon name="check" />}
              </button>
            </div>
            {sourceMode === "notion" && (
              <div className="notion-input-wrap">
                <div className="input-with-action">
                  <input
                    aria-label="노션 페이지 URL 또는 ID"
                    placeholder="페이지 URL 또는 ID를 붙여 넣으세요"
                    value={notionPageInput}
                    onChange={(event) => setNotionPageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void fetchNotionPage();
                    }}
                  />
                  <button type="button" onClick={() => void fetchNotionPage()} disabled={sourceLoading}>
                    {sourceLoading ? "확인 중" : "불러오기"}
                  </button>
                </div>
                {source.mode === "notion" && !sourceError && (
                  <div className="source-loaded"><span>✓</span> {source.title} 연결됨</div>
                )}
                {sourceError && <div className="form-error">{sourceError}</div>}
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-label-row">
              <span className="field-title">문제 선택</span>
              <span>하나를 골라 주세요</span>
            </div>
            <div className="option-grid type-grid">
              <button
                type="button"
                className={`option-tile ${questionType === "multiple" ? "is-selected" : ""}`}
                onClick={() => setQuestionType("multiple")}
              >
                <span className="option-symbol">A</span>
                <span className="option-copy"><strong>객관식</strong><small>선택지에서 답 고르기</small></span>
                <span className="radio-dot" />
              </button>
              <button
                type="button"
                className={`option-tile ${questionType === "short" ? "is-selected" : ""}`}
                onClick={() => setQuestionType("short")}
              >
                <span className="option-symbol option-symbol-short">—</span>
                <span className="option-copy"><strong>단답형</strong><small>내 말로 답을 입력하기</small></span>
                <span className="radio-dot" />
              </button>
            </div>
          </div>

          <div className="form-section">
            <div className="form-label-row">
              <span className="field-title">문제 난이도</span>
              <span>{difficultyDescription(difficulty)}</span>
            </div>
            <div className="difficulty-row">
              {(["high", "medium", "low"] as Difficulty[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  className={`difficulty-button difficulty-${level} ${difficulty === level ? "is-selected" : ""}`}
                  onClick={() => setDifficulty(level)}
                >
                  <span className="difficulty-bar"><i /><i /><i /></span>
                  <strong>{difficultyLabels[level]}</strong>
                  <small>{difficultyDescription(level).replace("해요", "")}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section count-section">
            <div className="form-label-row">
              <span className="field-title">문제 개수</span>
              <span>0–100개</span>
            </div>
            <div className="count-control">
              <div className="count-number"><strong>{count}</strong><span>문제</span></div>
              <input
                className="count-slider"
                type="range"
                min="0"
                max="100"
                step="1"
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                aria-label="문제 개수"
                style={{ "--range-progress": `${count}%` } as CSSProperties}
              />
              <div className="count-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={count}
                  onChange={(event) => {
                    const nextValue = Math.max(0, Math.min(100, Number(event.target.value) || 0));
                    setCount(nextValue);
                  }}
                  aria-label="문제 개수 직접 입력"
                />
                <span>개</span>
              </div>
            </div>
            <div className="slider-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>

          {generateError && <div className="form-error generate-error">{generateError}</div>}
          <button className="primary-cta" type="button" onClick={onGenerate} disabled={isGenerating}>
            <span>{isGenerating ? "문제를 만들고 있어요" : "문제 만들기"}</span>
            <span className="cta-arrow">{isGenerating ? "…" : "↗"}</span>
          </button>
          <p className="privacy-note"><span>◌</span> 노션 원문은 문제 생성에만 사용되며 저장하지 않아요.</p>
        </div>

        <div className="preview-column">
          <div className="source-preview panel-card">
            <div className="preview-topline"><span className="section-index">02 / SOURCE PREVIEW</span><span className="live-label"><i /> LIVE</span></div>
            <div className="source-title-row">
              <div className="source-document-icon"><span>{source.mode === "notion" ? "N" : "✦"}</span></div>
              <div><h3>{source.title}</h3><p>{source.mode === "notion" ? `${source.blockCount ?? "여러"}개 블록 · 연결된 페이지` : "샘플 자료 · 4개 핵심 개념"}</p></div>
            </div>
            <div className="source-excerpt">
              <div className="excerpt-line excerpt-heading">{source.mode === "notion" ? "페이지 내용 미리보기" : "학습과 기억의 핵심"}</div>
              <div className="excerpt-line"><span>01</span> {source.text.slice(0, 78)}{source.text.length > 78 ? "…" : ""}</div>
              <div className="excerpt-line excerpt-muted"><span>02</span> 문제를 풀며 핵심 내용을 다시 꺼내 봅니다.</div>
            </div>
            <div className="preview-footer"><span>{source.mode === "notion" ? "NOTION CONTENT" : "DEMO CONTENT"}</span><span>읽기 전용</span></div>
          </div>

          <div className="micro-quote">
            <div className="quote-mark">“</div>
            <p>아는 것과 <em>꺼내는 것</em>은 다릅니다.<br />퀴즈는 그 차이를 보여줘요.</p>
            <span>— learning note 04</span>
          </div>
        </div>
      </section>
    </div>
  );
}

type QuizScreenProps = {
  source: SourceDocument;
  questions: QuizQuestion[];
  currentQuestion: QuizQuestion;
  currentIndex: number;
  answers: Record<string, string>;
  answeredCount: number;
  onChooseAnswer: (value: string) => void;
  onMove: (index: number) => void;
  onGrade: () => void;
};

function QuizScreen({
  source,
  questions,
  currentQuestion,
  currentIndex,
  answers,
  answeredCount,
  onChooseAnswer,
  onMove,
  onGrade,
}: QuizScreenProps) {
  const answer = answers[currentQuestion.id] ?? "";
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="quiz-page page-enter">
      <div className="quiz-heading-row">
        <div>
          <span className="section-index">QUIZ SESSION / {source.title}</span>
          <h1>천천히, 정확하게 꺼내 보세요.</h1>
        </div>
        <div className="quiz-meta"><span>{answeredCount} / {questions.length} 답변 완료</span><span className="meta-divider" /><span>{difficultyLabels[currentQuestion.difficulty]} 난이도</span></div>
      </div>

      <div className="quiz-progress-row">
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="progress-labels"><span>QUESTION {String(currentIndex + 1).padStart(2, "0")}</span><span>{String(questions.length).padStart(2, "0")}</span></div>
      </div>

      <div className="quiz-layout">
        <div className="question-card panel-card">
          <div className="question-card-topline">
            <span className="question-type-label"><span>{currentQuestion.type === "multiple" ? "A" : "—"}</span>{currentQuestion.type === "multiple" ? "객관식" : "단답형"}</span>
            <span className="concept-label">{currentQuestion.concept}</span>
          </div>
          <div className="question-number">{String(currentIndex + 1).padStart(2, "0")}</div>
          <h2>{currentQuestion.prompt}</h2>
          <p className="question-guide">{currentQuestion.type === "multiple" ? "가장 정확한 답을 하나 선택하세요." : "핵심어를 중심으로 짧게 입력하세요."}</p>

          {currentQuestion.type === "multiple" && currentQuestion.options && (
            <div className="answer-options">
              {currentQuestion.options.map((option, index) => (
                <button
                  type="button"
                  key={`${currentQuestion.id}-${option}`}
                  className={`answer-option ${answer === String(index) ? "is-selected" : ""}`}
                  onClick={() => onChooseAnswer(String(index))}
                >
                  <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                  <span className="answer-check">✓</span>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "short" && (
            <div className="short-answer-wrap">
              <label htmlFor="short-answer">내 답변</label>
              <input
                id="short-answer"
                placeholder="답을 입력하세요"
                value={answer}
                onChange={(event) => onChooseAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isLast) onMove(currentIndex + 1);
                }}
              />
              <span className="input-hint">Enter를 누르면 다음 문제로 이동</span>
            </div>
          )}

          <div className="question-card-footer">
            <span>{currentQuestion.source}</span>
            <div className="question-actions">
              <button type="button" className="secondary-button" onClick={() => onMove(currentIndex - 1)} disabled={currentIndex === 0}>이전</button>
              {!isLast ? (
                <button type="button" className="dark-button" onClick={() => onMove(currentIndex + 1)}>다음 문제 <span>→</span></button>
              ) : (
                <button type="button" className="dark-button finish-button" onClick={onGrade}>채점하기 <span>✦</span></button>
              )}
            </div>
          </div>
        </div>

        <aside className="quiz-aside">
          <div className="session-card panel-card">
            <div className="session-card-heading"><span className="section-index">SESSION MAP</span><span>{answeredCount}/{questions.length}</span></div>
            <div className="question-map">
              {questions.map((question, index) => (
                <button
                  type="button"
                  key={question.id}
                  className={`map-dot ${index === currentIndex ? "is-current" : ""} ${answers[question.id] ? "is-answered" : ""}`}
                  onClick={() => onMove(index)}
                  aria-label={`${index + 1}번 문제로 이동`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="session-divider" />
            <div className="session-tip"><AppIcon name="sparkle" /><div><strong>기억해 두기</strong><p>막히면 원문을 바로 보지 말고, 먼저 알고 있는 단서를 떠올려 보세요.</p></div></div>
          </div>
          <div className="source-mini-card">
            <span className="section-index">FROM YOUR SOURCE</span>
            <strong>{source.title}</strong>
            <p>{source.text.slice(0, 108)}{source.text.length > 108 ? "…" : ""}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

type ResultsScreenProps = {
  result: QuizResult;
  source: SourceDocument;
  onRetry: () => void;
  onSetup: () => void;
};

function ResultsScreen({ result, source, onRetry, onSetup }: ResultsScreenProps) {
  const incorrectCount = result.total - result.correct;
  const scorePercent = Math.round((result.correct / result.total) * 100);

  return (
    <div className="results-page page-enter">
      <section className="results-hero">
        <div>
          <span className="eyebrow-pill"><span className="success-pill-dot" /> QUIZ COMPLETE</span>
          <h1>좋아요. 이제<br /><em>어디서 헷갈렸는지</em> 보여요.</h1>
          <p>{source.title}에서 만든 퀴즈를 마쳤습니다.<br />오답을 다시 꺼내 보면 다음 회상은 더 빨라져요.</p>
        </div>
        <div className="score-orbit">
          <div className="score-ring" style={{ "--score-angle": `${scorePercent * 3.6}deg` } as CSSProperties}>
            <div className="score-center"><strong>{scorePercent}</strong><span>점</span></div>
          </div>
          <span className="score-caption">{result.correct} / {result.total} 정답</span>
        </div>
      </section>

      <div className="results-stats">
        <div><span className="stat-icon stat-icon-green">✓</span><div><small>맞힌 문제</small><strong>{result.correct}<em>개</em></strong></div></div>
        <div><span className="stat-icon stat-icon-orange">↻</span><div><small>다시 볼 문제</small><strong>{incorrectCount}<em>개</em></strong></div></div>
        <div><span className="stat-icon stat-icon-blue">◷</span><div><small>학습 자료</small><strong>{source.mode === "notion" ? "Notion" : "샘플"}<em> 기반</em></strong></div></div>
        <div className="results-actions"><button type="button" className="secondary-button" onClick={onSetup}>조건 수정</button><button type="button" className="dark-button" onClick={onRetry}>다시 풀기 <span>↗</span></button></div>
      </div>

      <section className="review-section">
        <div className="review-heading"><div><span className="section-index">REVIEW / {incorrectCount > 0 ? "FOCUS ON MISSED" : "ALL CLEAR"}</span><h2>{incorrectCount > 0 ? "오답을 다시 살펴볼까요?" : "완벽하게 풀었어요."}</h2></div><span className="review-count">{incorrectCount > 0 ? `${incorrectCount}개 복습 필요` : "복습할 문제 없음"}</span></div>

        {incorrectCount === 0 ? (
          <div className="all-clear-card panel-card"><div className="all-clear-mark">✦</div><div><h3>모든 문제를 맞혔습니다.</h3><p>지금의 기억을 오래 가져가려면 잠시 후 같은 자료로 한 번 더 인출해 보세요.</p></div></div>
        ) : (
          <div className="review-list">
            {result.questions.filter((question) => !question.isCorrect).map((question, index) => (
              <ReviewCard key={question.id} question={question} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ReviewCard({ question, index }: { question: GradedQuestion; index: number }) {
  const correctAnswer = question.type === "multiple" && question.options
    ? question.options[question.correctIndex ?? 0]
    : question.answer;
  const userAnswer = question.type === "multiple" && question.options
    ? question.userAnswer === "" ? "답하지 않음" : question.options[Number(question.userAnswer)]
    : question.userAnswer || "답하지 않음";

  return (
    <article className="review-card panel-card">
      <div className="review-card-header"><span className="wrong-badge">WRONG / {String(index + 1).padStart(2, "0")}</span><span>{question.concept}</span></div>
      <h3>{question.prompt}</h3>
      <div className="answer-comparison">
        <div className="answer-box answer-wrong"><span>내 답변</span><strong>{userAnswer}</strong></div>
        <span className="comparison-arrow">→</span>
        <div className="answer-box answer-right"><span>정답</span><strong>{correctAnswer}</strong></div>
      </div>
      <div className="explanation-block"><div className="explanation-label"><AppIcon name="sparkle" /> 풀이 과정</div><p>{question.explanation}</p><ol>{question.solutionSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="review-source"><span>출처</span><strong>{question.source}</strong></div>
    </article>
  );
}
