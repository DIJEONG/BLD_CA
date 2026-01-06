// 브라우저 로컬 시간 기준 날짜 유틸리티

// 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD)
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 로컬 시간 기준 현재 Date 객체
export function getCanadaDate(): Date {
  return new Date();
}

// 날짜 차이 계산 (일 단위)
export function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
