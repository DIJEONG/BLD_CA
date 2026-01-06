'use client';

import { create } from 'zustand';
import { Word, SessionAnswer, LearningSession, Confidence } from '@/types';
import { useStore } from './useStore';
import { getTodayString } from '@/lib/date';

// 플래시카드 답변 (1단계)
interface FlashcardAnswer {
  wordId: string;
  knew: boolean;
  confidence?: Confidence;
  timeSpentMs: number;
}

interface LearningState {
  // 현재 학습 세션
  isActive: boolean;
  words: Word[];
  currentIndex: number;
  startTime: number | null;
  wordStartTime: number | null;

  // 1단계: 플래시카드 결과
  flashcardAnswers: FlashcardAnswer[];
  isRevealed: boolean;

  // 2단계: 타이핑 테스트
  typingAnswers: SessionAnswer[];
  userInput: string;
  isTypingRevealed: boolean;
  isCorrect: boolean | null;

  // 힌트 시스템
  attemptCount: number; // 현재 단어 시도 횟수 (1부터 시작)

  // 액션 - 공통
  startSession: (words: Word[], wordSetId: string) => void;
  resetSession: () => void;
  getCurrentWord: () => Word | null;
  getProgress: () => { current: number; total: number; correct: number; wrong: number };
  getElapsedTime: () => number;

  // 액션 - 1단계 플래시카드
  revealAnswer: () => void;
  markFlashcard: (knew: boolean, confidence?: Confidence) => void;
  isFlashcardComplete: () => boolean;
  getFlashcardProgress: () => { current: number; total: number; knew: number; didntKnow: number };

  // 액션 - 2단계 타이핑 (플래시카드 완료 후)
  startTypingPhase: () => void;
  setUserInput: (input: string) => void;
  submitTypingAnswer: () => void;
  giveUpTyping: () => void;
  nextTypingWord: () => void;
  isTypingComplete: () => boolean;
  getTypingProgress: () => { current: number; total: number; correct: number; wrong: number };

  // 힌트 시스템
  getHint: () => { hint: string; attemptNum: number; maxAttempts: number } | null;
  shouldShowAnswer: () => boolean;

  // 세션 완료
  completeSession: () => LearningSession;
}

let currentWordSetId = '';

