// 단어 타입
export interface Word {
  id: string;
  english: string;
  korean: string;
  pronunciation?: string;
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

// 단어별 학습 진도 (Leitner System)
export interface WordProgress {
  wordId: string;
  box: LeitnerBox;              // Leitner Box (1~5)
  nextReviewDate: string;       // 다음 복습일 (YYYY-MM-DD)
  lastStudiedAt: string;        // 마지막 학습일
  attemptCount: number;         // 총 시도 횟수
  correctCount: number;         // 정답 횟수
}

// Leitner 복습 간격 (일 단위)
export const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
  1: 1,   // 매일
  2: 2,   // 2일
  3: 4,   // 4일
  4: 7,   // 7일
  5: 14,  // 14일
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
}
