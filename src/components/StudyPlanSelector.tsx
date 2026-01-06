'use client';

import { useStore } from '@/store/useStore';
import { getPlansForGrade, getGradeLevelLabel } from '@/data/studyPlans';
import { StudyPlanTemplate } from '@/types';

interface StudyPlanSelectorProps {
  onPlanStart?: () => void;
}

export default function StudyPlanSelector({ onPlanStart }: StudyPlanSelectorProps) {
  const profile = useStore((state) => state.profile);
  const startStudyPlan = useStore((state) => state.startStudyPlan);

  if (!profile) return null;

  const plans = getPlansForGrade(profile.gradeLevel);

  const handleStartPlan = (planId: string) => {
    startStudyPlan(planId);
    onPlanStart?.();
  };

  return (
    <div className="border-2 border-foreground">
      <div className="border-b border-foreground px-4 py-3 bg-secondary">
        <h3 className="font-serif font-bold">학습 플랜 선택</h3>
        <p className="text-xs text-muted-foreground mt-1">
          내 레벨: {getGradeLevelLabel(profile.gradeLevel)}
        </p>
      </div>

      <div className="divide-y divide-foreground">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onStart={handleStartPlan} />
        ))}
      </div>

      {plans.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          <p>해당 레벨의 플랜이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: StudyPlanTemplate;
  onStart: (planId: string) => void;
}

function PlanCard({ plan, onStart }: PlanCardProps) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{plan.name}</h4>
            {plan.recommended && (
              <span className="tag-teal text-[10px]">추천</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs font-mono text-muted-foreground">
            <span>{plan.totalDays}일</span>
            <span>·</span>
            <span>{plan.totalWords}단어</span>
            <span>·</span>
            <span>하루 {plan.wordsPerDay}개</span>
          </div>
        </div>
        <button
          className="tag hover:bg-foreground hover:text-background transition-colors shrink-0"
          onClick={() => onStart(plan.id)}
        >
          시작
        </button>
      </div>
    </div>
  );
}
