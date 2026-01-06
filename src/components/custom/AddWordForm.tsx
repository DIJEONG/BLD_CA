'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { translateToKorean } from '@/lib/translate';
import { useStore } from '@/store/useStore';

interface AddWordFormProps {
  wordSetId: string;
  onSuccess?: () => void;
}

export default function AddWordForm({ wordSetId, onSuccess }: AddWordFormProps) {
  const [english, setEnglish] = useState('');
  const [korean, setKorean] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [example, setExample] = useState('');
  const [exampleKorean, setExampleKorean] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingExample, setIsTranslatingExample] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const addWordToCustomSet = useStore((state) => state.addWordToCustomSet);
  const englishInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const exampleDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 영어 입력 시 자동 번역 (debounce 500ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!english.trim()) {
      setKorean('');
      setTranslationError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsTranslating(true);
      setTranslationError(null);

      const result = await translateToKorean(english.trim());

      setIsTranslating(false);

      if (result.success && result.translation) {
        setKorean(result.translation);
      } else {
        setTranslationError(result.error || '번역 실패');
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [english]);

  // 예문 입력 시 자동 번역 (debounce 500ms)
  useEffect(() => {
    if (exampleDebounceRef.current) {
      clearTimeout(exampleDebounceRef.current);
    }

    if (!example.trim()) {
      setExampleKorean('');
      return;
    }

    exampleDebounceRef.current = setTimeout(async () => {
      setIsTranslatingExample(true);

      const result = await translateToKorean(example.trim());

      setIsTranslatingExample(false);

      if (result.success && result.translation) {
        setExampleKorean(result.translation);
      }
    }, 500);

    return () => {
      if (exampleDebounceRef.current) {
        clearTimeout(exampleDebounceRef.current);
      }
    };
  }, [example]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!english.trim() || !korean.trim()) return;

    addWordToCustomSet(wordSetId, {
      english: english.trim(),
      korean: korean.trim(),
      pronunciation: pronunciation.trim() || undefined,
      example: example.trim() || undefined,
      exampleKorean: exampleKorean.trim() || undefined,
    });

    // 폼 초기화
    setEnglish('');
    setKorean('');
    setPronunciation('');
    setExample('');
    setExampleKorean('');
    setTranslationError(null);

    // 포커스 유지 (연속 입력 지원)
    englishInputRef.current?.focus();

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="border-2 border-black p-4">
      <div className="space-y-3">
        {/* 영어 입력 */}
        <div>
          <label className="data-label block mb-1">English</label>
          <Input
            ref={englishInputRef}
            placeholder="Enter English word"
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            autoComplete="off"
            className="text-base border-2 border-black"
          />
        </div>

        {/* 한국어 뜻 */}
        <div>
          <label className="data-label block mb-1">
            Korean {isTranslating && <span className="font-mono">(translating...)</span>}
          </label>
          <div className="relative">
            <Input
              placeholder={isTranslating ? '번역 중...' : '한국어 뜻 (자동 번역)'}
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              className="text-base border-2 border-black"
            />
            {isTranslating && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">
                ...
              </span>
            )}
          </div>
          {translationError && (
            <p className="text-sm text-gray-500 mt-1 font-mono">
              * {translationError} - 직접 입력해주세요
            </p>
          )}
        </div>

        {/* 발음 */}
        <div>
          <label className="data-label block mb-1">Pronunciation (optional)</label>
          <Input
            placeholder="/prəˌnʌnsɪˈeɪʃən/"
            value={pronunciation}
            onChange={(e) => setPronunciation(e.target.value)}
            className="text-base border-2 border-black font-mono"
          />
        </div>

        {/* 예문 */}
        <div>
          <label className="data-label block mb-1">
            Example (optional) {isTranslatingExample && <span className="font-mono">(translating...)</span>}
          </label>
          <Input
            placeholder="She has a comprehensive vocabulary."
            value={example}
            onChange={(e) => setExample(e.target.value)}
            className="text-base border-2 border-black"
          />
          {example && (
            <Input
              placeholder="예문 번역 (자동)"
              value={exampleKorean}
              onChange={(e) => setExampleKorean(e.target.value)}
              className="text-base border-2 border-black border-t-0 text-sm"
            />
          )}
        </div>

        {/* 추가 버튼 */}
        <button
          type="submit"
          disabled={!english.trim() || !korean.trim() || isTranslating}
          className="w-full border-2 border-black bg-black text-white py-3 font-medium tracking-wide hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + ADD WORD
        </button>
      </div>
    </form>
  );
}
