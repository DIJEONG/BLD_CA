'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLearningStore } from '@/store/useLearningStore';
import { useStore } from '@/store/useStore';
import { getWordSetById, getWordsByIds } from '@/data/words';
import { getTodayString } from '@/lib/date';
import { Word, WordSet, Confidence } from '@/types';
import { Input } from '@/components/ui/input';
import LearningResult from './LearningResult';
import { speak, isTTSSupported } from '@/lib/tts';

interface LearningPageProps {
  wordSetId: string;
  onFinish: () => void;
  wrongWordsMode?: boolean;
}

type LearningPhase = 'preview' | 'flashcard' | 'typing' | 'result';

export default function LearningPage({ wordSetId, onFinish, wrongWordsMode = false }: LearningPageProps) {
  const [phase, setPhase] = useState<LearningPhase>('preview');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [previewWords, setPreviewWords] = useState<Word[]>([]);
  const [reviewWordIds, setReviewWordIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const profile = useStore((state) => state.profile);
  const getWordsForReview = useStore((state) => state.getWordsForReview);
  const getCustomWordSets = useStore((state) => state.getCustomWordSets);
  const getWrongWords = useStore((state) => state.getWrongWords);
  const clearWrongCount = useStore((state) => state.clearWrongCount);

  const wordSet = useMemo(() => {
    const builtInSet = getWordSetById(wordSetId);
    if (builtInSet) return builtInSet;

    const customSets = getCustomWordSets();
    const customSet = customSets.find(ws => ws.id === wordSetId);
    if (customSet) {
      return {
        id: customSet.id,
        name: customSet.name,
        description: customSet.description,
        gradeLevel: 'custom',
        words: customSet.words,
      } as WordSet;
    }

    return undefined;
  }, [wordSetId, getCustomWordSets]);

  // 모든 단어장(기본 + 커스텀)에서 단어 ID로 검색
  const findAllWordsByIds = (wordIds: string[], customSets: ReturnType<typeof getCustomWordSets>): Word[] => {
    const builtInWords = getWordsByIds(wordIds);
    const foundIds = new Set(builtInWords.map(w => w.id));

    // 커스텀 단어장에서도 검색
    const customWords: Word[] = [];

    for (const ws of customSets) {
      for (const word of ws.words) {
        if (wordIds.includes(word.id) && !foundIds.has(word.id)) {
          customWords.push(word);
          foundIds.add(word.id);
        }
      }
    }

    return [...builtInWords, ...customWords];
  };

  const {
    isActive,
    words,
    currentIndex,
    isRevealed,
    flashcardAnswers,
    userInput,
    isTypingRevealed,
    isCorrect,
    typingAnswers,
    startSession,
    revealAnswer,
    markFlashcard,
    isFlashcardComplete,
    getFlashcardProgress,
    startTypingPhase,
    setUserInput,
    submitTypingAnswer,
    giveUpTyping,
    nextTypingWord,
    getTypingProgress,
    completeSession,
    resetSession,
    getCurrentWord,
    getHint,
    attemptCount,
  } = useLearningStore();

  const currentWord = getCurrentWord();
  const dailyGoal = profile?.dailyWordCount || 20;

  useEffect(() => {
    if (!initialized) {
      // 오답 복습 모드
      if (wrongWordsMode) {
        const wrongProgress = getWrongWords();
        const wrongWordIdsArray = wrongProgress.map(p => p.wordId);
        const customSets = getCustomWordSets();
        const wrongWordObjects = findAllWordsByIds(wrongWordIdsArray, customSets);

        setReviewWordIds(new Set(wrongWordIdsArray));
        setPreviewWords(wrongWordObjects);
        setInitialized(true);
        return;
      }

      // 일반 모드
      if (wordSet) {
        const wordProgress = useStore.getState().wordProgress;

        // 단어를 카테고리별로 분류
        const newWords: Word[] = []; // 처음 보는 단어
        const learningWords: Word[] = []; // 학습 중 (box 1-2 또는 repetitionCount < 3)
        const reviewWords: Word[] = []; // 복습 필요 (오늘 복습 예정)
        const memorizedWords: Word[] = []; // 외운 단어 (box 4-5 또는 repetitionCount >= 5)

        const today = getTodayString();

        for (const word of wordSet.words) {
          const progress = wordProgress[word.id];

          if (!progress || progress.attemptCount === 0) {
            // 한 번도 학습하지 않은 새 단어
            newWords.push(word);
          } else if (progress.nextReviewDate && progress.nextReviewDate <= today) {
            // 오늘 복습 예정인 단어
            reviewWords.push(word);
          } else if (progress.box >= 4 || (progress.repetitionCount && progress.repetitionCount >= 5)) {
            // 충분히 외운 단어 (뒤로)
            memorizedWords.push(word);
          } else {
            // 학습 중인 단어
            learningWords.push(word);
          }
        }

        // 각 카테고리 내에서 셔플
        const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

        const shuffledNew = shuffle(newWords);
        const shuffledLearning = shuffle(learningWords);
        const shuffledReview = shuffle(reviewWords);
        const shuffledMemorized = shuffle(memorizedWords);

        // 우선순위: 복습 → 새 단어 → 학습 중 → 외운 단어
        const prioritizedWords = [
          ...shuffledReview,
          ...shuffledNew,
          ...shuffledLearning,
          ...shuffledMemorized,
        ].slice(0, dailyGoal);

        // 복습 단어 ID 설정 (UI 표시용)
        const reviewWordIdsArray = reviewWords.map(w => w.id);
        setReviewWordIds(new Set(reviewWordIdsArray));
        setPreviewWords(prioritizedWords);
        setInitialized(true);
      }
    }
  }, [wordSet, initialized, dailyGoal, getWordsForReview, wrongWordsMode, getWrongWords, getCustomWordSets]);

  useEffect(() => {
    if (isActive && (phase === 'flashcard' || phase === 'typing')) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, phase]);

  useEffect(() => {
    if (phase === 'typing' && !isTypingRevealed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, isTypingRevealed, currentIndex]);

  // TTS: 플래시카드 정답 공개 시 자동 발음
  useEffect(() => {
    if (phase === 'flashcard' && isRevealed && currentWord) {
      speak(currentWord.english);
    }
  }, [phase, isRevealed, currentWord]);

  const handleStartLearning = () => {
    resetSession();
    startSession(previewWords, wordSetId);
    setPhase('flashcard');
  };

  // 다른 단어로 섞기 (스마트 알고리즘)
  const handleShuffleWords = () => {
    if (!wordSet || wrongWordsMode) return;

    const wordProgress = useStore.getState().wordProgress;
    const today = getTodayString();

    // 단어 분류
    const newWords: Word[] = [];
    const learningWords: Word[] = [];
    const reviewWords: Word[] = [];
    const memorizedWords: Word[] = [];

    for (const word of wordSet.words) {
      const progress = wordProgress[word.id];

      if (!progress || progress.attemptCount === 0) {
        newWords.push(word);
      } else if (progress.nextReviewDate && progress.nextReviewDate <= today) {
        reviewWords.push(word);
      } else if (progress.box >= 4 || (progress.repetitionCount && progress.repetitionCount >= 5)) {
        memorizedWords.push(word);
      } else {
        learningWords.push(word);
      }
    }

    // 셔플
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const prioritizedWords = [
      ...shuffle(reviewWords),
      ...shuffle(newWords),
      ...shuffle(learningWords),
      ...shuffle(memorizedWords),
    ].slice(0, dailyGoal);

    setReviewWordIds(new Set(reviewWords.map(w => w.id)));
    setPreviewWords(prioritizedWords);
  };

  const handleStartTyping = () => {
    startTypingPhase();
    setPhase('typing');
  };

  const handleReveal = useCallback(() => {
    if (!isRevealed) {
      revealAnswer();
    }
  }, [isRevealed, revealAnswer]);

  const handleMarkFlashcard = useCallback((knew: boolean, confidence: Confidence = 'sure') => {
    markFlashcard(knew, confidence);
  }, [markFlashcard]);

  const handleSubmitTyping = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isTypingRevealed && userInput.trim()) {
      submitTypingAnswer();
    }
  }, [isTypingRevealed, userInput, submitTypingAnswer]);

  const handleNextTyping = useCallback(() => {
    if (currentIndex >= words.length - 1) {
      completeSession();
      // 오답 복습 모드에서 세션 완료 시 wrongCount 초기화
      if (wrongWordsMode) {
        words.forEach(word => clearWrongCount(word.id));
      }
      setPhase('result');
    } else {
      nextTypingWord();
    }
  }, [currentIndex, words.length, completeSession, nextTypingWord, wrongWordsMode, words, clearWrongCount]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase === 'flashcard') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isRevealed) {
          handleReveal();
        }
      } else if (isRevealed) {
        // 1: 확실히 알았다, 2: 애매하게 알았다, 3: 몰랐다
        if (e.key === '1' || e.key === 'ArrowRight') {
          handleMarkFlashcard(true, 'sure');
        } else if (e.key === '2' || e.key === 'ArrowUp') {
          handleMarkFlashcard(true, 'unsure');
        } else if (e.key === '3' || e.key === 'ArrowLeft' || e.key === 'x' || e.key === 'X') {
          handleMarkFlashcard(false);
        }
      }
    } else if (phase === 'typing') {
      // 타이핑 단계: 정답 공개 후 Enter로 다음 단어
      if (e.key === 'Enter' && isTypingRevealed) {
        e.preventDefault();
        handleNextTyping();
      }
      // ESC: 모름 (포기)
      if (e.key === 'Escape' && !isTypingRevealed) {
        e.preventDefault();
        giveUpTyping();
      }
    }
  }, [phase, isRevealed, handleReveal, handleMarkFlashcard, isTypingRevealed, handleNextTyping, giveUpTyping]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTypingKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isTypingRevealed) {
        handleNextTyping();
      } else if (userInput.trim()) {
        handleSubmitTyping();
      }
    }
  }, [isTypingRevealed, userInput, handleNextTyping, handleSubmitTyping]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== 결과 페이지 =====
  if (phase === 'result') {
    return <LearningResult onFinish={onFinish} />;
  }

  // ===== 미리보기 단계 =====
  if (phase === 'preview') {
    // 초기화 중
    if (!initialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 uppercase tracking-wider">Loading...</p>
        </div>
      );
    }

    // 학습할 단어가 없는 경우
    if (previewWords.length === 0) {
      return (
        <div className="min-h-screen bg-white">
          <header className="border-b-2 border-black">
            <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={onFinish}
              >
                ← EXIT
              </button>
              <span className="font-mono text-sm">{wrongWordsMode ? '오답 복습' : wordSet?.name}</span>
              <div className="w-16" />
            </div>
          </header>
          <main className="max-w-2xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-serif font-bold mb-4">
              {wrongWordsMode ? '복습할 오답이 없습니다' : '학습할 단어가 없습니다'}
            </h1>
            <p className="text-gray-500 mb-8">
              {wrongWordsMode
                ? '틀린 단어가 없거나 해당 단어장이 삭제되었습니다.'
                : '단어장에 단어가 없습니다.'}
            </p>
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={onFinish}
            >
              돌아가기
            </button>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <header className="border-b-2 border-black">
          <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={onFinish}
            >
              ← EXIT
            </button>
            <span className="font-mono text-sm">{wrongWordsMode ? '오답 복습' : wordSet?.name}</span>
            <div className="w-16" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
              {wrongWordsMode ? 'Wrong Words Review' : "Today's Session"}
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2">
              {previewWords.length} WORDS
            </h1>
            {wrongWordsMode ? (
              <span className="tag-error">
                틀린 단어 집중 학습
              </span>
            ) : reviewWordIds.size > 0 && (
              <span className="tag-teal">
                REVIEW {reviewWordIds.size}
              </span>
            )}
          </div>

          {/* 학습 단계 안내 */}
          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-8">
            <div className="p-4 sm:p-6 border-r border-black text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Phase 1</p>
              <h3 className="font-serif font-bold text-base sm:text-lg">FLASHCARD</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">암기</p>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Phase 2</p>
              <h3 className="font-serif font-bold text-base sm:text-lg">TYPING</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">테스트</p>
            </div>
          </div>

          {/* 단어 목록 */}
          <div className="border-2 border-black mb-8">
            <div className="border-b border-black px-4 py-2 flex justify-between items-center">
              <span className="text-sm uppercase tracking-wider">Word List</span>
              {!wrongWordsMode && wordSet && wordSet.words.length > dailyGoal && (
                <button
                  className="text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                  onClick={handleShuffleWords}
                >
                  다른 단어 ↻
                </button>
              )}
            </div>
            <div>
              {previewWords.map((word, index) => {
                const isReview = reviewWordIds.has(word.id);
                return (
                  <div
                    key={word.id}
                    className={`flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 ${
                      index > 0 ? 'border-t border-black' : ''
                    } ${isReview ? 'bg-gray-50' : ''}`}
                  >
                    <span className="font-mono text-xs sm:text-sm w-6 sm:w-8">{String(index + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm sm:text-base">{word.english}</span>
                      <span className="text-gray-400 mx-1 sm:mx-2">—</span>
                      <span className="text-gray-600 text-sm sm:text-base">{word.korean}</span>
                    </div>
                    {isReview && (
                      <span className={`${wrongWordsMode ? 'tag-error' : 'tag-teal'} text-[10px] sm:text-xs shrink-0`}>
                        {wrongWordsMode ? 'WRONG' : 'REVIEW'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="w-full py-4 border-2 border-black bg-black text-white font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            onClick={handleStartLearning}
          >
            START PHASE 1 →
          </button>

          <p className="text-center text-xs text-gray-400 mt-4 uppercase tracking-wider">
            Review words before starting
          </p>
        </main>
      </div>
    );
  }

  // ===== 플래시카드 완료 → 타이핑 전환 화면 =====
  if (phase === 'flashcard' && isFlashcardComplete()) {
    const flashcardProgress = getFlashcardProgress();

    return (
      <div className="min-h-screen bg-white">
        <header className="border-b-2 border-black">
          <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={onFinish}
            >
              ← EXIT
            </button>
            <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-16 text-center">
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-4">
            Phase 1 Complete
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-8">FLASHCARD DONE</h1>

          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-8 max-w-sm mx-auto">
            <div className="p-4 sm:p-6 border-r border-black">
              <p className="data-label">알았다</p>
              <p className="data-value font-mono">{flashcardProgress.knew}</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="data-label">몰랐다</p>
              <p className="data-value font-mono">{flashcardProgress.didntKnow}</p>
            </div>
          </div>

          <div className="border-2 border-black p-4 sm:p-6 mb-8 max-w-sm mx-auto">
            <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">Next</p>
            <h3 className="font-serif font-bold text-lg sm:text-xl">PHASE 2: TYPING</h3>
            <p className="text-sm text-gray-500 mt-2">직접 입력해서 테스트해보세요</p>
          </div>

          <button
            className="px-8 py-4 border-2 border-black bg-black text-white font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            onClick={handleStartTyping}
          >
            START PHASE 2 →
          </button>
        </main>
      </div>
    );
  }

  // ===== 1단계: 플래시카드 =====
  if (phase === 'flashcard') {
    if (!currentWord || !isActive) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 uppercase tracking-wider">Loading...</p>
        </div>
      );
    }

    const flashcardProgress = getFlashcardProgress();
    const currentQuestion = currentIndex + 1;
    const progressPercent = (currentQuestion / flashcardProgress.total) * 100;

    return (
      <div className="min-h-screen bg-white">
        <header className="border-b-2 border-black">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={onFinish}
              >
                ← EXIT
              </button>
              <div className="flex items-center gap-4">
                <span className="tag-teal">PHASE 1</span>
                <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <div className="progress-editorial">
              <div
                className="progress-editorial-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 font-mono">
              <span>{currentQuestion}/{flashcardProgress.total}</span>
              <div className="flex gap-4">
                <span>○ {flashcardProgress.knew}</span>
                <span>✕ {flashcardProgress.didntKnow}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-12">
          {/* 3D 플립 카드 */}
          <div
            className="flashcard-container h-[350px] sm:h-[400px]"
            onClick={!isRevealed ? handleReveal : undefined}
          >
            <div className={`flashcard-inner ${isRevealed ? 'flipped' : ''}`}>
              {/* 앞면: 한국어 뜻 */}
              <div className="flashcard-front cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="border-b border-black px-4 py-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">뜻</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-center mb-8">
                    {currentWord.korean}
                  </h2>
                  <div className="text-center">
                    <p className="text-gray-400 uppercase tracking-wider mb-1 text-sm sm:text-base">
                      Tap to flip
                    </p>
                    <p className="text-xs text-gray-300">SPACE / ENTER</p>
                  </div>
                </div>
              </div>

              {/* 뒷면: 영어 정답 + 버튼 */}
              <div className="flashcard-back flex flex-col">
                <div className="border-b border-black px-4 py-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">정답</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    <p className="text-2xl sm:text-4xl font-serif font-bold">
                      {currentWord.english}
                    </p>
                    {isTTSSupported() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(currentWord.english);
                        }}
                        className="p-1.5 sm:p-2 border border-black hover:bg-black hover:text-white transition-colors text-sm sm:text-base"
                        title="발음 듣기"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {currentWord.pronunciation && (
                    <p className="text-gray-500 font-mono text-sm sm:text-base">
                      {currentWord.pronunciation}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 border-t-2 border-black">
                  <button
                    className="py-4 sm:py-6 border-r border-black transition-colors uppercase tracking-wider font-semibold text-xs sm:text-sm hover:text-white"
                    style={{ backgroundColor: 'var(--accent-error-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-error)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-error-light)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkFlashcard(false);
                    }}
                  >
                    <span className="hidden sm:inline">✕ </span>몰랐다
                  </button>
                  <button
                    className="py-4 sm:py-6 border-r border-black transition-colors uppercase tracking-wider font-semibold text-xs sm:text-sm"
                    style={{ backgroundColor: 'var(--accent-amber-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-amber-light)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkFlashcard(true, 'unsure');
                    }}
                  >
                    <span className="hidden sm:inline">△ </span>애매함
                  </button>
                  <button
                    className="py-4 sm:py-6 transition-colors uppercase tracking-wider font-semibold text-xs sm:text-sm hover:text-white"
                    style={{ backgroundColor: 'var(--accent-success-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-success)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-success-light)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkFlashcard(true, 'sure');
                    }}
                  >
                    <span className="hidden sm:inline">○ </span>확실함
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 uppercase tracking-wider hidden sm:block">
            {!isRevealed
              ? 'SPACE / ENTER: Flip'
              : '1/→: 확실함  |  2/↑: 애매함  |  3/←: 몰랐다'
            }
          </p>
        </main>
      </div>
    );
  }

  // ===== 2단계: 타이핑 테스트 =====
  if (phase === 'typing') {
    if (!currentWord || !isActive) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500 uppercase tracking-wider">Loading...</p>
        </div>
      );
    }

    const typingProgress = getTypingProgress();
    const currentQuestion = currentIndex + 1;
    const progressPercent = (currentQuestion / typingProgress.total) * 100;
    const hintInfo = getHint();

    return (
      <div className="min-h-screen bg-white">
        <header className="border-b-2 border-black">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={onFinish}
              >
                ← EXIT
              </button>
              <div className="flex items-center gap-4">
                <span className="tag-amber">PHASE 2</span>
                <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <div className="progress-editorial">
              <div
                className="progress-editorial-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 font-mono">
              <span>{currentQuestion}/{typingProgress.total}</span>
              <div className="flex gap-4">
                <span>○ {typingProgress.correct}</span>
                <span>✕ {typingProgress.wrong}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-12">
          <div className="border-2 border-black">
            <div className="border-b border-black px-4 py-2">
              <span className="text-xs uppercase tracking-wider text-gray-500">뜻</span>
            </div>
            <div className="p-4 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-serif font-bold">{currentWord.korean}</h2>
            </div>

            {/* 최종 정답/오답 공개 */}
            {isTypingRevealed && (
              <div
                className="border-t-2 border-black p-4 sm:p-6 text-center"
                style={{ backgroundColor: isCorrect ? 'var(--accent-success-light)' : 'var(--accent-error-light)' }}
              >
                <p
                  className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3"
                  style={{ color: isCorrect ? 'var(--accent-success)' : 'var(--accent-error)' }}
                >
                  {isCorrect ? '정답!' : '오답'}
                </p>
                <p className="text-2xl sm:text-3xl font-serif font-bold">{currentWord.english}</p>
              </div>
            )}

            {/* 힌트 표시 */}
            {!isTypingRevealed && hintInfo && hintInfo.hint && (
              <div className="border-t border-black p-4 text-center bg-gray-50">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                  Hint ({attemptCount - 1}/{(hintInfo.maxAttempts || 4) - 1})
                </p>
                <p className="font-mono text-lg font-bold">
                  {hintInfo.hint}
                </p>
              </div>
            )}

            {/* 재시도 안내 */}
            {!isTypingRevealed && isCorrect === false && attemptCount > 1 && (
              <div className="border-t border-black p-3 text-center bg-gray-100">
                <p className="text-sm text-gray-600">
                  오답! 다시 시도 ({attemptCount}/{hintInfo?.maxAttempts || 4})
                </p>
              </div>
            )}

            {/* 입력 폼 */}
            <form onSubmit={handleSubmitTyping} className="border-t-2 border-black">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type the English word"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleTypingKeyDown}
                disabled={isTypingRevealed}
                className={`w-full px-4 py-6 text-center text-xl border-0 focus:ring-0 ${
                  !isTypingRevealed && isCorrect === false ? 'bg-red-50' : ''
                }`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />

              {!isTypingRevealed ? (
                <div className="grid grid-cols-2 border-t-2 border-black">
                  <button
                    type="button"
                    className="py-4 border-r border-black uppercase tracking-wider font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'var(--accent-error-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-error)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-error-light)'}
                    onClick={giveUpTyping}
                  >
                    모름
                  </button>
                  <button
                    type="submit"
                    className="py-4 bg-black text-white uppercase tracking-wider font-semibold hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                    disabled={!userInput.trim()}
                  >
                    {attemptCount === 1 ? 'CHECK' : 'TRY AGAIN'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full py-4 border-t-2 border-black bg-black text-white uppercase tracking-wider font-semibold hover:bg-white hover:text-black transition-colors"
                  onClick={handleNextTyping}
                >
                  {currentIndex >= words.length - 1 ? 'VIEW RESULT →' : 'NEXT →'}
                </button>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 uppercase tracking-wider">
            {!isTypingRevealed
              ? 'ENTER: 확인  |  ESC: 모름'
              : 'Press ENTER to continue'
            }
          </p>
        </main>
      </div>
    );
  }

  return null;
}
