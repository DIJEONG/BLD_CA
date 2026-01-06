/**
 * SM-2 (SuperMemo 2) 알고리즘 구현
 *
 * Anki에서 사용하는 간격 반복 알고리즘의 원형
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

import { SM2Quality, Confidence } from '@/types';

// SM-2 계산 입력
interface SM2Input {
  quality: SM2Quality;          // 응답 품질 (0-5)
  easeFactor: number;           // 현재 난이도 계수
  interval: number;             // 현재 간격 (일)
  repetitionCount: number;      // 연속 정답 횟수
}

// SM-2 계산 결과
interface SM2Output {
  easeFactor: number;           // 새 난이도 계수
  interval: number;             // 새 간격 (일)
  repetitionCount: number;      // 새 연속 정답 횟수
  nextReviewDate: string;       // 다음 복습일 (YYYY-MM-DD)
}

// SM-2 기본값
export const SM2_DEFAULTS = {
  EASE_FACTOR: 2.5,             // 초기 난이도 계수
  MIN_EASE_FACTOR: 1.3,         // 최소 난이도 계수
  FIRST_INTERVAL: 1,            // 첫 번째 간격 (일)
  SECOND_INTERVAL: 6,           // 두 번째 간격 (일)
} as const;

/**
 * 날짜에 일수를 더하여 YYYY-MM-DD 형식으로 반환
 */
function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

/**
 * SM-2 알고리즘 핵심 계산
 *
 * 공식:
 * EF' = max(1.3, EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)))
 *
 * 간격 계산:
 * - I(1) = 1일
 * - I(2) = 6일
 * - I(n) = I(n-1) × EF  (n >= 3)
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, easeFactor, interval, repetitionCount } = input;

  // 실패 (quality < 3): 처음부터 다시
  if (quality < 3) {
    return {
      easeFactor,  // EF는 유지 (Anki 방식)
      interval: SM2_DEFAULTS.FIRST_INTERVAL,
      repetitionCount: 0,
      nextReviewDate: addDays(new Date(), SM2_DEFAULTS.FIRST_INTERVAL),
    };
  }

  // 성공: Ease Factor 업데이트
  // EF' = max(1.3, EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)))
  const q = quality;
  const newEF = Math.max(
    SM2_DEFAULTS.MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // 간격 계산
  let newInterval: number;
  const newRepCount = repetitionCount + 1;

  if (newRepCount === 1) {
    newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
  } else if (newRepCount === 2) {
    newInterval = SM2_DEFAULTS.SECOND_INTERVAL;
  } else {
    // I(n) = I(n-1) × EF
    newInterval = Math.round(interval * newEF);
  }

  // 최소 1일 보장
  newInterval = Math.max(1, newInterval);

  return {
    easeFactor: Math.round(newEF * 100) / 100,  // 소수점 2자리
    interval: newInterval,
    repetitionCount: newRepCount,
    nextReviewDate: addDays(new Date(), newInterval),
  };
}

/**
 * UI 응답을 SM-2 품질 점수로 변환
 *
 * | UI 버튼 | SM-2 품질 | 의미 |
 * |--------|----------|------|
 * | 몰랐다  | 1        | 완전히 틀림, 기억 안 남 |
 * | 애매함  | 3        | 맞았지만 어려웠음 |
 * | 확실함  | 5        | 쉽게 맞춤 |
 */
export function mapResponseToQuality(
  knew: boolean,
  confidence?: Confidence
): SM2Quality {
  if (!knew) return 1;                    // 몰랐다 → 1
  if (confidence === 'unsure') return 3;  // 애매함 → 3
  return 5;                               // 확실함 → 5
}

/**
 * EF 값에 따른 Leitner Box 추정 (하위 호환)
 * 높은 EF = 쉬운 단어 = 높은 Box
 */
export function efToLeitnerBox(easeFactor: number, repetitionCount: number): 1 | 2 | 3 | 4 | 5 {
  if (repetitionCount === 0) return 1;
  if (repetitionCount === 1) return 2;
  if (easeFactor >= 2.5) return Math.min(5, repetitionCount + 1) as 1 | 2 | 3 | 4 | 5;
  if (easeFactor >= 2.0) return Math.min(4, repetitionCount) as 1 | 2 | 3 | 4 | 5;
  if (easeFactor >= 1.5) return Math.min(3, repetitionCount) as 1 | 2 | 3 | 4 | 5;
  return 2;
}
