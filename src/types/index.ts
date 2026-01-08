// 단어 타입
export interface Word {
  id: string;
  english: string;
  korean: string;
  pronunciation?: string;
  addedAt?: string;       // 추가된 날짜 (YYYY-MM-DD) - 커스텀 단어장용
  example?: string;       // 예문 (영어)
  exampleKorean?: string; // 예문 번역 (한글)
}

// 단어장 타입
export interface WordSet {
  id: string;
  name: string;
  description: string;
  gradeLevel: string; // 'elementary', 'middle', 'high'
  words: Word[];
}

// 사용자 프로필
export interface UserProfile {
  nickname: string;
  gradeLevel: string;
  dailyWordCount: number;
  createdAt: string;
}

// Leitner Box 타입 (1~5 단계)
export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

// 확신도 타입
export type Confidence = 'sure' | 'unsure';

// SM-2 응답 품질 (0-5)
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

// 단어별 학습 진도 (SM-2 알고리즘 + Leitner 호환)
export interface WordProgress {
  wordId: string;
  box: LeitnerBox;              // Leitner Box (1~5) - 하위 호환

  // SM-2 알고리즘 필드
  easeFactor: number;           // 난이도 계수 (2.5 기본, 1.3 최소)
  interval: number;             // 현재 복습 간격 (일)
  repetitionCount: number;      // 연속 정답 횟수

  // 기존 필드
  nextReviewDate: string;       // 다음 복습일 (YYYY-MM-DD)
  lastStudiedAt: string;        // 마지막 학습일
  attemptCount: number;         // 총 시도 횟수
  correctCount: number;         // 정답 횟수
  confidence?: Confidence;      // 마지막 확신도
  wrongCount: number;           // 누적 오답 횟수
}

// Leitner 복습 간격 (일 단위) - 확실히 아는 단어
export const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
  1: 1,   // 매일
  2: 2,   // 2일
  3: 4,   // 4일
  4: 7,   // 7일
  5: 14,  // 14일
};

// Leitner 복습 간격 (일 단위) - 애매하게 아는 단어 (더 짧은 간격)
export const LEITNER_INTERVALS_UNSURE: Record<LeitnerBox, number> = {
  1: 1,   // 매일
  2: 1,   // 1일 (원래 2일)
  3: 2,   // 2일 (원래 4일)
  4: 4,   // 4일 (원래 7일)
  5: 7,   // 7일 (원래 14일)
};

// 학습 세션
export interface LearningSession {
  id: string;
  date: string;
  wordSetId: string;
  totalWords: number;
  correctCount: number;
  wrongCount: number;
  durationSeconds: number;
  answers: SessionAnswer[];
}

// 세션 답안 (플래시카드 - 알았다/몰랐다)
export interface SessionAnswer {
  wordId: string;
  knew: boolean;                // 알았다(true) / 몰랐다(false)
  usedHint?: boolean;           // 힌트 사용 여부 (2번째 이후 시도에서 정답)
  timeSpentMs: number;
}

// 일별 통계
export interface DailyStats {
  date: string;
  wordsStudied: number;
  correctCount: number;
  wrongCount: number;
  totalTimeSeconds: number;
  sessionsCount: number;
}

// 커스텀 단어장 (사용자가 직접 추가)
export interface CustomWordSet {
  id: string;
  name: string;
  description: string;
  words: Word[];
  createdAt: string;
  updatedAt: string;
}

// 학습 플랜 템플릿 (미리 정의된 커리큘럼)
export interface StudyPlanTemplate {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  totalWords: number;
  gradeLevel: string;
  wordsPerDay: number;
  recommended?: boolean;
}

// 활성 학습 플랜 (사용자가 시작한 플랜)
export interface ActiveStudyPlan {
  planId: string;
  startDate: string;           // YYYY-MM-DD
  assignedWords: string[];     // 플랜에 포함된 전체 단어 ID 목록
}

// 전체 앱 상태
export interface AppState {
  // 사용자
  profile: UserProfile | null;
  isOnboarded: boolean;

  // 학습 진도
  wordProgress: Record<string, WordProgress>;

  // 세션 기록
  sessions: LearningSession[];

  // 일별 통계
  dailyStats: Record<string, DailyStats>;

  // 스트릭
  currentStreak: number;
  lastStudyDate: string | null;

  // 커스텀 단어장
  customWordSets: CustomWordSet[];

  // 학습 플랜
  activeStudyPlan: ActiveStudyPlan | null;
}
