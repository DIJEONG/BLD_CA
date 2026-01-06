// 캐나다 Eastern Time 기준 날짜 유틸리티
const CANADA_TIMEZONE = 'America/Toronto';

// 캐나다 시간대 기준 오늘 날짜 (YYYY-MM-DD)
export function getTodayString(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: CANADA_TIMEZONE,
  });
}

// 캐나다 시간대 기준 현재 Date 객체
export function getCanadaDate(): Date {
  const now = new Date();
  const canadaDateStr = now.toLocaleString('en-US', {
    timeZone: CANADA_TIMEZONE,
  });
  return new Date(canadaDateStr);
}

// 날짜 차이 계산 (일 단위)
export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
