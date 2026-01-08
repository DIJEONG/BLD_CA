'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { allWordSets } from '@/data/words';
import { Word } from '@/types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTodayString, getDateInTimezone, DEFAULT_TIMEZONE } from '@/lib/date';

export default function LearningCalendar() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getMonthlyStats = useStore((state) => state.getMonthlyStats);
  const getReviewCountByDate = useStore((state) => state.getReviewCountByDate);
  const getReviewWordIdsByDate = useStore((state) => state.getReviewWordIdsByDate);
  const wordProgress = useStore((state) => state.wordProgress);
  const sessions = useStore((state) => state.sessions);
  const customWordSets = useStore((state) => state.customWordSets);
  const profile = useStore((state) => state.profile);
  const dailyGoal = profile?.dailyWordCount || 20;
  const timezone = profile?.timezone || DEFAULT_TIMEZONE;

  // 클라이언트에서만 날짜 설정 (타임존 기반)
  useEffect(() => {
    const todayStr = getTodayString(timezone);
    const todayDate = getDateInTimezone(timezone);

    setToday(todayStr);
    setCurrentDate(todayDate);
  }, [timezone]);

  const year = currentDate?.getFullYear() ?? new Date().getFullYear();
  const month = currentDate ? currentDate.getMonth() + 1 : new Date().getMonth() + 1;

  const monthlyStats = useMemo(() => {
    return getMonthlyStats(year, month);
  }, [getMonthlyStats, year, month]);

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{ date: number | null; dateStr: string; wordsStudied: number; reviewCount: number }> = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dateStr: '', wordsStudied: 0, reviewCount: 0 });
    }

    // 현재 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = monthlyStats[dateStr];
      const reviewCount = getReviewCountByDate(dateStr);
      days.push({
        date: day,
        dateStr,
        wordsStudied: stats?.wordsStudied || 0,
        reviewCount,
      });
    }

    return days;
  }, [year, month, monthlyStats, getReviewCountByDate]);

  // 선택된 날짜의 타입 (past: 학습 기록, review: 복습 예정)
  const selectedDateType = useMemo(() => {
    if (!selectedDate || !today) return null;
    if (selectedDate < today) return 'past';
    return 'review'; // 오늘 또는 미래
  }, [selectedDate, today]);

  // 선택된 날짜의 학습 단어 목록 (과거)
  const selectedDateStudiedWords = useMemo(() => {
    if (!selectedDate || selectedDateType !== 'past') return [];

    const dateSessions = sessions.filter(s => s.date === selectedDate);
    if (dateSessions.length === 0) return [];

    const wordIds = new Set<string>();
    const wordResults: { wordId: string; knew: boolean }[] = [];

    dateSessions.forEach(session => {
      session.answers.forEach(answer => {
        if (!wordIds.has(answer.wordId)) {
          wordIds.add(answer.wordId);
          wordResults.push({ wordId: answer.wordId, knew: answer.knew });
        }
      });
    });

    const allWords = [
      ...allWordSets.flatMap(ws => ws.words),
      ...customWordSets.flatMap(ws => ws.words),
    ];

    const wordMap = new Map<string, Word>();
    allWords.forEach(w => wordMap.set(w.id, w));

    return wordResults.map(result => ({
      word: wordMap.get(result.wordId),
      knew: result.knew,
    })).filter(item => item.word !== undefined) as { word: Word; knew: boolean }[];
  }, [selectedDate, selectedDateType, sessions, customWordSets]);

  // 선택된 날짜의 복습 예정 단어 목록 (오늘/미래)
  const selectedDateReviewWords = useMemo(() => {
    if (!selectedDate || selectedDateType !== 'review') return [];

    const reviewWordIds = getReviewWordIdsByDate(selectedDate);
    if (reviewWordIds.length === 0) return [];

    const allWords = [
      ...allWordSets.flatMap(ws => ws.words),
      ...customWordSets.flatMap(ws => ws.words),
    ];

    const wordMap = new Map<string, Word>();
    allWords.forEach(w => wordMap.set(w.id, w));

    return reviewWordIds.map(wordId => {
      const word = wordMap.get(wordId);
      const progress = wordProgress[wordId];
      return {
        word,
        interval: progress?.interval || 1,
        box: progress?.box || 1,
        attemptCount: progress?.attemptCount || 0,
        correctCount: progress?.correctCount || 0,
      };
    }).filter(item => item.word !== undefined) as {
      word: Word;
      interval: number;
      box: number;
      attemptCount: number;
      correctCount: number;
    }[];
  }, [selectedDate, selectedDateType, getReviewWordIdsByDate, customWordSets, wordProgress]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDateClick = (dateStr: string, hasActivity: boolean, hasReview: boolean) => {
    if (hasActivity || hasReview) {
      setSelectedDate(selectedDate === dateStr ? null : dateStr);
    }
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // 이번 달 총 학습 단어 수
  const totalWordsThisMonth = Object.values(monthlyStats).reduce(
    (sum, stat) => sum + stat.wordsStudied,
    0
  );

  // 학습한 날 수
  const studiedDays = Object.values(monthlyStats).filter(
    (stat) => stat.wordsStudied > 0
  ).length;

  // 클라이언트 마운트 전에는 로딩 표시
  if (!currentDate || !today) {
    return (
      <div className="border-2 border-foreground p-8 text-center">
        <p className="text-muted-foreground text-sm">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground">
      {/* 헤더 */}
      <div className="border-b border-foreground px-4 py-2 flex justify-between items-center">
        <span className="text-sm uppercase tracking-wider">Monthly Calendar</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--accent-teal)' }}>
            {studiedDays}일 학습 · {totalWordsThisMonth}단어
          </span>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="border-b border-foreground px-4 py-3 flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="tag hover:bg-foreground hover:text-background transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-serif font-bold text-lg">
          {year}년 {monthNames[month - 1]}
        </span>
        <button
          onClick={handleNextMonth}
          className="tag hover:bg-foreground hover:text-background transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-foreground">
        {dayNames.map((day, i) => (
          <div
            key={i}
            className={`py-2 text-center text-xs font-mono uppercase ${
              i < 6 ? 'border-r border-foreground' : ''
            } ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7">
        {calendarData.map((day, index) => {
          const isToday = day.dateStr === today;
          const isFuture = today && day.dateStr > today;
          const hasActivity = day.wordsStudied > 0;
          const hasReview = day.reviewCount > 0;
          const achievedGoal = day.wordsStudied >= dailyGoal;
          const isSunday = index % 7 === 0;
          const isSaturday = index % 7 === 6;
          const isSelected = day.dateStr === selectedDate;

          // 배경색 결정
          let bgStyle = {};
          if (hasActivity && achievedGoal) {
            bgStyle = { backgroundColor: 'var(--accent-teal-light)' };
          } else if (isFuture && hasReview) {
            bgStyle = { backgroundColor: 'var(--accent-amber-light)' };
          }

          const isClickable = hasActivity || hasReview;

          return (
            <div
              key={index}
              className={`
                relative min-h-[48px] sm:min-h-[56px] p-1 sm:p-2
                ${index % 7 !== 6 ? 'border-r border-foreground' : ''}
                ${index < calendarData.length - 7 || (index >= calendarData.length - 7 && Math.floor(index / 7) < Math.floor((calendarData.length - 1) / 7)) ? 'border-b border-foreground' : ''}
                ${isToday ? 'bg-secondary' : ''}
                ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
                ${isSelected ? 'ring-2 ring-inset ring-foreground' : ''}
              `}
              style={bgStyle}
              onClick={() => day.date && handleDateClick(day.dateStr, hasActivity, hasReview)}
            >
              {day.date && (
                <>
                  {/* 날짜 */}
                  <span
                    className={`
                      text-xs sm:text-sm font-mono
                      ${isToday ? 'font-bold' : ''}
                      ${isSunday ? 'text-red-400' : isSaturday ? 'text-blue-400' : ''}
                    `}
                    style={isToday ? { color: 'var(--accent-teal)' } : {}}
                  >
                    {day.date}
                  </span>

                  {/* 미래 복습 예정 (좌하단) */}
                  {isFuture && hasReview && (
                    <div
                      className="absolute bottom-1 left-1 text-[10px] sm:text-xs font-mono font-bold"
                      style={{ color: 'var(--accent-amber)' }}
                    >
                      ●{day.reviewCount}
                    </div>
                  )}

                  {/* 오늘 복습 예정 (좌하단) */}
                  {isToday && hasReview && (
                    <div
                      className="absolute bottom-1 left-1 text-[10px] sm:text-xs font-mono font-bold"
                      style={{ color: 'var(--accent-error)' }}
                    >
                      ●{day.reviewCount}
                    </div>
                  )}

                  {/* 학습 완료 단어 수 (우하단) */}
                  {hasActivity && (
                    <div
                      className="absolute bottom-1 right-1 text-[10px] sm:text-xs font-mono font-bold"
                      style={{ color: achievedGoal ? 'var(--accent-teal-dark)' : 'var(--accent-amber)' }}
                    >
                      {day.wordsStudied}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜의 학습 기록 (과거) */}
      {selectedDate && selectedDateType === 'past' && selectedDateStudiedWords.length > 0 && (
        <div className="border-t-2 border-foreground">
          <div className="border-b border-foreground px-4 py-2 flex justify-between items-center bg-secondary">
            <span className="text-sm font-semibold">
              {selectedDate} 학습 기록 ({selectedDateStudiedWords.length}개)
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              닫기 <X size={12} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {selectedDateStudiedWords.map(({ word, knew }, index) => (
              <div
                key={word.id}
                className={`flex items-center justify-between px-4 py-2 ${
                  index > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{word.english}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  <span className="text-muted-foreground text-sm">{word.korean}</span>
                </div>
                <span
                  className="text-xs font-mono ml-2"
                  style={{ color: knew ? 'var(--accent-success)' : 'var(--accent-error)' }}
                >
                  {knew ? '○' : '✕'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선택된 날짜의 복습 예정 (오늘/미래) */}
      {selectedDate && selectedDateType === 'review' && selectedDateReviewWords.length > 0 && (
        <div className="border-t-2 border-foreground">
          <div
            className="border-b border-foreground px-4 py-2 flex justify-between items-center"
            style={{ backgroundColor: 'var(--accent-amber-light)' }}
          >
            <span className="text-sm font-semibold">
              {selectedDate === today ? '오늘' : selectedDate} 복습 예정 ({selectedDateReviewWords.length}개)
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              닫기 <X size={12} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {selectedDateReviewWords.map(({ word, interval, box, attemptCount, correctCount }, index) => {
              const accuracy = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;
              return (
                <div
                  key={word.id}
                  className={`flex items-center justify-between px-4 py-2 ${
                    index > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{word.english}</span>
                    <span className="text-muted-foreground mx-2">—</span>
                    <span className="text-muted-foreground text-sm">{word.korean}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {accuracy}%
                    </span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: box >= 4 ? 'var(--accent-teal-light)' : box >= 2 ? 'var(--accent-amber-light)' : 'var(--accent-error-light)',
                        color: box >= 4 ? 'var(--accent-teal-dark)' : box >= 2 ? 'var(--accent-amber)' : 'var(--accent-error)',
                      }}
                    >
                      Lv.{box}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="border-t border-foreground px-4 py-2 flex flex-wrap justify-end gap-3 sm:gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>●5</span>
          <span className="text-muted-foreground">복습 예정</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 border border-foreground"
            style={{ backgroundColor: 'var(--accent-teal-light)' }}
          />
          <span className="text-muted-foreground">목표 달성</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>15</span>
          <span className="text-muted-foreground">학습 완료</span>
        </div>
      </div>
    </div>
  );
}
