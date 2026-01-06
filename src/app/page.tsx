'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const isOnboarded = useStore((state) => state.isOnboarded);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 로컬 스토리지 hydration 대기
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return <Dashboard />;
}
