'use client';

interface GuidePageProps {
  onBack: () => void;
}

export default function GuidePage({ onBack }: GuidePageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GUIDE</h1>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                학습 가이드 & 팁
              </p>
            </div>
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={onBack}
            >
              ← BACK
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 기본 사용법 */}
        <section className="mb-12">
          <h2 className="section-title">기본 사용법</h2>

          <div className="space-y-6">
            {/* 2단계 학습 */}
            <div className="border-2 border-black">
              <div className="border-b border-black px-4 py-2 bg-black text-white">
                <span className="text-sm uppercase tracking-wider font-bold">2단계 학습 시스템</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="tag-filled shrink-0">1</span>
                  <div>
                    <p className="font-semibold">플래시카드</p>
                    <p className="text-sm text-gray-600">
                      한글 뜻을 보고 영어 단어를 떠올려보세요. 카드를 터치하면 3D 플립으로 정답이 나타납니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="tag-filled shrink-0">2</span>
                  <div>
                    <p className="font-semibold">타이핑 테스트</p>
                    <p className="text-sm text-gray-600">
                      영어 단어를 직접 입력해서 철자까지 확실하게 익히세요. 힌트 기능도 활용할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 확신도 선택 */}
            <div className="border-2 border-black">
              <div className="border-b border-black px-4 py-2">
                <span className="text-sm uppercase tracking-wider font-bold">확신도 선택</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  플래시카드에서 정답을 맞췄을 때, 확신도를 선택하세요:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-black p-3">
                    <p className="font-semibold text-sm">확실히 알아요</p>
                    <p className="text-xs text-gray-500">복습 간격이 길어집니다</p>
                  </div>
                  <div className="border border-black p-3">
                    <p className="font-semibold text-sm">애매해요</p>
                    <p className="text-xs text-gray-500">더 자주 복습합니다</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 커스텀 단어장 */}
            <div className="border-2 border-black">
              <div className="border-b border-black px-4 py-2">
                <span className="text-sm uppercase tracking-wider font-bold">커스텀 단어장</span>
              </div>
              <div className="p-4 space-y-2 text-sm text-gray-600">
                <p>• 내 단어장에서 직접 단어를 추가할 수 있습니다</p>
                <p>• 영어만 입력하면 한글 뜻이 자동 번역됩니다</p>
                <p>• 추가된 날짜별로 단어가 그룹핑됩니다</p>
                <p>• 특정 날짜의 단어만 선택해서 학습할 수 있습니다</p>
              </div>
            </div>

            {/* 오답 복습 */}
            <div className="border-2 border-black">
              <div className="border-b border-black px-4 py-2">
                <span className="text-sm uppercase tracking-wider font-bold">오답 복습</span>
              </div>
              <div className="p-4 text-sm text-gray-600">
                <p>틀린 단어들은 자동으로 오답 목록에 저장됩니다. 대시보드에서 "오답 복습" 버튼을 눌러 틀린 단어들만 집중적으로 학습하세요.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 학습 팁 */}
        <section className="mb-12">
          <h2 className="section-title">효율적인 학습 팁</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-black pl-4 py-2">
              <p className="font-serif font-bold text-lg">매일 조금씩</p>
              <p className="text-sm text-gray-600">
                하루에 10~20단어씩 꾸준히 학습하는 것이 한 번에 많이 외우는 것보다 장기 기억에 효과적입니다.
              </p>
            </div>

            <div className="border-l-4 border-black pl-4 py-2">
              <p className="font-serif font-bold text-lg">틀려도 괜찮아요</p>
              <p className="text-sm text-gray-600">
                틀린 단어는 SM-2 알고리즘에 의해 자동으로 더 자주 복습됩니다. 실수를 두려워하지 마세요.
              </p>
            </div>

            <div className="border-l-4 border-black pl-4 py-2">
              <p className="font-serif font-bold text-lg">확신도는 정직하게</p>
              <p className="text-sm text-gray-600">
                애매하게 알고 있다면 솔직하게 "애매해요"를 선택하세요. 더 자주 복습해서 확실히 외울 수 있습니다.
              </p>
            </div>

            <div className="border-l-4 border-black pl-4 py-2">
              <p className="font-serif font-bold text-lg">스트릭을 유지하세요</p>
              <p className="text-sm text-gray-600">
                연속 학습일이 늘어날수록 학습이 습관이 됩니다. 하루 5분이라도 좋으니 매일 학습해보세요.
              </p>
            </div>

            <div className="border-l-4 border-black pl-4 py-2">
              <p className="font-serif font-bold text-lg">힌트를 활용하세요</p>
              <p className="text-sm text-gray-600">
                타이핑 테스트에서 막히면 첫 글자 힌트나 발음 힌트를 활용하세요. 완전히 모르는 것보다 힌트와 함께 기억하는 게 낫습니다.
              </p>
            </div>
          </div>
        </section>

        {/* SM-2 알고리즘 설명 */}
        <section className="mb-12">
          <h2 className="section-title">간격 반복 학습</h2>

          <div className="border-2 border-black p-4">
            <p className="font-serif font-bold text-lg mb-3">SM-2 알고리즘이란?</p>
            <p className="text-sm text-gray-600 mb-4">
              이 앱은 SM-2 간격 반복 알고리즘을 사용합니다. 단어를 얼마나 잘 기억하는지에 따라 다음 복습 시점이 자동으로 조절됩니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="border border-black p-3">
                <p className="font-mono text-lg font-bold">1일</p>
                <p className="text-xs text-gray-500">처음 학습</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-mono text-lg font-bold">3일</p>
                <p className="text-xs text-gray-500">첫 복습 후</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-mono text-lg font-bold">7일+</p>
                <p className="text-xs text-gray-500">연속 정답 시</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * 틀리면 간격이 줄어들고, 맞추면 간격이 늘어납니다.
            </p>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t-2 border-black mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            className="w-full py-3 border-2 border-black hover:bg-black hover:text-white transition-colors text-sm uppercase tracking-wider"
            onClick={onBack}
          >
            대시보드로 돌아가기
          </button>
        </div>
      </footer>
    </div>
  );
}