export const useLearningStore = create<LearningState>((set, get) => ({
  isActive: false,
  words: [],
  currentIndex: 0,
  startTime: null,
  wordStartTime: null,

  // 1단계 상태
  flashcardAnswers: [],
  isRevealed: false,

  // 2단계 상태
  typingAnswers: [],
  userInput: '',
  isTypingRevealed: false,
  isCorrect: null,

  // 힌트 시스템
  attemptCount: 1,

  // === 공통 액션 ===
  startSession: (words, wordSetId) => {
    currentWordSetId = wordSetId;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    set({
      isActive: true,
      words: shuffled,
      currentIndex: 0,
      startTime: Date.now(),
      wordStartTime: Date.now(),
      flashcardAnswers: [],
      isRevealed: false,
      typingAnswers: [],
      userInput: '',
      isTypingRevealed: false,
      isCorrect: null,
    });
  },

  resetSession: () => {
    set({
      isActive: false,
      words: [],
      currentIndex: 0,
      startTime: null,
      wordStartTime: null,
      flashcardAnswers: [],
      isRevealed: false,
      typingAnswers: [],
      userInput: '',
      isTypingRevealed: false,
      isCorrect: null,
    });
  },

  getCurrentWord: () => {
    const { words, currentIndex } = get();
    return words[currentIndex] || null;
  },

  getProgress: () => {
    const { words, typingAnswers } = get();
    return {
      current: typingAnswers.length,
      total: words.length,
      correct: typingAnswers.filter((a) => a.knew).length,
      wrong: typingAnswers.filter((a) => !a.knew).length,
    };
  },

  getElapsedTime: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  },

  // === 1단계: 플래시카드 ===
  revealAnswer: () => {
    set({ isRevealed: true });
  },

  markFlashcard: (knew, confidence = 'sure') => {
    const { words, currentIndex, wordStartTime, flashcardAnswers } = get();
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    // Leitner 진도 업데이트 (확신도 반영)
    useStore.getState().updateWordProgress(currentWord.id, knew, confidence);

    const answer: FlashcardAnswer = {
      wordId: currentWord.id,
      knew,
      confidence: knew ? confidence : undefined,
      timeSpentMs: Date.now() - (wordStartTime || Date.now()),
    };

    const newAnswers = [...flashcardAnswers, answer];
    const nextIndex = currentIndex + 1;

    if (nextIndex < words.length) {
      set({
        flashcardAnswers: newAnswers,
        currentIndex: nextIndex,
        isRevealed: false,
        wordStartTime: Date.now(),
      });
    } else {
      // 플래시카드 완료
      set({
        flashcardAnswers: newAnswers,
        isRevealed: false,
      });
    }
  },

  isFlashcardComplete: () => {
    const { words, flashcardAnswers } = get();
    return flashcardAnswers.length >= words.length;
  },

  getFlashcardProgress: () => {
    const { words, flashcardAnswers } = get();
    return {
      current: flashcardAnswers.length,
      total: words.length,
      knew: flashcardAnswers.filter((a) => a.knew).length,
      didntKnow: flashcardAnswers.filter((a) => !a.knew).length,
    };
  },

  // === 2단계: 타이핑 테스트 ===
  startTypingPhase: () => {
    const { words } = get();
    // 단어 다시 섞기
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    set({
      words: shuffled,
      currentIndex: 0,
      wordStartTime: Date.now(),
      typingAnswers: [],
      userInput: '',
      isTypingRevealed: false,
      isCorrect: null,
      attemptCount: 1,
    });
  },

  setUserInput: (input) => {
    set({ userInput: input });
  },

  submitTypingAnswer: () => {
    const { words, currentIndex, userInput, wordStartTime, typingAnswers, attemptCount } = get();
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    const normalized = userInput.trim().toLowerCase();
    const correct = currentWord.english.trim().toLowerCase();
    const isCorrect = normalized === correct;

    const MAX_ATTEMPTS = 4;

    if (isCorrect && attemptCount === 1) {
      // 첫 번째 시도에서 정답: 정답으로 기록
      useStore.getState().updateWordProgress(currentWord.id, true);

      const answer: SessionAnswer = {
        wordId: currentWord.id,
        knew: true,
        timeSpentMs: Date.now() - (wordStartTime || Date.now()),
      };

      set({
        typingAnswers: [...typingAnswers, answer],
        isTypingRevealed: true,
        isCorrect: true,
      });
    } else if (isCorrect && attemptCount > 1) {
      // 2번째 이후 시도에서 정답: 힌트 도움 받았으므로 오답 처리
      useStore.getState().updateWordProgress(currentWord.id, false);

      const answer: SessionAnswer = {
        wordId: currentWord.id,
        knew: false, // 힌트 도움 받았으므로 오답
        timeSpentMs: Date.now() - (wordStartTime || Date.now()),
      };

      set({
        typingAnswers: [...typingAnswers, answer],
        isTypingRevealed: true,
        isCorrect: true, // UI에서는 정답으로 표시
      });
    } else if (attemptCount >= MAX_ATTEMPTS) {
      // 4회차 오답: 정답 공개, 오답으로 기록
      useStore.getState().updateWordProgress(currentWord.id, false);

      const answer: SessionAnswer = {
        wordId: currentWord.id,
        knew: false,
        timeSpentMs: Date.now() - (wordStartTime || Date.now()),
      };

      set({
        typingAnswers: [...typingAnswers, answer],
        isTypingRevealed: true,
        isCorrect: false,
      });
    } else {
      // 오답이지만 시도 기회 남음: 힌트와 함께 재시도
      set({
        attemptCount: attemptCount + 1,
        userInput: '',
        isCorrect: false, // 오답 피드백 표시용
      });
    }
  },

  // 모름 버튼: 정답 공개하고 오답 처리
  giveUpTyping: () => {
    const { words, currentIndex, wordStartTime, typingAnswers } = get();
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    // 오답으로 기록
    useStore.getState().updateWordProgress(currentWord.id, false);

    const answer: SessionAnswer = {
      wordId: currentWord.id,
      knew: false,
      timeSpentMs: Date.now() - (wordStartTime || Date.now()),
    };

    set({
      typingAnswers: [...typingAnswers, answer],
      isTypingRevealed: true,
      isCorrect: false,
    });
  },

  nextTypingWord: () => {
    const { currentIndex, words } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= words.length) return;

    set({
      currentIndex: nextIndex,
      userInput: '',
      isTypingRevealed: false,
      isCorrect: null,
      wordStartTime: Date.now(),
      attemptCount: 1,
    });
  },

  isTypingComplete: () => {
    const { words, typingAnswers } = get();
    return typingAnswers.length >= words.length;
  },

  getTypingProgress: () => {
    const { words, typingAnswers } = get();
    return {
      current: typingAnswers.length,
      total: words.length,
      correct: typingAnswers.filter((a) => a.knew).length,
      wrong: typingAnswers.filter((a) => !a.knew).length,
    };
  },

  // === 힌트 시스템 ===
  getHint: () => {
    const { words, currentIndex, attemptCount } = get();
    const currentWord = words[currentIndex];
    if (!currentWord) return null;

    const english = currentWord.english;
    const MAX_ATTEMPTS = 4;

    // 1회차: 힌트 없음
    if (attemptCount === 1) {
      return { hint: '', attemptNum: attemptCount, maxAttempts: MAX_ATTEMPTS };
    }

    // 2회차: 첫 글자 + 밑줄 + 글자 수
    if (attemptCount === 2) {
      const firstLetter = english.charAt(0);
      const underscores = '_'.repeat(english.length - 1);
      const hint = `${firstLetter}${underscores} (${english.length}글자)`;
      return { hint, attemptNum: attemptCount, maxAttempts: MAX_ATTEMPTS };
    }

    // 3회차: 첫 2글자 + 밑줄 + 마지막 글자
    if (attemptCount === 3) {
      const firstTwo = english.slice(0, 2);
      const lastOne = english.charAt(english.length - 1);
      const middleLength = english.length - 3;
      const underscores = middleLength > 0 ? '_'.repeat(middleLength) : '';
      const hint = `${firstTwo}${underscores}${lastOne} (${english.length}글자)`;
      return { hint, attemptNum: attemptCount, maxAttempts: MAX_ATTEMPTS };
    }

    // 4회차 이상: 정답 공개
    return { hint: english, attemptNum: attemptCount, maxAttempts: MAX_ATTEMPTS };
  },

  shouldShowAnswer: () => {
    const { attemptCount } = get();
    return attemptCount >= 4;
  },

  // === 세션 완료 ===
  completeSession: () => {
    const { words, typingAnswers, startTime } = get();
    const correctCount = typingAnswers.filter((a) => a.knew).length;
    const wrongCount = typingAnswers.filter((a) => !a.knew).length;

    const session: LearningSession = {
      id: `session-${Date.now()}`,
      date: getTodayString(),
      wordSetId: currentWordSetId,
      totalWords: words.length,
      correctCount,
      wrongCount,
      durationSeconds: Math.floor((Date.now() - (startTime || Date.now())) / 1000),
      answers: typingAnswers,
    };

    useStore.getState().addSession(session);
    return session;
  },
}));
