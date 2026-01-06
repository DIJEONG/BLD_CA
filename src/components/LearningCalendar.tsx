'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';

export default function LearningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const getMonthlyStats = useStore((state) => state.getMonthlyStats);
  const profile = useStore((state) => state.profile);
  const dailyGoal = profile?.dailyWordCount || 20;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const monthlyStats = useMemo(() => {
    return getMonthlyStats(year, month);
  }, [getMonthlyStats, year, month]);

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{ date: number | null; dateStr: string; wordsStudied: number }> = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dateStr: '', wordsStudied: 0 });
    }

    // 현재 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = monthlyStats[dateStr];
      days.push({
        date: day,
        dateStr,
        wordsStudied: stats?.wordsStudied || 0,
      });
    }

    return days;
  }, [year, month, monthlyStats]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const today = new Date().toISOString().split('T')[0];
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

  return (
    <div className="border-2 border-black">
      {/* 헤더 */}
      <div className="border-b border-black px-4 py-2 flex justify-between items-center">
        <span className="text-sm uppercase tracking-wider">Monthly Calendar</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--accent-teal)' }}>
            {studiedDays}일 학습 · {totalWordsThisMonth}단어
          </span>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="border-b border-black px-4 py-3 flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="tag hover:bg-black hover:text-white transition-colors"
        >
          ←
        </button>
        <span className="font-serif font-bold text-lg">
          {year}년 {monthNames[month - 1]}
        </span>
        <button
          onClick={handleNextMonth}
          className="tag hover:bg-black hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-black">
        {dayNames.map((day, i) => (
          <div
            key={i}
            className={`py-2 text-center text-xs font-mono uppercase ${
              i < 6 ? 'border-r border-black' : ''
            } ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7">
        {calendarData.map((day, index) => {
          const isToday = day.dateStr === today;
          const hasActivity = day.wordsStudied > 0;
          const achievedGoal = day.wordsStudied >= dailyGoal;
          const isSunday = index % 7 === 0;
          const isSaturday = index % 7 === 6;

          return (
            <div
              key={index}
              className={`
                relative min-h-[48px] sm:min-h-[56px] p-1 sm:p-2
                ${index % 7 !== 6 ? 'border-r border-black' : ''}
                ${index < calendarData.length - 7 || (index >= calendarData.length - 7 && Math.floor(index / 7) < Math.floor((calendarData.length - 1) / 7)) ? 'border-b border-black' : ''}
                ${isToday ? 'bg-gray-100' : ''}
                ${hasActivity && achievedGoal ? '' : ''}
              `}
              style={hasActivity && achievedGoal ? { backgroundColor: 'var(--accent-teal-light)' } : {}}
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

                  {/* 학습 단어 수 */}
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

      {/* 범례 */}
      <div className="border-t border-black px-4 py-2 flex justify-end gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 border border-black"
            style={{ backgroundColor: 'var(--accent-teal-light)' }}
          />
          <span className="text-gray-500">목표 달성</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>15</span>
          <span className="text-gray-500">미달성</span>
        </div>
      </div>
    </div>
  );
}
