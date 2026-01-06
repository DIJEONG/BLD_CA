'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import AddWordForm from './AddWordForm';

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

  // Store에서 직접 단어장 조회 (실시간 업데이트)
  const customWordSets = useStore((state) => state.customWordSets);
  const wordSet = customWordSets.find(ws => ws.id === wordSetId);

  const [editedName, setEditedName] = useState(wordSet?.name || '');

  const updateCustomWordSet = useStore((state) => state.updateCustomWordSet);
  const deleteCustomWordSet = useStore((state) => state.deleteCustomWordSet);
  const removeWordFromCustomSet = useStore((state) => state.removeWordFromCustomSet);

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

        {/* 단어 추가 폼 */}
        <div className="mb-8">
          <h2 className="section-title">새 단어 추가</h2>
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
