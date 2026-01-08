// 타임존 기반 날짜 유틸리티
import { TimezoneOption } from '@/types';

// 기본 타임존 (캐나다 토론토)
export const DEFAULT_TIMEZONE: TimezoneOption = 'America/Toronto';

// 특정 타임존 기준 오늘 날짜 (YYYY-MM-DD)
export function getTodayString(timezone: TimezoneOption = DEFAULT_TIMEZONE): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: timezone });
}

// 특정 타임존 기준 현재 Date 객체 정보
export function getDateInTimezone(timezone: TimezoneOption = DEFAULT_TIMEZONE): Date {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// 하위 호환을 위한 getCanadaDate (deprecated)
export function getCanadaDate(): Date {
  return getDateInTimezone('America/Toronto');
}

// 날짜 차이 계산 (일 단위)
export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// 주간 날짜 배열 생성 (최근 7일)
export function getWeekDates(timezone: TimezoneOption = DEFAULT_TIMEZONE): string[] {
  const today = getDateInTimezone(timezone);
  const dates: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString('en-CA'));
  }

  return dates;
}

// 특정 날짜의 요일 인덱스 (0=일요일, 6=토요일)
export function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

// 한국어 형식 날짜 문자열 (예: 2024년 1월 7일 화요일)
export function getKoreanDateString(timezone: TimezoneOption = DEFAULT_TIMEZONE): string {
  const now = new Date();
  return now.toLocaleDateString('ko-KR', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
