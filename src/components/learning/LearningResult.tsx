'use client';

import { useLearningStore } from '@/store/useLearningStore';
import { useStore } from '@/store/useStore';

interface LearningResultProps {
  onFinish: () => void;
}

export default function LearningResult({ onFinish }: LearningResultProps) {
  const { words, typingAnswers, getElapsedTime, resetSession, startSession } = useLearningStore();
  const getWordProgress = useStore((state) => state.getWordProgress);

  const correctCount = typingAnswers.filter((a) => a.knew).length;
  const wrongCount = typingAnswers.filter((a) => !a.knew).length;
  const totalTime = getElapsedTime();
  const accuracy = typingAnswers.length > 0 ? Math.round((correctCount / typingAnswers.length) * 100) : 0;
  const avgTimePerWord = typingAnswers.length > 0 ? Math.round(totalTime / typingAnswers.length) : 0;

  // 모든 단어와 복습 간격
  const allAnswersWithInterval = typingAnswers.map((a) => {
    const word = words.find((w) => w.id === a.wordId);
    const progress = getWordProgress(a.wordId);
    return { ...a, word, interval: progress?.interval || 1 };
  });

  // 정답/오답 분리
  const correctAnswers = allAnswersWithInterval.filter((a) => a.knew);
  const wrongAnswers = allAnswersWithInterval.filter((a) => !a.knew);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 복습 간격 포맷
  const formatInterval = (days: number) => {
    if (days === 1) return '내일';
    if (days < 7) return `${days}일 후`;
    if (days < 14) return '1주 후';
    if (days < 30) return `${Math.round(days / 7)}주 후`;
    return `${Math.round(days / 30)}달 후`;
  };

  const handleRetry = () => {
    const currentWords = [...words];
    resetSession();
    startSession(currentWords, '');
  };

  const handleHome = () => {
    resetSession();
    onFinish();
  };

  // 성과 메시지
  const getMessage = () => {
    if (accuracy === 100) return 'PERFECT';
    if (accuracy >= 90) return 'EXCELLENT';
    if (accuracy >= 70) return 'GOOD JOB';
    if (accuracy >= 50) return 'KEEP GOING';
    return 'NEEDS REVIEW';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b-2 border-foreground">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-sm uppercase tracking-wider text-center">Session Complete</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* 결과 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Result</p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4">{getMessage()}</h1>
          <p className="font-mono text-lg sm:text-xl">{accuracy}%</p>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-2 border-foreground mb-8">
          <div className="p-3 sm:p-4 border-r border-foreground border-b sm:border-b-0 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-mono font-bold">{typingAnswers.length}</p>
          </div>
          <div className="p-3 sm:p-4 sm:border-r border-foreground border-b sm:border-b-0 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Correct</p>
            <p className="text-xl sm:text-2xl font-mono font-bold">{correctCount}</p>
          </div>
          <div className="p-3 sm:p-4 border-r border-foreground text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Wrong</p>
            <p className="text-xl sm:text-2xl font-mono font-bold">{wrongCount}</p>
          </div>
          <div className="p-3 sm:p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Time</p>
            <p className="text-xl sm:text-2xl font-mono font-bold">{formatTime(totalTime)}</p>
          </div>
        </div>

        {/* 다음 복습 일정 */}
        <div className="border-2 border-foreground mb-8">
          <div className="border-b border-foreground px-4 py-2">
            <span className="text-sm uppercase tracking-wider">Next Review</span>
          </div>
          <div className="max-h-[250px] sm:max-h-[300px] overflow-y-auto">
            {/* 정답 단어 */}
            {correctAnswers.map((item, index) => (
              <div
                key={`correct-${index}`}
                className={`flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 ${
                  index > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs sm:text-sm shrink-0" style={{ color: 'var(--accent-success)' }}>○</span>
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-sm sm:text-base">{item.word?.english}</span>
                    <span className="text-muted-foreground mx-1 sm:mx-2">—</span>
                    <span className="text-muted-foreground text-sm sm:text-base">{item.word?.korean}</span>
                  </div>
                </div>
                <span className="font-mono text-xs sm:text-sm shrink-0 ml-2" style={{ color: 'var(--accent-teal)' }}>
                  {formatInterval(item.interval)}
                </span>
              </div>
            ))}

            {/* 오답 단어 */}
            {wrongAnswers.length > 0 && correctAnswers.length > 0 && (
              <div className="border-t-2 border-foreground" />
            )}
            {wrongAnswers.map((item, index) => (
              <div
                key={`wrong-${index}`}
                className={`flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 ${
                  index > 0 ? 'border-t border-border' : ''
                }`}
                style={{ backgroundColor: 'var(--accent-error-light)' }}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs sm:text-sm shrink-0" style={{ color: 'var(--accent-error)' }}>✕</span>
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-sm sm:text-base">{item.word?.english}</span>
                    <span className="text-muted-foreground mx-1 sm:mx-2">—</span>
                    <span className="text-muted-foreground text-sm sm:text-base">{item.word?.korean}</span>
                  </div>
                </div>
                <span className="font-mono text-xs sm:text-sm shrink-0 ml-2" style={{ color: 'var(--accent-error)' }}>
                  내일
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-0 border-2 border-foreground">
          <button
            className="py-4 border-r border-foreground uppercase tracking-wider font-semibold hover:bg-secondary transition-colors"
            onClick={handleRetry}
          >
            Retry
          </button>
          <button
            className="py-4 bg-foreground text-background uppercase tracking-wider font-semibold hover:bg-background hover:text-foreground transition-colors"
            onClick={handleHome}
          >
            Home
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 uppercase tracking-wider">
          SM-2 Algorithm Applied
        </p>
      </main>
    </div>
  );
}
