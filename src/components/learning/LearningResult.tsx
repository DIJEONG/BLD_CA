'use client';

import { useLearningStore } from '@/store/useLearningStore';
import { getWordSetById } from '@/data/words';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, Target, CheckCircle, XCircle, Home, RotateCcw } from 'lucide-react';

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

  // 틀린 단어 목록 (오답)
  const wrongAnswers = typingAnswers
    .filter((a) => !a.knew)
    .map((a) => {
      const word = words.find((w) => w.id === a.wordId);
      return { ...a, word };
    });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  const handleRetry = () => {
    // 같은 단어장으로 다시 시작
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
    if (accuracy === 100) return { emoji: '🎉', text: '완벽해요!' };
    if (accuracy >= 90) return { emoji: '🌟', text: '훌륭해요!' };
    if (accuracy >= 70) return { emoji: '👍', text: '잘했어요!' };
    if (accuracy >= 50) return { emoji: '💪', text: '조금만 더!' };
    return { emoji: '📚', text: '복습이 필요해요' };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 결과 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{message.emoji}</div>
          <h1 className="text-2xl font-bold mb-2">학습 완료!</h1>
          <p className="text-lg text-muted-foreground">{message.text}</p>
        </div>

        {/* 통계 카드 */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">정답률</span>
                </div>
                <div className="text-3xl font-bold">{accuracy}%</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-muted-foreground">소요 시간</span>
                </div>
                <div className="text-3xl font-bold">{formatTime(totalTime)}</div>
              </div>
            </div>

            <div className="border-t mt-6 pt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs">총 문제</span>
                </div>
                <div className="text-xl font-bold">{typingAnswers.length}개</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">정답</span>
                </div>
                <div className="text-xl font-bold text-green-600">{correctCount}개</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">오답</span>
                </div>
                <div className="text-xl font-bold text-red-500">{wrongCount}개</div>
              </div>
            </div>

            <div className="border-t mt-6 pt-4 text-center text-sm text-muted-foreground">
              단어당 평균 {avgTimePerWord}초
            </div>
          </CardContent>
        </Card>

        {/* 틀린 단어 */}
        {wrongAnswers.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                틀린 단어 ({wrongAnswers.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wrongAnswers.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-bold">{item.word?.english}</div>
                      <div className="text-sm text-muted-foreground">{item.word?.korean}</div>
                    </div>
                    <div className="text-sm text-red-500">
                      복습 필요
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={handleRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 학습
          </Button>
          <Button className="flex-1 h-12" onClick={handleHome}>
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </div>
      </main>
    </div>
  );
}
