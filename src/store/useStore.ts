'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  UserProfile,
  WordProgress,
  LearningSession,
  DailyStats,
  LeitnerBox,
  LEITNER_INTERVALS,
  CustomWordSet,
  Word,
} from '@/types';

interface StoreActions {
  // 온보딩
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // 학습 진도 (Leitner System)
  updateWordProgress: (wordId: string, knew: boolean) => void;
  getWordProgress: (wordId: string) => WordProgress | undefined;
  initWordProgress: (wordId: string) => WordProgress;

  // 복습 단어 조회
  getWordsForReview: () => WordProgress[];
  getReviewCount: () => number;

  // 세션
  addSession: (session: LearningSession) => void;
  getTodaySessions: () => LearningSession[];

  // 일별 통계
  updateDailyStats: (session: LearningSession) => void;
  getTodayStats: () => DailyStats | undefined;
  getWeeklyStats: () => DailyStats[];

  // 스트릭
  updateStreak: () => void;

  // 커스텀 단어장
  addCustomWordSet: (name: string, description: string) => CustomWordSet;
  updateCustomWordSet: (id: string, updates: Partial<Pick<CustomWordSet, 'name' | 'description'>>) => void;
  deleteCustomWordSet: (id: string) => void;
  addWordToCustomSet: (setId: string, word: Omit<Word, 'id'>) => void;
  removeWordFromCustomSet: (setId: string, wordId: string) => void;
  getCustomWordSets: () => CustomWordSet[];

  // 리셋
  resetAll: () => void;
}

const initialState: AppState = {
  profile: null,
  isOnboarded: false,
  wordProgress: {},
  sessions: [],
  dailyStats: {},
  currentStreak: 0,
  lastStudyDate: null,
  customWordSets: [],
};

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 날짜 차이 계산 (일 단위)
function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// 다음 복습일 계산 (Leitner)
function getNextReviewDate(box: LeitnerBox): string {
  const today = new Date();
  const daysToAdd = LEITNER_INTERVALS[box];
  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split('T')[0];
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProfile: (profile) => {
        set({ profile, isOnboarded: true });
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (current) {
          set({ profile: { ...current, ...updates } });
        }
      },

      // 새 단어 초기화 (Box 1, 오늘 복습)
      initWordProgress: (wordId) => {
        const today = getTodayString();
        const newProgress: WordProgress = {
          wordId,
          box: 1,
          nextReviewDate: today,
          lastStudiedAt: '',
          attemptCount: 0,
          correctCount: 0,
        };
        return newProgress;
      },

      // Leitner 시스템으로 단어 진도 업데이트
      updateWordProgress: (wordId, knew) => {
        const today = getTodayString();
        const current = get().wordProgress[wordId] || get().initWordProgress(wordId);

        let newBox: LeitnerBox;
        if (knew) {
          // 알았다: 다음 Box로 승급 (최대 5)
          newBox = Math.min(current.box + 1, 5) as LeitnerBox;
        } else {
          // 몰랐다: Box 1로 강등
          newBox = 1;
        }

        const updated: WordProgress = {
          wordId,
          box: newBox,
          nextReviewDate: getNextReviewDate(newBox),
          lastStudiedAt: new Date().toISOString(),
          attemptCount: current.attemptCount + 1,
          correctCount: current.correctCount + (knew ? 1 : 0),
        };

        set((state) => ({
          wordProgress: {
            ...state.wordProgress,
            [wordId]: updated,
          },
        }));
      },

      getWordProgress: (wordId) => {
        return get().wordProgress[wordId];
      },

      // 오늘 복습할 단어 목록 (nextReviewDate <= 오늘)
      getWordsForReview: () => {
        const today = getTodayString();
        const allProgress = Object.values(get().wordProgress);

        return allProgress.filter(
          (p) => p.nextReviewDate <= today && p.attemptCount > 0
        );
      },

      // 복습 필요한 단어 개수
      getReviewCount: () => {
        return get().getWordsForReview().length;
      },

      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
        }));
        get().updateDailyStats(session);
        get().updateStreak();
      },

      getTodaySessions: () => {
        const today = getTodayString();
        return get().sessions.filter((s) => s.date === today);
      },

      updateDailyStats: (session) => {
        const today = getTodayString();
        const current = get().dailyStats[today] || {
          date: today,
          wordsStudied: 0,
          correctCount: 0,
          wrongCount: 0,
          totalTimeSeconds: 0,
          sessionsCount: 0,
        };

        const updated: DailyStats = {
          ...current,
          wordsStudied: current.wordsStudied + session.totalWords,
          correctCount: current.correctCount + session.correctCount,
          wrongCount: current.wrongCount + session.wrongCount,
          totalTimeSeconds: current.totalTimeSeconds + session.durationSeconds,
          sessionsCount: current.sessionsCount + 1,
        };

        set((state) => ({
          dailyStats: {
            ...state.dailyStats,
            [today]: updated,
          },
        }));
      },

      getTodayStats: () => {
        const today = getTodayString();
        return get().dailyStats[today];
      },

      getWeeklyStats: () => {
        const stats: DailyStats[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          stats.push(
            get().dailyStats[dateStr] || {
              date: dateStr,
              wordsStudied: 0,
              correctCount: 0,
              wrongCount: 0,
              totalTimeSeconds: 0,
              sessionsCount: 0,
            }
          );
        }

        return stats;
      },

      updateStreak: () => {
        const today = getTodayString();
        const lastDate = get().lastStudyDate;

        if (!lastDate) {
          set({ currentStreak: 1, lastStudyDate: today });
          return;
        }

        if (lastDate === today) {
          return; // 오늘 이미 학습함
        }

        const daysDiff = getDaysDiff(lastDate, today);

        if (daysDiff === 1) {
          // 연속 학습
          set((state) => ({
            currentStreak: state.currentStreak + 1,
            lastStudyDate: today,
          }));
        } else {
          // 스트릭 끊김
          set({ currentStreak: 1, lastStudyDate: today });
        }
      },

      // === 커스텀 단어장 ===
      addCustomWordSet: (name, description) => {
        const now = new Date().toISOString();
        const newSet: CustomWordSet = {
          id: `custom-${Date.now()}`,
          name,
          description,
          words: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          customWordSets: [...state.customWordSets, newSet],
        }));

        return newSet;
      },

      updateCustomWordSet: (id, updates) => {
        set((state) => ({
          customWordSets: state.customWordSets.map((ws) =>
            ws.id === id
              ? { ...ws, ...updates, updatedAt: new Date().toISOString() }
              : ws
          ),
        }));
      },

      deleteCustomWordSet: (id) => {
        set((state) => ({
          customWordSets: state.customWordSets.filter((ws) => ws.id !== id),
        }));
      },

      addWordToCustomSet: (setId, word) => {
        const newWord: Word = {
          id: `cw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...word,
        };

        set((state) => ({
          customWordSets: state.customWordSets.map((ws) =>
            ws.id === setId
              ? {
                  ...ws,
                  words: [...ws.words, newWord],
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      removeWordFromCustomSet: (setId, wordId) => {
        set((state) => ({
          customWordSets: state.customWordSets.map((ws) =>
            ws.id === setId
              ? {
                  ...ws,
                  words: ws.words.filter((w) => w.id !== wordId),
                  updatedAt: new Date().toISOString(),
                }
              : ws
          ),
        }));
      },

      getCustomWordSets: () => {
        return get().customWordSets;
      },

      resetAll: () => {
        set(initialState);
      },
    }),
    {
      name: 'vocab-app-storage',
    }
  )
);
