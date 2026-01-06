# VOCAB

미니멀리스트 영어 단어 학습 웹 앱

## Features

### 학습 시스템
- **2단계 학습**: 플래시카드(3D 플립 애니메이션) → 타이핑 테스트
- **양방향 플래시카드**: 한글 → 영어 / 영어 → 한글 전환 가능
- **SM-2 간격 반복**: 과학적 기억 곡선 기반 복습 스케줄링
- **힌트 시스템**: 첫 글자, 글자 수, 발음 힌트 제공

### 커스텀 단어장
- **직접 단어 추가**: 자동 번역 지원 (MyMemory API)
- **날짜별 그룹핑**: 추가 날짜별 구분선으로 단어 정리
- **날짜별 학습**: 특정 날짜에 추가한 단어만 선택 학습

### 학습 관리
- **오답 복습**: 틀린 단어 집중 복습 기능
- **학습 캘린더**: 월별 학습 기록 히트맵
- **통계 추적**: 일별/주간 학습량, 정답률, 연속 학습일
- **데이터 관리**: JSON 내보내기/가져오기

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
│   ├── LearningCalendar.tsx  # 학습 캘린더
│   ├── learning/        # 학습 관련 컴포넌트
│   └── custom/          # 커스텀 단어장 관련
├── store/
│   └── useStore.ts      # Zustand 상태관리
├── data/
│   └── words.ts         # 기본 단어 데이터
├── lib/
│   ├── sm2.ts           # SM-2 알고리즘
│   ├── date.ts          # 날짜 유틸리티
│   ├── theme.ts         # 테마 시스템
│   ├── translate.ts     # 번역 API
│   └── dataExport.ts    # 데이터 내보내기/가져오기
└── types/
    └── index.ts         # TypeScript 타입 정의
```

## License

MIT
