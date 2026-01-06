'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import AddWordForm from './AddWordForm';
import { translateToKorean } from '@/lib/translate';

interface WordSetEditorProps {
  wordSetId: string;
  onBack: () => void;
  onStartLearning: (wordSetId: string) => void;
}

export default function WordSetEditor({
  wordSetId,
  onBack,
  onStartLearning,
}: WordSetEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // URL 추출 관련 상태
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [isAddingWords, setIsAddingWords] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Store에서 직접 단어장 조회 (실시간 업데이트)
  const customWordSets = useStore((state) => state.customWordSets);
  const wordSet = customWordSets.find(ws => ws.id === wordSetId);

  const [editedName, setEditedName] = useState(wordSet?.name || '');

  const updateCustomWordSet = useStore((state) => state.updateCustomWordSet);
  const deleteCustomWordSet = useStore((state) => state.deleteCustomWordSet);
  const removeWordFromCustomSet = useStore((state) => state.removeWordFromCustomSet);
  const addWordToCustomSet = useStore((state) => state.addWordToCustomSet);

  // 단어장이 없으면 (삭제된 경우) 돌아가기
  if (!wordSet) {
    onBack();
    return null;
  }

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateCustomWordSet(wordSet.id, { name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const handleDeleteWordSet = () => {
    deleteCustomWordSet(wordSet.id);
    onBack();
  };

  const handleRemoveWord = (wordId: string) => {
    removeWordFromCustomSet(wordSet.id, wordId);
  };

  // URL에서 단어 추출
  const handleExtractWords = async () => {
    if (!urlInput.trim()) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractedWords([]);
    setSelectedWords(new Set());

    try {
      const response = await fetch('/api/extract-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        setExtractError(data.error || '단어 추출에 실패했습니다.');
      } else {
        // 이미 단어장에 있는 단어 제외
        const existingWords = new Set(wordSet.words.map(w => w.english.toLowerCase()));
        const newWords = data.words.filter((w: string) => !existingWords.has(w.toLowerCase()));
        setExtractedWords(newWords);

        if (newWords.length === 0) {
          setExtractError('새로 추가할 단어가 없습니다. (이미 있는 단어들입니다)');
        }
      }
    } catch (error) {
      setExtractError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsExtracting(false);
    }
  };

  // 단어 선택 토글
  const toggleWordSelection = (word: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setSelectedWords(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedWords.size === extractedWords.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(extractedWords));
    }
  };

  // 선택한 단어들 추가
  const handleAddSelectedWords = async () => {
    if (selectedWords.size === 0) return;

    setIsAddingWords(true);

    try {
      const wordsToAdd = Array.from(selectedWords);

      for (const english of wordsToAdd) {
        // 번역 시도
        const result = await translateToKorean(english);
        const korean = result.success && result.translation
          ? result.translation
          : '(번역 필요)';

        addWordToCustomSet(wordSet.id, {
          english,
          korean,
        });
      }

      // 추가 완료 후 초기화
      setExtractedWords([]);
      setSelectedWords(new Set());
      setUrlInput('');
    } catch (error) {
      setExtractError('단어 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAddingWords(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b-2 border-black">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              className="tag hover:bg-black hover:text-white transition-colors"
              onClick={onBack}
            >
              ← BACK
            </button>

            {!showDeleteConfirm ? (
              <button
                className="tag hover:bg-black hover:text-white transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                DELETE
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">삭제할까요?</span>
                <button
                  className="tag-filled hover:bg-white hover:text-black transition-colors"
                  onClick={handleDeleteWordSet}
                >
                  DELETE
                </button>
                <button
                  className="tag hover:bg-black hover:text-white transition-colors"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>

          {/* 단어장 이름 */}
          <div className="mt-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-serif font-bold border-2 border-black"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  className="tag-filled hover:bg-white hover:text-black transition-colors"
                  onClick={handleSaveName}
                >
                  SAVE
                </button>
                <button
                  className="tag hover:bg-black hover:text-white transition-colors"
                  onClick={() => setIsEditingName(false)}
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-serif font-bold">{wordSet.name}</h1>
                <button
                  className="tag hover:bg-black hover:text-white transition-colors"
                  onClick={() => {
                    setEditedName(wordSet.name);
                    setIsEditingName(true);
                  }}
                >
                  EDIT
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 font-mono mt-2 uppercase tracking-wider">
              {wordSet.words.length} words
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 학습 시작 버튼 */}
        {wordSet.words.length > 0 && (
          <button
            className="w-full border-2 border-black bg-black text-white py-4 mb-8 font-medium tracking-wide hover:bg-white hover:text-black transition-colors"
            onClick={() => onStartLearning(wordSet.id)}
          >
            START LEARNING →
          </button>
        )}

        {/* URL에서 단어 추출 */}
        <div className="mb-8">
          <h2 className="section-title">URL에서 단어 추출</h2>
          <div className="border-2 border-black">
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 border-2 border-black"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleExtractWords();
                  }}
                />
                <button
                  className="tag-filled hover:bg-white hover:text-black transition-colors px-4"
                  onClick={handleExtractWords}
                  disabled={isExtracting || !urlInput.trim()}
                >
                  {isExtracting ? '추출 중...' : '추출'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                뉴스, 블로그 등 영어 페이지 URL을 입력하세요
              </p>
            </div>

            {/* 오류 메시지 */}
            {extractError && (
              <div className="border-t border-black p-4 bg-red-50">
                <p className="text-sm text-red-600">{extractError}</p>
              </div>
            )}

            {/* 추출된 단어 목록 */}
            {extractedWords.length > 0 && (
              <>
                <div className="border-t border-black p-3 flex justify-between items-center bg-gray-50">
                  <span className="text-sm">
                    {extractedWords.length}개 단어 발견 · {selectedWords.size}개 선택
                  </span>
                  <button
                    className="text-xs text-gray-600 hover:text-black"
                    onClick={toggleSelectAll}
                  >
                    {selectedWords.size === extractedWords.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="border-t border-black max-h-[200px] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-0">
                    {extractedWords.map((word, index) => (
                      <button
                        key={word}
                        className={`p-2 text-sm text-left border-b border-r border-black
                          ${selectedWords.has(word) ? 'bg-black text-white' : 'hover:bg-gray-100'}
                          ${index % 3 === 2 ? 'border-r-0' : ''}
                        `}
                        onClick={() => toggleWordSelection(word)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-black p-4">
                  <button
                    className="w-full py-3 bg-black text-white font-medium tracking-wide hover:bg-white hover:text-black hover:border-black transition-colors disabled:opacity-50"
                    onClick={handleAddSelectedWords}
                    disabled={selectedWords.size === 0 || isAddingWords}
                  >
                    {isAddingWords
                      ? '추가 중...'
                      : `선택한 ${selectedWords.size}개 단어 추가`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 단어 추가 폼 */}
        <div className="mb-8">
          <h2 className="section-title">직접 단어 추가</h2>
          <AddWordForm wordSetId={wordSet.id} />
        </div>

        {/* 단어 목록 */}
        <div>
          <h2 className="section-title">단어 목록</h2>

          {wordSet.words.length === 0 ? (
            <div className="border-2 border-dashed border-black p-8 text-center">
              <p className="text-gray-500">아직 단어가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">위에서 단어를 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-0">
              {wordSet.words.map((word, index) => (
                <div
                  key={word.id}
                  className={`flex items-center justify-between p-4 border-2 border-black ${
                    index > 0 ? 'border-t-0' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center border-2 border-black font-mono text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-semibold">{word.english}</span>
                      <span className="text-gray-400 mx-2">—</span>
                      <span>{word.korean}</span>
                      {word.pronunciation && (
                        <span className="text-sm text-gray-500 ml-2 font-mono">
                          [{word.pronunciation}]
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="tag hover:bg-black hover:text-white transition-colors"
                    onClick={() => handleRemoveWord(word.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t-2 border-black mt-16">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-center text-gray-500 uppercase tracking-wider">
            Custom Word Set Editor
          </p>
        </div>
      </footer>
    </div>
  );
}
