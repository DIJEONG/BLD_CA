'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { allWordSets, getWordSetsByGrade } from '@/data/words';
import {
  Sun,
  Moon,
  RefreshCw,
  BookOpen,
  Zap,
  Target,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import LearningPage from './learning/LearningPage';
import WordSetEditor from './custom/WordSetEditor';
import LearningCalendar from './LearningCalendar';
import GuidePage from './GuidePage';
import StudyPlanSelector from './StudyPlanSelector';
import { exportDataToJSON, importDataFromJSON } from '@/lib/dataExport';
import { getTodayString, getKoreanDateString, getDayOfWeek, DEFAULT_TIMEZONE } from '@/lib/date';
import { getPlanById } from '@/data/studyPlans';
import { Word, TimezoneOption, TIMEZONE_LABELS } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export default function Dashboard() {
  const [isLearning, setIsLearning] = useState(false);
  const [selectedWordSetId, setSelectedWordSetId] = useState<string | null>(null);
  const [isPlanMode, setIsPlanMode] = useState(false);
  const [customWords, setCustomWords] = useState<Word[] | null>(null);
  const [modeName, setModeName] = useState<string | null>(null);
  const [editingWordSetId, setEditingWordSetId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isCreatingWordSet, setIsCreatingWordSet] = useState(false);
  const [newWordSetName, setNewWordSetName] = useState('');
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [todayString, setTodayString] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [isOtherWordSetsOpen, setIsOtherWordSetsOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const profile = useStore((state) => state.profile);
  const timezone = profile?.timezone || DEFAULT_TIMEZONE;
  const currentStreak = useStore((state) => state.currentStreak);

  // 클라이언트에서만 날짜 설정 (타임존 기반)
  useEffect(() => {
    setTodayString(getTodayString(timezone));
    setDateStr(getKoreanDateString(timezone));
  }, [timezone]);
  const getTodayStats = useStore((state) => state.getTodayStats);
  const getWeeklyStats = useStore((state) => state.getWeeklyStats);
  const resetAll = useStore((state) => state.resetAll);
  const getCustomWordSets = useStore((state) => state.getCustomWordSets);
  const addCustomWordSet = useStore((state) => state.addCustomWordSet);
  const getReviewCount = useStore((state) => state.getReviewCount);
  const getWordsForReview = useStore((state) => state.getWordsForReview);
  const getFullState = useStore((state) => state.getFullState);
  const importData = useStore((state) => state.importData);
  const updateProfile = useStore((state) => state.updateProfile);
  const activeStudyPlan = useStore((state) => state.activeStudyPlan);
  const getPlanProgress = useStore((state) => state.getPlanProgress);
  const getTodayPlanWords = useStore((state) => state.getTodayPlanWords);
  const cancelStudyPlan = useStore((state) => state.cancelStudyPlan);

  const customWordSets = getCustomWordSets();
  const reviewCount = getReviewCount();

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const dailyGoal = profile?.dailyWordCount || 20;
  const todayProgress = todayStats ? Math.min((todayStats.wordsStudied / dailyGoal) * 100, 100) : 0;

  const recommendedWordSets = profile ? getWordSetsByGrade(profile.gradeLevel) : allWordSets;

  const handleStartLearning = (wordSetId: string, filterWords?: Word[]) => {
    setSelectedWordSetId(wordSetId);
    setCustomWords(filterWords || null);
    setIsLearning(true);
  };

  const handleFinishLearning = () => {
    setIsLearning(false);
    setSelectedWordSetId(null);
    setIsPlanMode(false);
    setCustomWords(null);
    setModeName(null);
  };

  // SM-2 기반 오늘의 복습 시작
  const handleStartReview = () => {
    const reviewProgress = getWordsForReview();
    const reviewWordIds = reviewProgress.map(p => p.wordId);

    // 모든 단어장에서 복습할 단어 찾기
    const allWords = [
      ...allWordSets.flatMap(ws => ws.words),
      ...customWordSets.flatMap(ws => ws.words),
    ];
    const reviewWords = allWords.filter(w => reviewWordIds.includes(w.id));

    if (reviewWords.length > 0) {
      setCustomWords(reviewWords);
      setSelectedWordSetId('review');
      setModeName('오늘의 복습');
      setIsLearning(true);
    }
  };

  const handleStartPlanLearning = () => {
    const todayWords = getTodayPlanWords();
    if (todayWords.length === 0) return;
    setIsPlanMode(true);
    setCustomWords(todayWords);
    setSelectedWordSetId('plan-words');
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
    const planNameStr = isPlanMode && activeStudyPlan ? getPlanById(activeStudyPlan.planId)?.name : undefined;
    const displayModeName = modeName || (planNameStr ? `플랜: ${planNameStr}` : undefined);
    return (
      <LearningPage
        wordSetId={selectedWordSetId}
        onFinish={handleFinishLearning}
        customWords={customWords || undefined}
        modeName={displayModeName}
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

  // 가이드 화면
  if (showGuide) {
    return <GuidePage onBack={() => setShowGuide(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b-2 border-foreground">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">VOCAB</h1>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {dateStr}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="tag hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                onClick={toggleTheme}
                title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="tag-teal hover:opacity-80 transition-opacity"
                onClick={() => setShowGuide(true)}
              >
                GUIDE
              </button>
              <button
                className="tag hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ═══════════════════════════════════════════════════════════════
            TODAY ZONE - 오늘의 미션
        ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          {/* 헤더 */}
          <div className="border-b border-foreground pb-4 mb-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">
              Today's Mission
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              {profile?.nickname}님, 오늘의 미션
            </h2>
          </div>

          {/* 미션 카드들 */}
          <div className="space-y-3">
            {/* 1. 오늘의 복습 (SM-2 기반) */}
            {reviewCount > 0 && (
              <div
                className="border-2 p-4 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ borderColor: 'var(--accent-teal)', backgroundColor: 'var(--accent-teal-light)' }}
                onClick={handleStartReview}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={28} style={{ color: 'var(--accent-teal)' }} />
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--accent-teal-dark)' }}>
                        오늘의 복습 {reviewCount}개
                      </p>
                      <p className="text-sm text-muted-foreground">
                        SM-2 알고리즘 기반 최적 타이밍
                      </p>
                    </div>
                  </div>
                  <span className="tag-teal">시작 →</span>
                </div>
              </div>
            )}

            {/* 2. 플랜 학습 또는 추천 학습 */}
            {activeStudyPlan ? (
              (() => {
                const progress = getPlanProgress();
                const plan = getPlanById(activeStudyPlan.planId);
                const todayWords = getTodayPlanWords();
                if (!progress || !plan) return null;

                const isCompleted = progress.completedWords >= progress.totalWords;
                const todayDone = todayWords.length === 0 && !isCompleted;

                return (
                  <div className="border-2 border-foreground">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <BookOpen size={28} />
                          <div>
                            <p className="font-semibold">{plan.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Day {progress.currentDay}/{progress.totalDays} · {progress.completedWords}/{progress.totalWords} 단어
                            </p>
                          </div>
                        </div>
                        {!isCompleted && todayWords.length > 0 && (
                          <button
                            className="tag-teal hover:opacity-80 transition-opacity"
                            onClick={handleStartPlanLearning}
                          >
                            {todayWords.length}단어 학습 →
                          </button>
                        )}
                        {isCompleted && (
                          <span className="tag-teal">완료!</span>
                        )}
                        {todayDone && (
                          <span className="tag">오늘 완료</span>
                        )}
                      </div>
                      {/* 플랜 진행률 */}
                      <div className="progress-editorial">
                        <div
                          className="progress-editorial-bar"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => {
                            if (confirm('플랜을 취소하시겠습니까?')) {
                              cancelStudyPlan();
                            }
                          }}
                        >
                          플랜 취소
                        </button>
                        <span className="text-xs text-muted-foreground font-mono">
                          {Math.round(progress.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="border-2 border-foreground p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target size={28} />
                    <div>
                      <p className="font-semibold">학습 플랜 시작하기</p>
                      <p className="text-sm text-muted-foreground">
                        체계적인 학습을 위한 플랜을 선택하세요
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <StudyPlanSelector onPlanStart={() => {}} />
                </div>
              </div>
            )}

            {/* 3. 빠른 학습 (플랜 없을 때만 or 플랜 완료 후) */}
            {recommendedWordSets.length > 0 && (
              <div
                className="border-2 border-foreground p-4 cursor-pointer hover:bg-foreground hover:text-background transition-colors group"
                onClick={() => handleStartLearning(recommendedWordSets[0].id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap size={28} />
                    <div>
                      <p className="font-semibold">빠른 학습</p>
                      <p className="text-sm text-muted-foreground group-hover:text-gray-300">
                        {recommendedWordSets[0].name} ({recommendedWordSets[0].words.length}단어)
                      </p>
                    </div>
                  </div>
                  <span className="tag group-hover:bg-background group-hover:text-foreground">시작 →</span>
                </div>
              </div>
            )}
          </div>

          {/* 오늘 통계 요약 */}
          <div className="mt-6 p-4 bg-secondary border border-foreground">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm uppercase tracking-wider">오늘 학습</span>
              <span className="font-mono font-bold" style={{ color: todayProgress >= 100 ? 'var(--accent-teal)' : undefined }}>
                {todayStats?.wordsStudied || 0}/{dailyGoal} 단어
              </span>
            </div>
            <div className="progress-editorial mb-2">
              <div
                className="progress-editorial-bar"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>정답 {todayStats?.correctCount || 0} · 오답 {todayStats?.wrongCount || 0}</span>
              <span>
                정답률 {todayStats && (todayStats.correctCount + todayStats.wrongCount) > 0
                  ? Math.round((todayStats.correctCount / (todayStats.correctCount + todayStats.wrongCount)) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PROGRESS ZONE - 나의 성장
        ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          <div className="border-b border-foreground pb-4 mb-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">
              My Progress
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">나의 성장</h2>
              {currentStreak > 0 && (
                <span className="tag-teal">{currentStreak}일 연속</span>
              )}
            </div>
          </div>

          {/* 주간 활동 차트 */}
          <div className="border-2 border-foreground mb-4">
            <div className="border-b border-foreground px-4 py-2">
              <span className="text-sm uppercase tracking-wider">Weekly Activity</span>
            </div>
            {(() => {
              const totalWeeklyWords = weeklyStats.reduce((sum, s) => sum + s.wordsStudied, 0);
              const hasAnyActivity = totalWeeklyWords > 0;

              return (
                <div className="relative">
                  {!hasAnyActivity && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
                      <div className="text-center px-4">
                        <p className="font-serif text-lg font-bold mb-1">
                          첫 학습을 시작해보세요
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
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
                      const dayIndex = getDayOfWeek(stat.date);
                      const day = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIndex];
                      const isToday = stat.date === todayString;

                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-end p-1 sm:p-2 ${
                            i < 6 ? 'border-r border-foreground' : ''
                          }`}
                        >
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
                            className={`text-[10px] sm:text-xs mt-1 font-mono ${isToday ? 'font-bold' : 'text-muted-foreground'}`}
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

          {/* 월별 달력 (접힘/펼침) */}
          <div className="border-2 border-foreground">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary transition-colors"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
              <span className="text-sm uppercase tracking-wider">Monthly Calendar</span>
              {isCalendarOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {isCalendarOpen && (
              <div className="border-t border-foreground">
                <LearningCalendar />
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            LIBRARY ZONE - 단어장
        ═══════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          <div className="border-b border-foreground pb-4 mb-6">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">
              Word Library
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">단어장</h2>
          </div>

          {/* 추천 단어장 */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              추천 단어장
            </p>
            <div className="space-y-0">
              {recommendedWordSets.map((wordSet, index) => (
                <div
                  key={wordSet.id}
                  className={`flex justify-between items-center p-4 border-2 border-foreground ${
                    index > 0 ? 'border-t-0' : ''
                  } hover:bg-foreground hover:text-background transition-colors cursor-pointer group`}
                  onClick={() => handleStartLearning(wordSet.id)}
                >
                  <div>
                    <h4 className="font-semibold">{wordSet.name}</h4>
                    <p className="text-sm text-muted-foreground group-hover:text-gray-300 dark:group-hover:text-gray-600 font-mono">
                      {wordSet.words.length} WORDS
                    </p>
                  </div>
                  <span className="tag group-hover:bg-background group-hover:text-foreground">
                    START →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 다른 단어장 (접힘/펼침) */}
          {recommendedWordSets.length < allWordSets.length && (
            <div className="mb-6">
              <button
                className="w-full py-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                onClick={() => setIsOtherWordSetsOpen(!isOtherWordSetsOpen)}
              >
                다른 단어장 보기 ({allWordSets.length - recommendedWordSets.length}개)
                {isOtherWordSetsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isOtherWordSetsOpen && (
                <div className="mt-3 space-y-0">
                  {allWordSets
                    .filter((ws) => !recommendedWordSets.includes(ws))
                    .map((wordSet, index) => (
                      <div
                        key={wordSet.id}
                        className={`flex justify-between items-center p-4 border border-foreground ${
                          index > 0 ? 'border-t-0' : ''
                        } hover:bg-foreground hover:text-background transition-colors cursor-pointer group opacity-70 hover:opacity-100`}
                        onClick={() => handleStartLearning(wordSet.id)}
                      >
                        <div>
                          <h4 className="font-semibold">{wordSet.name}</h4>
                          <p className="text-sm text-muted-foreground group-hover:text-gray-300 dark:group-hover:text-gray-600 font-mono">
                            {wordSet.words.length} WORDS
                          </p>
                        </div>
                        <span className="tag group-hover:bg-background group-hover:text-foreground">
                          START →
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 내 단어장 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                내 단어장
              </p>
              {!isCreatingWordSet && (
                <button
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsCreatingWordSet(true)}
                >
                  + NEW
                </button>
              )}
            </div>

            {isCreatingWordSet && (
              <div className="border-2 border-foreground p-4 mb-3">
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
                    className="flex-1 border-2 border-foreground"
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

            {customWordSets.length === 0 && !isCreatingWordSet ? (
              <div className="border-2 border-dashed border-foreground p-6 text-center">
                <p className="text-muted-foreground mb-2">아직 내 단어장이 없습니다</p>
                <button
                  className="tag hover:bg-foreground hover:text-background transition-colors"
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
                    className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 border-2 border-foreground ${
                      index > 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <div className="mb-2 sm:mb-0">
                      <h4 className="font-semibold">{wordSet.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {wordSet.words.length} WORDS
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="tag hover:bg-foreground hover:text-background transition-colors"
                        onClick={() => handleEditWordSet(wordSet.id)}
                      >
                        EDIT
                      </button>
                      {wordSet.words.length > 0 && (
                        <button
                          className="tag-filled hover:bg-background hover:text-foreground transition-colors"
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
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            설정 (접힘)
        ═══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="border-2 border-foreground">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary transition-colors"
              onClick={() => setIsDataManagementOpen(!isDataManagementOpen)}
            >
              <span className="text-sm uppercase tracking-wider">설정 · 데이터 관리</span>
              {isDataManagementOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
            </button>
            {isDataManagementOpen && (
              <div className="border-t border-foreground">
                {/* 타임존 설정 */}
                <div className="px-4 py-3 border-b border-foreground">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">타임존</span>
                    <select
                      value={timezone}
                      onChange={(e) => updateProfile({ timezone: e.target.value as TimezoneOption })}
                      className="px-3 py-1 text-sm border-2 border-foreground bg-background cursor-pointer hover:bg-secondary transition-colors"
                    >
                      {(Object.keys(TIMEZONE_LABELS) as TimezoneOption[]).map((tz) => (
                        <option key={tz} value={tz}>
                          {TIMEZONE_LABELS[tz]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* 데이터 내보내기/가져오기 */}
                <div className="grid grid-cols-2 divide-x divide-foreground">
                  <button
                    className="py-4 tracking-wider text-sm hover:bg-foreground hover:text-background transition-colors"
                    onClick={handleExport}
                  >
                    내보내기
                  </button>
                  <button
                    className="py-4 tracking-wider text-sm hover:bg-foreground hover:text-background transition-colors"
                    onClick={handleImportClick}
                  >
                    가져오기
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t-2 border-foreground mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
            VOCAB — A Minimalist Vocabulary Learning App
          </p>
        </div>
      </footer>
    </div>
  );
}
