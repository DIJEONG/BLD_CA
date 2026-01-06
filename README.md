# VOCAB

미니멀리스트 영어 단어 학습 웹 앱

## Features

- **2단계 학습 시스템**: 플래시카드(뜻 → 영어 확인) + 타이핑(직접 입력)
- **간격 반복 학습**: Leitner System 기반 5단계 박스 알고리즘
- **커스텀 단어장**: 직접 단어 추가 (자동 번역 지원)
- **학습 통계**: 일별/주간 학습량, 정답률, 연속 학습일 추적
- **힌트 시스템**: 첫 글자, 글자 수, 발음 힌트 제공

## Tech Stack

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + localStorage |
| UI | shadcn/ui (Editorial Theme) |

## Design

흑백 에디토리얼/브루탈리스트 디자인 시스템

- **색상**: 순수 흑백 (그림자 없음)
- **테두리**: 2px 검은색 실선, 둥글지 않은 모서리
- **타이포그래피**: Noto Serif KR (제목), JetBrains Mono (데이터)

## Getting Started

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── Dashboard.tsx    # 메인 대시보드
│   ├── Onboarding.tsx   # 온보딩 화면
│   ├── learning/        # 학습 관련 컴포넌트
│   └── custom/          # 커스텀 단어장 관련
├── store/
│   └── useStore.ts      # Zustand 상태관리
├── data/
│   └── words.ts         # 기본 단어 데이터
├── lib/
│   ├── theme.ts         # 테마 시스템
│   └── translate.ts     # 번역 API
└── types/
    └── index.ts         # TypeScript 타입 정의
```

## License

MIT
