'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import GuidePage from './GuidePage';

const gradeLevels = [
  { value: 'grade-k2', label: 'K-2', description: 'Kindergarten - Grade 2' },
  { value: 'grade-3-5', label: '3-5', description: 'Grade 3 - 5' },
  { value: 'grade-6-8', label: '6-8', description: 'Grade 6 - 8' },
  { value: 'grade-9-12', label: '9-12', description: 'Grade 9 - 12' },
  { value: 'adult', label: 'Adult', description: 'College & Beyond' },
];

const dailyWordOptions = [10, 20, 30, 50];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [dailyWordCount, setDailyWordCount] = useState(20);
  const [showGuide, setShowGuide] = useState(false);
  const setProfile = useStore((state) => state.setProfile);

  const handleComplete = () => {
    setProfile({
      nickname,
      gradeLevel,
      dailyWordCount,
      createdAt: new Date().toISOString(),
    });
  };

  // 가이드 화면
  if (showGuide) {
    return <GuidePage onBack={() => setShowGuide(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">VOCAB</h1>
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Minimalist Vocabulary Learning
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="border-2 border-foreground">
          {/* 타이틀 영역 */}
          <div className="border-b-2 border-foreground px-6 py-4">
            <span className="tag">Step {step} / 3</span>
            <h2 className="text-xl font-serif font-bold mt-2">
              {step === 1 && '닉네임을 입력하세요'}
              {step === 2 && '학년을 선택하세요'}
              {step === 3 && '하루 학습 목표'}
            </h2>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="data-label block mb-2">Nickname</label>
                  <Input
                    placeholder="예: 영어마스터"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    className="border-2 border-foreground text-lg"
                  />
                </div>
                <button
                  className="w-full border-2 border-foreground bg-foreground text-background py-3 font-medium tracking-wide hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setStep(2)}
                  disabled={nickname.trim().length < 2}
                >
                  NEXT →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="data-label block mb-2">Grade Level</label>
                  <div className="space-y-0">
                    {gradeLevels.map((level, index) => (
                      <button
                        key={level.value}
                        className={`w-full p-3 border-2 border-foreground font-medium transition-colors text-left ${
                          index > 0 ? 'border-t-0' : ''
                        } ${
                          gradeLevel === level.value
                            ? 'bg-foreground text-background'
                            : 'bg-background text-foreground hover:bg-secondary'
                        }`}
                        onClick={() => setGradeLevel(level.value)}
                      >
                        <span className="font-bold font-mono">{level.label}</span>
                        <span className={`ml-2 text-sm ${gradeLevel === level.value ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {level.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-0">
                  <button
                    className="flex-1 border-2 border-foreground py-3 font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                    onClick={() => setStep(1)}
                  >
                    ← BACK
                  </button>
                  <button
                    className="flex-1 border-2 border-l-0 border-foreground bg-foreground text-background py-3 font-medium tracking-wide hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setStep(3)}
                    disabled={!gradeLevel}
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="data-label block mb-2">Daily Goal</label>
                  <div className="grid grid-cols-4 gap-0">
                    {dailyWordOptions.map((count, index) => (
                      <button
                        key={count}
                        className={`p-3 border-2 border-foreground font-mono font-bold transition-colors ${
                          index > 0 ? 'border-l-0' : ''
                        } ${
                          dailyWordCount === count
                            ? 'bg-foreground text-background'
                            : 'bg-background text-foreground hover:bg-secondary'
                        }`}
                        onClick={() => setDailyWordCount(count)}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-center mt-3 font-mono text-sm">
                    하루 <span className="font-bold">{dailyWordCount}</span>개 단어 학습
                  </p>
                </div>
                <div className="flex gap-0">
                  <button
                    className="flex-1 border-2 border-foreground py-3 font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                    onClick={() => setStep(2)}
                  >
                    ← BACK
                  </button>
                  <button
                    className="flex-1 border-2 border-l-0 border-foreground bg-foreground text-background py-3 font-medium tracking-wide hover:bg-background hover:text-foreground transition-colors"
                    onClick={handleComplete}
                  >
                    START →
                  </button>
                </div>
              </div>
            )}

            {/* 진행 표시 */}
            <div className="flex justify-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 ${s === step ? 'bg-foreground' : 'bg-muted'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-6">
          <button
            className="tag-teal hover:opacity-80 transition-opacity text-xs"
            onClick={() => setShowGuide(true)}
          >
            GUIDE
          </button>
          <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wider">
            A Minimalist Vocabulary Learning App
          </p>
        </div>
      </div>
    </div>
  );
}
