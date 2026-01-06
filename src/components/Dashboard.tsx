'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { allWordSets, getWordSetsByGrade } from '@/data/words';
import LearningPage from './learning/LearningPage';
import WordSetEditor from './custom/WordSetEditor';
import LearningCalendar from './LearningCalendar';
import { exportDataToJSON, importDataFromJSON } from '@/lib/dataExport';
import { getCanadaDate, getTodayString } from '@/lib/date';

export default function Dashboard() {
  const [isLearning, setIsLearning] = useState(false);
  const [selectedWordSetId, setSelectedWordSetId] = useState<string | null>(null);
  const [isWrongWordsMode, setIsWrongWordsMode] = useState(false);
  const [editingWordSetId, setEditingWordSetId] = useState<string | null>(null);
  const [isCreatingWordSet, setIsCreatingWordSet] = useState(false);
  const [newWordSetName, setNewWordSetName] = useState('');
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [todayString, setTodayString] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 클라이언트에서만 날짜 설정 (브라우저 로컬 시간 사용)
  useEffect(() => {
    const now = new Date();

    // 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setTodayString(`${year}-${month}-${day}`);

    // 한국어 형식 날짜
    setDateStr(now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }));
  }, []);

  const profile = useStore((state) => state.profile);
  const currentStreak = useStore((state) => state.currentStreak);
  const getTodayStats = useStore((state) => state.getTodayStats);
  const getWeeklyStats = useStore((state) => state.getWeeklyStats);
  const resetAll = useStore((state) => state.resetAll);
  const getCustomWordSets = useStore((state) => state.getCustomWordSets);
  const addCustomWordSet = useStore((state) => state.addCustomWordSet);
  const getWrongWordsCount = useStore((state) => state.getWrongWordsCount);
  const getFullState = useStore((state) => state.getFullState);
  const importData = useStore((state) => state.importData);

  const customWordSets = getCustomWordSets();
  const wrongWordsCount = getWrongWordsCount();

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const dailyGoal = profile?.dailyWordCount || 20;
  const todayProgress = todayStats ? Math.min((todayStats.wordsStudied / dailyGoal) * 100, 100) : 0;

  const recommendedWordSets = profile ? getWordSetsByGrade(profile.gradeLevel) : allWordSets;

  const handleStartLearning = (wordSetId: string) => {
    setSelectedWordSetId(wordSetId);
    setIsLearning(true);
  };

  const handleFinishLearning = () => {
    setIsLearning(false);
    setSelectedWordSetId(null);
    setIsWrongWordsMode(false);
  };

  const handleStartWrongWordsReview = () => {
    setIsWrongWordsMode(true);
    setSelectedWordSetId('wrong-words');
    setIsLearning(true);
  };

  const handleCreateWordSet = () => {
    if (!newWordSetName.trim()) return;
    const newSet = addCustomWordSet(newWordSetName.trim(), '');
    setNewWordSetName('');
    setIsCreatingWordSet(false);
    setEditingWordSetId(newSet.id);
  };

  const handleEditWordSet = (wordSetId: string) => {
    setEditingWordSetId(wordSetId);
  };

  const handleBackFromEditor = () => {
    setEditingWordSetId(null);
  };

  const handleExport = () => {
    const state = getFullState();
    exportDataToJSON(state);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importDataFromJSON(file);
      if (confirm('기존 데이터를 덮어쓰시겠습니까?')) {
        importData(data);
        alert('데이터를 성공적으로 가져왔습니다.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '파일을 가져올 수 없습니다.');
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 학습 화면
  if (isLearning && selectedWordSetId) {
    return (
      <LearningPage
        wordSetId={selectedWordSetId}
        onFinish={handleFinishLearning}
        wrongWordsMode={isWrongWordsMode}
      />
    );
  }

  // 단어장 편집 화면
  if (editingWordSetId) {
    return (
      <WordSetEditor
        wordSetId={editingWordSetId}
        onBack={handleBackFromEditor}
        onStartLearning={handleStartLearning}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">VOCAB</h1>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {dateStr}
              </p>
            </div>
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={() => {
                if (confirm('모든 데이터를 초기화할까요?')) {
                  resetAll();
                }
              }}
            >
              RESET
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="border-b border-black pb-6 mb-8">
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-2">
            Welcome back
          </p>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-4">
            {profile?.nickname}님, 오늘도 학습해볼까요?
          </h2>
          {currentStreak > 0 && (
            <span className="tag-teal">
              {currentStreak}일 연속 학습 중
            </span>
          )}
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-2 border-black mb-8">
          <div className="p-3 sm:p-4 border-r border-black border-b sm:border-b-0">
            <p className="data-label">오늘 학습</p>
            <p className="data-value font-mono">
              {todayStats?.wordsStudied || 0}/{dailyGoal}
            </p>
          </div>
          <div className="p-3 sm:p-4 sm:border-r border-black border-b sm:border-b-0">
            <p className="data-label">정답</p>
            <p className="data-value font-mono text-black">
              {todayStats?.correctCount || 0}
            </p>
          </div>
          <div className="p-3 sm:p-4 border-r border-black">
            <p className="data-label">오답</p>
            <p className="data-value font-mono">
              {todayStats?.wrongCount || 0}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <p className="data-label">정답률</p>
            <p className="data-value font-mono">
              {todayStats && (todayStats.correctCount + todayStats.wrongCount) > 0
                ? Math.round((todayStats.correctCount / (todayStats.correctCount + todayStats.wrongCount)) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm uppercase tracking-wider">Progress</span>
            <span className="font-mono text-sm">{Math.round(todayProgress)}%</span>
          </div>
          <div className="progress-editorial">
            <div
              className="progress-editorial-bar"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>

        {/* 오답 복습 섹션 */}
        {wrongWordsCount > 0 && (
          <div className="border-2 mb-8" style={{ borderColor: 'var(--accent-error)' }}>
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--accent-error)', backgroundColor: 'var(--accent-error-light)' }}>
              <span className="text-sm uppercase tracking-wider" style={{ color: 'var(--accent-error)' }}>틀린 단어 복습</span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-xl font-bold mb-1" style={{ color: 'var(--accent-error)' }}>
                    {wrongWordsCount}개 단어
                  </p>
                  <p className="text-sm text-gray-500">
                    틀린 단어를 집중적으로 복습해보세요
                  </p>
                </div>
                <button
                  className="tag-error hover:opacity-80 transition-opacity"
                  onClick={handleStartWrongWordsReview}
                >
                  오답 복습 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 주간 통계 */}
        <div className="border-2 border-black mb-8">
          <div className="border-b border-black px-4 py-2">
            <span className="text-sm uppercase tracking-wider">Weekly Activity</span>
          </div>
          {(() => {
            const totalWeeklyWords = weeklyStats.reduce((sum, s) => sum + s.wordsStudied, 0);
            const hasAnyActivity = totalWeeklyWords > 0;

            return (
              <div className="relative">
                {/* 활동 없을 때 동기부여 메시지 */}
                {!hasAnyActivity && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                    <div className="text-center px-4">
                      <p className="font-serif text-lg font-bold mb-1">
                        첫 학습을 시작해보세요
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Start your journey today
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-7 h-24 sm:h-28">
                  {weeklyStats.map((stat, i) => {
                    const height = stat.wordsStudied > 0
                      ? Math.max((stat.wordsStudied / dailyGoal) * 100, 10)
                      : 0;
                    const day = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(stat.date).getDay()];
                    const isToday = stat.date === todayString;

                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-end p-1 sm:p-2 ${
                          i < 6 ? 'border-r border-black' : ''
                        }`}
                      >
                        {/* 학습 기록 있으면 막대, 없으면 점선 */}
                        {stat.wordsStudied > 0 ? (
                          <div
                            className="w-full"
                            style={{
                              height: `${Math.min(height, 100)}%`,
                              backgroundColor: isToday ? 'var(--accent-teal)' : '#a3a3a3'
                            }}
                          />
                        ) : (
                          <div className="flex-1 flex items-end justify-center pb-1">
                            <div
                              className="w-1.5 h-1.5"
                              style={{
                                backgroundColor: isToday ? 'var(--accent-teal)' : 'transparent',
                                border: isToday ? 'none' : '1px solid #d4d4d4'
                              }}
                            />
                          </div>
                        )}
                        <span
                          className={`text-[10px] sm:text-xs mt-1 font-mono ${isToday ? 'font-bold' : 'text-gray-400'}`}
                          style={{ color: isToday ? 'var(--accent-teal)' : undefined }}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 월별 달력 */}
        <div className="mb-8">
          <LearningCalendar />
        </div>

        {/* 단어장 목록 */}
        <section className="mb-8">
          <h3 className="section-title">단어장</h3>
          <div className="space-y-0">
            {recommendedWordSets.map((wordSet, index) => (
              <div
                key={wordSet.id}
                className={`flex justify-between items-center p-4 border-2 border-black ${
                  index > 0 ? 'border-t-0' : ''
                } hover:bg-black hover:text-white transition-colors cursor-pointer group`}
                onClick={() => handleStartLearning(wordSet.id)}
              >
                <div>
                  <h4 className="font-semibold">{wordSet.name}</h4>
                  <p className="text-sm text-gray-500 group-hover:text-gray-300 font-mono">
                    {wordSet.words.length} WORDS
                  </p>
                </div>
                <span className="tag group-hover:bg-white group-hover:text-black">
                  START →
                </span>
              </div>
            ))}
          </div>

          {/* 다른 단어장 */}
          {recommendedWordSets.length < allWordSets.length && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                Other Collections
              </p>
              <div className="space-y-0">
                {allWordSets
                  .filter((ws) => !recommendedWordSets.includes(ws))
                  .map((wordSet, index) => (
                    <div
                      key={wordSet.id}
                      className={`flex justify-between items-center p-4 border border-black ${
                        index > 0 ? 'border-t-0' : ''
                      } hover:bg-black hover:text-white transition-colors cursor-pointer group opacity-60 hover:opacity-100`}
                      onClick={() => handleStartLearning(wordSet.id)}
                    >
                      <div>
                        <h4 className="font-semibold">{wordSet.name}</h4>
                        <p className="text-sm text-gray-500 group-hover:text-gray-300 font-mono">
                          {wordSet.words.length} WORDS
                        </p>
                      </div>
                      <span className="tag group-hover:bg-white group-hover:text-black">
                        START →
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* 커스텀 단어장 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-serif font-bold">내 단어장</h3>
            {!isCreatingWordSet && (
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={() => setIsCreatingWordSet(true)}
              >
                + NEW
              </button>
            )}
          </div>

          {/* 새 단어장 만들기 폼 */}
          {isCreatingWordSet && (
            <div className="border-2 border-black p-4 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="단어장 이름"
                  value={newWordSetName}
                  onChange={(e) => setNewWordSetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateWordSet();
                    if (e.key === 'Escape') {
                      setIsCreatingWordSet(false);
                      setNewWordSetName('');
                    }
                  }}
                  className="flex-1 border-2 border-black"
                  autoFocus
                />
                <Button
                  onClick={handleCreateWordSet}
                  disabled={!newWordSetName.trim()}
                  className="btn-editorial-filled"
                >
                  CREATE
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingWordSet(false);
                    setNewWordSetName('');
                  }}
                  className="btn-editorial"
                >
                  CANCEL
                </Button>
              </div>
            </div>
          )}

          {/* 커스텀 단어장 목록 */}
          {customWordSets.length === 0 && !isCreatingWordSet ? (
            <div className="border-2 border-dashed border-black p-8 text-center">
              <p className="text-gray-500 mb-2">아직 내 단어장이 없습니다</p>
              <p className="text-sm text-gray-400 mb-4">
                오늘 학습하고 싶은 단어를 직접 추가해보세요
              </p>
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={() => setIsCreatingWordSet(true)}
              >
                + 첫 단어장 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {customWordSets.map((wordSet, index) => (
                <div
                  key={wordSet.id}
                  className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 border-2 border-black ${
                    index > 0 ? 'border-t-0' : ''
                  }`}
                >
                  <div className="mb-2 sm:mb-0">
                    <h4 className="font-semibold">{wordSet.name}</h4>
                    <p className="text-sm text-gray-500 font-mono">
                      {wordSet.words.length} WORDS
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="tag hover:bg-black hover:text-white transition-colors"
                      onClick={() => handleEditWordSet(wordSet.id)}
                    >
                      EDIT
                    </button>
                    {wordSet.words.length > 0 && (
                      <button
                        className="tag-filled hover:bg-white hover:text-black transition-colors"
                        onClick={() => handleStartLearning(wordSet.id)}
                      >
                        START →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 데이터 관리 */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="border-2 border-black">
          <div className="border-b border-black px-4 py-2">
            <span className="text-sm uppercase tracking-wider">데이터 관리</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-black">
            <button
              className="py-4 tracking-wider text-sm hover:bg-black hover:text-white transition-colors"
              onClick={handleExport}
            >
              내보내기
            </button>
            <button
              className="py-4 tracking-wider text-sm hover:bg-black hover:text-white transition-colors"
              onClick={handleImportClick}
            >
              가져오기
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
      </section>

      {/* 푸터 */}
      <footer className="border-t-2 border-black mt-16">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-xs text-center text-gray-500 uppercase tracking-wider">
            VOCAB — A Minimalist Vocabulary Learning App
          </p>
        </div>
      </footer>
    </div>
  );
}
