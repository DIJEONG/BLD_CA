'use client';

import { useLearningStore } from '@/store/useLearningStore';

interface LearningResultProps {
  onFinish: () => void;
}

export default function LearningResult({ onFinish }: LearningResultProps) {
  const { words, typingAnswers, getElapsedTime, resetSession, startSession } = useLearningStore();

  const correctCount = typingAnswers.filter((a) => a.knew).length;
  const wrongCount = typingAnswers.filter((a) => !a.knew).length;
  const totalTime = getElapsedTime();
  const accuracy = typingAnswers.length > 0 ? Math.round((correctCount / typingAnswers.length) * 100) : 0;
  const avgTimePerWord = typingAnswers.length > 0 ? Math.round(totalTime / typingAnswers.length) : 0;

  // 틀린 단어 목록
  const wrongAnswers = typingAnswers
    .filter((a) => !a.knew)
    .map((a) => {
      const word = words.find((w) => w.id === a.wordId);
      return { ...a, word };
    });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b-2 border-black">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-sm uppercase tracking-wider text-center">Session Complete</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* 결과 헤더 */}
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-4">Result</p>
          <h1 className="text-5xl font-serif font-bold mb-4">{getMessage()}</h1>
          <p className="font-mono text-xl">{accuracy}%</p>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-4 gap-0 border-2 border-black mb-8">
          <div className="p-4 border-r border-black text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-mono font-bold">{typingAnswers.length}</p>
          </div>
          <div className="p-4 border-r border-black text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Correct</p>
            <p className="text-2xl font-mono font-bold">{correctCount}</p>
          </div>
          <div className="p-4 border-r border-black text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Wrong</p>
            <p className="text-2xl font-mono font-bold">{wrongCount}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Time</p>
            <p className="text-2xl font-mono font-bold">{formatTime(totalTime)}</p>
          </div>
        </div>

        {/* 추가 통계 */}
        <div className="border-2 border-black mb-8">
          <div className="grid grid-cols-2 divide-x divide-black">
            <div className="p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Accuracy</p>
              <p className="text-4xl font-mono font-bold">{accuracy}%</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Avg per Word</p>
              <p className="text-4xl font-mono font-bold">{avgTimePerWord}s</p>
            </div>
          </div>
        </div>

        {/* 틀린 단어 */}
        {wrongAnswers.length > 0 && (
          <div className="border-2 border-black mb-8">
            <div className="border-b border-black px-4 py-2">
              <span className="text-sm uppercase tracking-wider">
                Wrong Words ({wrongAnswers.length})
              </span>
            </div>
            <div className="max-h-[250px] overflow-y-auto">
              {wrongAnswers.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center px-4 py-3 ${
                    index > 0 ? 'border-t border-black' : ''
                  }`}
                >
                  <div>
                    <span className="font-semibold">{item.word?.english}</span>
                    <span className="text-gray-400 mx-2">—</span>
                    <span className="text-gray-600">{item.word?.korean}</span>
                  </div>
                  <span className="tag text-xs">REVIEW</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-0 border-2 border-black">
          <button
            className="py-4 border-r border-black uppercase tracking-wider font-semibold hover:bg-gray-100 transition-colors"
            onClick={handleRetry}
          >
            Retry
          </button>
          <button
            className="py-4 bg-black text-white uppercase tracking-wider font-semibold hover:bg-white hover:text-black transition-colors"
            onClick={handleHome}
          >
            Home
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 uppercase tracking-wider">
          Session completed successfully
        </p>
      </main>
    </div>
  );
}
