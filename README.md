# 퀴즈메이트

노션 페이지나 샘플 노트를 객관식·단답형 문제로 바꾸고, 풀이 후 점수·오답·해설을 보여주는 학습 웹앱입니다. 현재 문제 생성은 원문에서 문장과 핵심어를 뽑는 규칙 기반 방식이며, 별도의 생성형 AI 키 없이 사용할 수 있습니다.

## 주요 기능

- 샘플 노트로 바로 문제 생성·풀이 체험
- 노션 페이지 URL 또는 ID로 학습 자료 불러오기
- 객관식·단답형, 난이도와 문제 수 선택
- 채점 결과, 오답·정답·해설과 원문 출처 확인
- 문제 생성 API와 노션 읽기 API 분리

## 기술과 구조

React · TypeScript · vinext · Vite · Tailwind CSS를 사용합니다. Cloudflare Worker용 실행 진입점과 Sites 배포 설정이 함께 있습니다.

| 경로 | 역할 |
| --- | --- |
| `app/page.tsx` | 설정·풀이·결과 화면 |
| `app/api/notion/page/route.ts` | 노션 문서 읽기 |
| `app/api/quiz/generate/route.ts` | 원문 기반 문제 생성 |
| `app/globals.css` | 화면 스타일 |
| `worker/index.ts` | Worker 실행 진입점 |

## 빠른 시작

Node.js 22.13 이상이 필요합니다.

```bash
git clone https://github.com/choisung-ho/quizmate.git
cd quizmate
npm ci
cp .env.example .env.local
npm run dev
```

샘플 노트는 노션 연결 없이 사용할 수 있습니다. 노션 자료를 사용하려면 `.env.local`의 `NOTION_TOKEN`에 본인의 통합 토큰을 넣고, 해당 통합에 페이지 접근 권한을 부여합니다. 토큰은 서버에서만 사용합니다.

## 검증과 빌드

```bash
npm test
npm run build
```

`npm test`는 빌드 후 초기 화면의 서버 렌더링을 확인합니다. 실제 노션 계정 연결이나 전체 풀이 흐름을 자동으로 검증하는 테스트는 아닙니다.

## 실행 환경

`.openai/hosting.json`과 `vite.config.ts`는 원래 Sites 실행 환경을 유지합니다. `app/chatgpt-auth.ts`의 선택적 로그인 도우미는 해당 호스팅 플랫폼의 인증 헤더에 의존하며, 일반 로컬 실행에서 ChatGPT 로그인을 제공하는 기능은 아닙니다.

## 공개 범위

실제 노션 토큰, 개인 노트, 로컬 캐시, 빌드 결과물은 제외했습니다. 인증 정보는 `.env.local`에만 보관하며 Git에 올리지 않습니다.

공개 준비 시 실행한 검사와 범위는 [검증 기록](docs/PUBLIC_VALIDATION.md)에 정리했습니다.
