import { StudyPlanTemplate } from '@/types';
import { getWordSetsByGrade } from './words';

// 학습 플랜 템플릿 정의
export const studyPlanTemplates: StudyPlanTemplate[] = [
  // 초등 저학년 (grade-k2)
  {
    id: 'k2-30',
    name: '30일 기초',
    description: '매일 3개씩, 기초 영단어 마스터',
    totalDays: 30,
    totalWords: 90,
    gradeLevel: 'grade-k2',
    wordsPerDay: 3,
  },
  {
    id: 'k2-60',
    name: '60일 탄탄',
    description: '천천히 꾸준히, 탄탄한 기초',
    totalDays: 60,
    totalWords: 180,
    gradeLevel: 'grade-k2',
    wordsPerDay: 3,
    recommended: true,
  },

  // 초등 고학년 (grade-3-5)
  {
    id: '35-30',
    name: '30일 기초',
    description: '매일 5개씩, 빠르게 기초 완성',
    totalDays: 30,
    totalWords: 150,
    gradeLevel: 'grade-3-5',
    wordsPerDay: 5,
  },
  {
    id: '35-60',
    name: '60일 실력',
    description: '꾸준히 실력 쌓기',
    totalDays: 60,
    totalWords: 300,
    gradeLevel: 'grade-3-5',
    wordsPerDay: 5,
    recommended: true,
  },
  {
    id: '35-100',
    name: '100일 마스터',
    description: '초등 영단어 완전 정복',
    totalDays: 100,
    totalWords: 500,
    gradeLevel: 'grade-3-5',
    wordsPerDay: 5,
  },

  // 중학생 (grade-6-8)
  {
    id: '68-30',
    name: '30일 기초',
    description: '중학 필수 단어 빠르게',
    totalDays: 30,
    totalWords: 150,
    gradeLevel: 'grade-6-8',
    wordsPerDay: 5,
  },
  {
    id: '68-60',
    name: '60일 실력',
    description: '내신 대비 핵심 단어',
    totalDays: 60,
    totalWords: 300,
    gradeLevel: 'grade-6-8',
    wordsPerDay: 5,
    recommended: true,
  },
  {
    id: '68-100',
    name: '100일 마스터',
    description: '중학 영단어 완전 정복',
    totalDays: 100,
    totalWords: 400,
    gradeLevel: 'grade-6-8',
    wordsPerDay: 4,
  },

  // 고등학생 (grade-9-12)
  {
    id: '912-30',
    name: '30일 수능 기초',
    description: '수능 필수 단어 시작',
    totalDays: 30,
    totalWords: 210,
    gradeLevel: 'grade-9-12',
    wordsPerDay: 7,
  },
  {
    id: '912-60',
    name: '60일 수능 완성',
    description: '수능 핵심 단어 마스터',
    totalDays: 60,
    totalWords: 400,
    gradeLevel: 'grade-9-12',
    wordsPerDay: 7,
    recommended: true,
  },

  // 성인 (adult) - grade-9-12 단어 사용
  {
    id: 'adult-30',
    name: '30일 비즈니스',
    description: '실무에 바로 쓰는 영단어',
    totalDays: 30,
    totalWords: 210,
    gradeLevel: 'adult',
    wordsPerDay: 7,
  },
  {
    id: 'adult-60',
    name: '60일 토익',
    description: '토익 빈출 단어 마스터',
    totalDays: 60,
    totalWords: 400,
    gradeLevel: 'adult',
    wordsPerDay: 7,
    recommended: true,
  },

  // CELPIP (캐나다 PR 준비)
  {
    id: 'celpip-30',
    name: '30일 CELPIP 기초',
    description: 'CLB 5 목표, 핵심 이민 영어',
    totalDays: 30,
    totalWords: 210,
    gradeLevel: 'celpip',
    wordsPerDay: 7,
  },
  {
    id: 'celpip-60',
    name: '60일 CELPIP 완성',
    description: 'CLB 7 목표, Express Entry 준비',
    totalDays: 60,
    totalWords: 420,
    gradeLevel: 'celpip',
    wordsPerDay: 7,
    recommended: true,
  },
  {
    id: 'celpip-90',
    name: '90일 CELPIP 마스터',
    description: 'CLB 9+ 목표, 고득점 달성',
    totalDays: 90,
    totalWords: 630,
    gradeLevel: 'celpip',
    wordsPerDay: 7,
  },
];

// 그레이드에 맞는 플랜 목록 가져오기
export function getPlansForGrade(gradeLevel: string): StudyPlanTemplate[] {
  return studyPlanTemplates.filter(plan => plan.gradeLevel === gradeLevel);
}

// 플랜 ID로 플랜 찾기
export function getPlanById(planId: string): StudyPlanTemplate | undefined {
  return studyPlanTemplates.find(plan => plan.id === planId);
}

// 플랜에 사용할 단어 목록 생성 (셔플된 단어 ID 배열)
export function generatePlanWords(planId: string): string[] {
  const plan = getPlanById(planId);
  if (!plan) return [];

  // 성인은 grade-9-12 단어 사용
  const gradeForWords = plan.gradeLevel === 'adult' ? 'grade-9-12' : plan.gradeLevel;
  const wordSets = getWordSetsByGrade(gradeForWords);

  // 모든 단어 수집
  const allWords = wordSets.flatMap(ws => ws.words);

  // 셔플
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);

  // 필요한 만큼만 선택
  const selected = shuffled.slice(0, plan.totalWords);

  return selected.map(w => w.id);
}

// 그레이드 레이블 변환
export function getGradeLevelLabel(gradeLevel: string): string {
  const labels: Record<string, string> = {
    'grade-k2': '초등 저학년',
    'grade-3-5': '초등 고학년',
    'grade-6-8': '중학생',
    'grade-9-12': '고등학생',
    'adult': '성인',
    'celpip': 'CELPIP (캐나다 PR)',
  };
  return labels[gradeLevel] || gradeLevel;
}
