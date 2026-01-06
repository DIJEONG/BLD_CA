'use client';

import { useState, useMemo, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import AddWordForm from './AddWordForm';
import { translateToKorean } from '@/lib/translate';
import { Word } from '@/types';
import {
  parseWordSetJSON,
  findDuplicateWords,
  ImportedWord,
  JSON_TEMPLATE_SIMPLE,
  JSON_TEMPLATE_FULL,
} from '@/lib/jsonImport';
import { extractTextFromImage } from '@/lib/ocr';
import { extractTextFromPdf, hasSufficientText } from '@/lib/pdf';
import { extractVocabularyWords } from '@/lib/wordExtractor';
import { ChevronDown, ChevronRight, Link, FileText, ImageIcon, Languages } from 'lucide-react';

type ImportTab = 'url' | 'file' | 'image';

// 번역 편집용 단어 타입
interface WordWithTranslation {
  english: string;
  korean: string;
  isTranslating?: boolean;
}

interface WordSetEditorProps {
  wordSetId: string;
  onBack: () => void;
  onStartLearning: (wordSetId: string, filterWords?: Word[]) => void;
}

// 날짜별 단어 그룹
interface DateGroup {
  date: string;  // YYYY-MM-DD or 'legacy'
  label: string; // 표시용 라벨
  words: Word[];
}

export default function WordSetEditor({
  wordSetId,
  onBack,
  onStartLearning,
}: WordSetEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 탭 상태
  const [importTab, setImportTab] = useState<ImportTab>('url');

  // URL 추출 관련 상태
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [extractError, setExtractError] = useState<string | null>(null);

  // 파일 가져오기 관련 상태 (JSON + PDF)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileType, setFileType] = useState<'json' | 'pdf' | null>(null);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  // JSON 관련
  const [jsonPreviewWords, setJsonPreviewWords] = useState<ImportedWord[]>([]);
  const [jsonDuplicates, setJsonDuplicates] = useState<Set<string>>(new Set());
  const [showJsonHelp, setShowJsonHelp] = useState(false);
  const [isAddingJsonWords, setIsAddingJsonWords] = useState(false);
  // PDF 관련 (단어 추출 결과)
  const [pdfExtractedWords, setPdfExtractedWords] = useState<string[]>([]);
  const [pdfSelectedWords, setPdfSelectedWords] = useState<Set<string>>(new Set());
  // 공통
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);

  // 이미지 OCR 관련 상태
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrExtractedWords, setOcrExtractedWords] = useState<string[]>([]);
  const [ocrSelectedWords, setOcrSelectedWords] = useState<Set<string>>(new Set());

  // 번역 편집 관련 상태 (공통)
  const [showTranslationEdit, setShowTranslationEdit] = useState(false);
  const [translationSource, setTranslationSource] = useState<'url' | 'pdf' | 'ocr' | null>(null);
  const [wordsWithTranslation, setWordsWithTranslation] = useState<WordWithTranslation[]>([]);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [isFinalAdding, setIsFinalAdding] = useState(false);

  // Store에서 직접 단어장 조회 (실시간 업데이트)
  const customWordSets = useStore((state) => state.customWordSets);
  const wordSet = customWordSets.find(ws => ws.id === wordSetId);

  const [editedName, setEditedName] = useState(wordSet?.name || '');

  const updateCustomWordSet = useStore((state) => state.updateCustomWordSet);
  const deleteCustomWordSet = useStore((state) => state.deleteCustomWordSet);
  const removeWordFromCustomSet = useStore((state) => state.removeWordFromCustomSet);
  const addWordToCustomSet = useStore((state) => state.addWordToCustomSet);

  // 날짜별 단어 그룹핑
  const dateGroups = useMemo((): DateGroup[] => {
    if (!wordSet) return [];

    const groups: Map<string, Word[]> = new Map();

    wordSet.words.forEach(word => {
      const date = word.addedAt || 'legacy';
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(word);
    });

    // 날짜 포맷팅 함수
    const formatDate = (dateStr: string): string => {
      if (dateStr === 'legacy') return '이전 단어';
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // 날짜 내림차순 정렬 (최신 먼저), legacy는 맨 뒤로
    const sortedDates = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'legacy') return 1;
      if (b === 'legacy') return -1;
      return b.localeCompare(a);
    });

    return sortedDates.map(date => ({
      date,
      label: formatDate(date),
      words: groups.get(date)!,
    }));
  }, [wordSet]);

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

  // 번역 편집 화면으로 이동 및 자동 번역 시작
  const handleGoToTranslationEdit = async (source: 'url' | 'pdf' | 'ocr') => {
    let words: string[] = [];

    if (source === 'url') {
      words = Array.from(selectedWords);
    } else if (source === 'pdf') {
      words = Array.from(pdfSelectedWords);
    } else if (source === 'ocr') {
      words = Array.from(ocrSelectedWords);
    }

    if (words.length === 0) return;

    // 번역 편집용 데이터 초기화
    const wordsData: WordWithTranslation[] = words.map(english => ({
      english,
      korean: '',
      isTranslating: true, // 번역 중 상태로 시작
    }));

    setWordsWithTranslation(wordsData);
    setTranslationSource(source);
    setShowTranslationEdit(true);
    setIsAutoTranslating(true);

    // 자동 번역 실행
    const translatedWords = [...wordsData];
    for (let i = 0; i < translatedWords.length; i++) {
      try {
        const result = await translateToKorean(translatedWords[i].english);
        translatedWords[i] = {
          ...translatedWords[i],
          korean: result.success && result.translation ? result.translation : '(번역 필요)',
          isTranslating: false,
        };
        // 실시간 업데이트
        setWordsWithTranslation([...translatedWords]);
      } catch {
        translatedWords[i] = {
          ...translatedWords[i],
          korean: '(번역 필요)',
          isTranslating: false,
        };
        setWordsWithTranslation([...translatedWords]);
      }
    }

    setIsAutoTranslating(false);
  };

  // 개별 단어 번역 수정
  const handleTranslationChange = (index: number, korean: string) => {
    setWordsWithTranslation(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], korean };
      return updated;
    });
  };

  // 개별 단어 자동 번역
  const handleAutoTranslateSingle = async (index: number) => {
    const word = wordsWithTranslation[index];

    setWordsWithTranslation(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isTranslating: true };
      return updated;
    });

    try {
      const result = await translateToKorean(word.english);
      const korean = result.success && result.translation
        ? result.translation
        : '(번역 실패)';

      setWordsWithTranslation(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], korean, isTranslating: false };
        return updated;
      });
    } catch {
      setWordsWithTranslation(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], korean: '(번역 실패)', isTranslating: false };
        return updated;
      });
    }
  };

  // 전체 재번역 (모든 단어 다시 번역)
  const handleAutoTranslateAll = async () => {
    setIsAutoTranslating(true);

    const updated = wordsWithTranslation.map(w => ({ ...w, isTranslating: true }));
    setWordsWithTranslation(updated);

    for (let i = 0; i < updated.length; i++) {
      try {
        const result = await translateToKorean(updated[i].english);
        updated[i] = {
          ...updated[i],
          korean: result.success && result.translation ? result.translation : '(번역 필요)',
          isTranslating: false,
        };
        setWordsWithTranslation([...updated]);
      } catch {
        updated[i] = { ...updated[i], korean: '(번역 필요)', isTranslating: false };
        setWordsWithTranslation([...updated]);
      }
    }

    setIsAutoTranslating(false);
  };

  // 번역 편집 완료 후 단어 추가
  const handleFinalAddWords = async () => {
    if (wordsWithTranslation.length === 0) return;

    setIsFinalAdding(true);

    try {
      for (const word of wordsWithTranslation) {
        addWordToCustomSet(wordSet.id, {
          english: word.english,
          korean: word.korean.trim() || '(번역 필요)',
        });
      }

      // 소스에 따라 상태 초기화
      if (translationSource === 'url') {
        setExtractedWords([]);
        setSelectedWords(new Set());
        setUrlInput('');
      } else if (translationSource === 'pdf') {
        resetFileState();
      } else if (translationSource === 'ocr') {
        setOcrExtractedWords([]);
        setOcrSelectedWords(new Set());
      }

      // 번역 편집 상태 초기화
      setShowTranslationEdit(false);
      setTranslationSource(null);
      setWordsWithTranslation([]);
    } catch (error) {
      // 에러 처리는 소스에 따라
      if (translationSource === 'url') {
        setExtractError('단어 추가 중 오류가 발생했습니다.');
      } else if (translationSource === 'pdf') {
        setFileError('단어 추가 중 오류가 발생했습니다.');
      } else if (translationSource === 'ocr') {
        setOcrError('단어 추가 중 오류가 발생했습니다.');
      }
    } finally {
      setIsFinalAdding(false);
    }
  };

  // 번역 편집 취소
  const handleCancelTranslationEdit = () => {
    setShowTranslationEdit(false);
    setTranslationSource(null);
    setWordsWithTranslation([]);
  };

  // 파일 처리 (JSON + PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이전 상태 초기화
    resetFileState();

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      setFileType('json');
      await handleJsonFile(file);
    } else if (extension === 'pdf') {
      setFileType('pdf');
      await handlePdfFile(file);
    } else {
      setFileError('JSON 또는 PDF 파일만 지원합니다.');
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // JSON 파일 처리
  const handleJsonFile = async (file: File) => {
    const result = await parseWordSetJSON(file);

    if (!result.success) {
      setFileError(result.error || '파일을 처리할 수 없습니다.');
      return;
    }

    if (result.warnings) {
      setFileWarnings(result.warnings);
    }

    if (result.words) {
      setJsonPreviewWords(result.words);
      const duplicates = findDuplicateWords(result.words, wordSet?.words || []);
      setJsonDuplicates(duplicates);
    }
  };

  // PDF 파일 처리
  const handlePdfFile = async (file: File) => {
    setIsFileProcessing(true);
    setFileProgress(0);

    try {
      // PDF에서 텍스트 추출
      const text = await extractTextFromPdf(file, setFileProgress);

      // 텍스트가 충분한지 확인
      if (!hasSufficientText(text)) {
        setFileError('PDF에서 텍스트를 추출할 수 없습니다. 스캔된 PDF는 이미지 탭에서 OCR로 처리해주세요.');
        return;
      }

      // 영어 단어 추출
      const words = extractVocabularyWords(text);

      // 이미 단어장에 있는 단어 제외
      const existingWords = new Set(wordSet?.words.map(w => w.english.toLowerCase()) || []);
      const newWords = words.filter(w => !existingWords.has(w.toLowerCase()));

      if (newWords.length === 0) {
        setFileError('새로 추가할 단어가 없습니다. (추출된 단어가 없거나 이미 있는 단어들입니다)');
      } else {
        setPdfExtractedWords(newWords);
        setPdfSelectedWords(new Set(newWords));
      }
    } catch (error) {
      setFileError('PDF 파일을 처리할 수 없습니다.');
    } finally {
      setIsFileProcessing(false);
    }
  };

  // JSON에서 단어 추가
  const handleAddJsonWords = async () => {
    if (jsonPreviewWords.length === 0) return;

    setIsAddingJsonWords(true);

    try {
      const wordsToAdd = jsonPreviewWords.filter(
        (w) => !jsonDuplicates.has(w.english.toLowerCase())
      );

      for (const word of wordsToAdd) {
        addWordToCustomSet(wordSet!.id, {
          english: word.english,
          korean: word.korean,
          pronunciation: word.pronunciation,
          example: word.example,
          exampleKorean: word.exampleKorean,
        });
      }

      resetFileState();
    } catch (error) {
      setFileError('단어 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAddingJsonWords(false);
    }
  };

  // PDF 단어 선택 토글
  const togglePdfWordSelection = (word: string) => {
    const newSelected = new Set(pdfSelectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setPdfSelectedWords(newSelected);
  };

  // PDF 전체 선택/해제
  const togglePdfSelectAll = () => {
    if (pdfSelectedWords.size === pdfExtractedWords.length) {
      setPdfSelectedWords(new Set());
    } else {
      setPdfSelectedWords(new Set(pdfExtractedWords));
    }
  };

  // 파일 상태 초기화
  const resetFileState = () => {
    setFileType(null);
    setFileError(null);
    setFileWarnings([]);
    setFileProgress(0);
    setJsonPreviewWords([]);
    setJsonDuplicates(new Set());
    setPdfExtractedWords([]);
    setPdfSelectedWords(new Set());
  };

  // 템플릿 복사
  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
  };

  // 이미지에서 단어 추출 (OCR)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 타입 검증
    if (!file.type.startsWith('image/')) {
      setOcrError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsOcrProcessing(true);
    setOcrProgress(0);
    setOcrError(null);
    setOcrExtractedWords([]);
    setOcrSelectedWords(new Set());

    try {
      // OCR 텍스트 추출
      const text = await extractTextFromImage(file, setOcrProgress);

      // 영어 단어 추출
      const words = extractVocabularyWords(text);

      // 이미 단어장에 있는 단어 제외
      const existingWords = new Set(wordSet?.words.map(w => w.english.toLowerCase()) || []);
      const newWords = words.filter(w => !existingWords.has(w.toLowerCase()));

      if (newWords.length === 0) {
        setOcrError('새로 추가할 단어가 없습니다. (추출된 단어가 없거나 이미 있는 단어들입니다)');
      } else {
        setOcrExtractedWords(newWords);
        setOcrSelectedWords(new Set(newWords));
      }
    } catch (error) {
      setOcrError('이미지에서 텍스트를 추출할 수 없습니다.');
    } finally {
      setIsOcrProcessing(false);
      // 파일 입력 초기화 (같은 파일 재선택 가능)
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

  // OCR 단어 선택 토글
  const toggleOcrWordSelection = (word: string) => {
    const newSelected = new Set(ocrSelectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setOcrSelectedWords(newSelected);
  };

  // OCR 전체 선택/해제
  const toggleOcrSelectAll = () => {
    if (ocrSelectedWords.size === ocrExtractedWords.length) {
      setOcrSelectedWords(new Set());
    } else {
      setOcrSelectedWords(new Set(ocrExtractedWords));
    }
  };

  // OCR 취소
  const handleCancelOcrImport = () => {
    setOcrExtractedWords([]);
    setOcrSelectedWords(new Set());
    setOcrError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b-2 border-foreground">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              className="tag hover:bg-foreground hover:text-background transition-colors"
              onClick={onBack}
            >
              ← BACK
            </button>

            {!showDeleteConfirm ? (
              <button
                className="tag hover:bg-foreground hover:text-background transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                DELETE
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">삭제할까요?</span>
                <button
                  className="tag-filled hover:bg-background hover:text-foreground transition-colors"
                  onClick={handleDeleteWordSet}
                >
                  DELETE
                </button>
                <button
                  className="tag hover:bg-foreground hover:text-background transition-colors"
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl sm:text-2xl font-serif font-bold border-2 border-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    className="tag-filled hover:bg-background hover:text-foreground transition-colors"
                    onClick={handleSaveName}
                  >
                    SAVE
                  </button>
                  <button
                    className="tag hover:bg-foreground hover:text-background transition-colors"
                    onClick={() => setIsEditingName(false)}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold">{wordSet.name}</h1>
                <button
                  className="tag hover:bg-foreground hover:text-background transition-colors"
                  onClick={() => {
                    setEditedName(wordSet.name);
                    setIsEditingName(true);
                  }}
                >
                  EDIT
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground font-mono mt-2 uppercase tracking-wider">
              {wordSet.words.length} words
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 학습 시작 버튼 */}
        {wordSet.words.length > 0 && (
          <button
            className="w-full border-2 border-foreground bg-foreground text-background py-4 mb-8 font-medium tracking-wide hover:bg-background hover:text-foreground transition-colors"
            onClick={() => onStartLearning(wordSet.id)}
          >
            START LEARNING →
          </button>
        )}

        {/* 단어 추출/가져오기 통합 탭 */}
        <div className="mb-8">
          <h2 className="section-title">단어 추출 / 가져오기</h2>
          <div className="border-2 border-foreground">
            {/* 탭 네비게이션 */}
            <div className="flex border-b border-foreground">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  importTab === 'url'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setImportTab('url')}
              >
                <Link size={16} />
                URL
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-l border-foreground transition-colors ${
                  importTab === 'file'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setImportTab('file')}
              >
                <FileText size={16} />
                파일
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-l border-foreground transition-colors ${
                  importTab === 'image'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-secondary'
                }`}
                onClick={() => setImportTab('image')}
              >
                <ImageIcon size={16} />
                이미지
              </button>
            </div>

            {/* URL 탭 */}
            {importTab === 'url' && (
              <>
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 border-2 border-foreground"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleExtractWords();
                      }}
                    />
                    <button
                      className="tag-filled hover:bg-background hover:text-foreground transition-colors px-4"
                      onClick={handleExtractWords}
                      disabled={isExtracting || !urlInput.trim()}
                    >
                      {isExtracting ? '추출 중...' : '추출'}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    뉴스, 블로그 등 영어 페이지 URL을 입력하세요
                  </p>
                </div>

                {/* 오류 메시지 */}
                {extractError && (
                  <div className="border-t border-foreground p-4 bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-red-600 dark:text-red-400">{extractError}</p>
                  </div>
                )}

                {/* 추출된 단어 목록 */}
                {extractedWords.length > 0 && (
                  <>
                    <div className="border-t border-foreground p-3 flex justify-between items-center bg-secondary">
                      <span className="text-sm">
                        {extractedWords.length}개 단어 발견 · {selectedWords.size}개 선택
                      </span>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={toggleSelectAll}
                      >
                        {selectedWords.size === extractedWords.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                    <div className="border-t border-foreground max-h-[200px] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
                        {extractedWords.map((word, index) => (
                          <button
                            key={word}
                            className={`p-2 text-xs sm:text-sm text-left border-b border-r border-foreground
                              ${selectedWords.has(word) ? 'bg-foreground text-background' : 'hover:bg-secondary'}
                              ${index % 3 === 2 ? 'sm:border-r-0' : ''}
                              ${index % 2 === 1 ? 'border-r-0 sm:border-r' : ''}
                            `}
                            onClick={() => toggleWordSelection(word)}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-foreground p-4">
                      <button
                        className="w-full py-3 bg-foreground text-background font-medium tracking-wide hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        onClick={() => handleGoToTranslationEdit('url')}
                        disabled={selectedWords.size === 0}
                      >
                        다음: 번역 입력 →
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 파일 탭 (JSON + PDF) */}
            {importTab === 'file' && (
              <>
                <div className="p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    className="w-full py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isFileProcessing}
                  >
                    <FileText size={18} />
                    {isFileProcessing ? '처리 중...' : '파일 선택'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JSON 파일 (단어장 데이터) 또는 PDF 파일 (단어 추출)
                  </p>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
                    onClick={() => setShowJsonHelp(!showJsonHelp)}
                  >
                    {showJsonHelp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    JSON 형식 보기
                  </button>
                </div>

                {/* JSON 형식 도움말 */}
                {showJsonHelp && (
                  <div className="border-t border-foreground p-4 bg-secondary">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wider">간단 형식</span>
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => copyTemplate(JSON_TEMPLATE_SIMPLE)}
                          >
                            복사
                          </button>
                        </div>
                        <pre className="text-xs bg-background border border-foreground p-3 overflow-x-auto">
                          {JSON_TEMPLATE_SIMPLE}
                        </pre>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wider">전체 형식</span>
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => copyTemplate(JSON_TEMPLATE_FULL)}
                          >
                            복사
                          </button>
                        </div>
                        <pre className="text-xs bg-background border border-foreground p-3 overflow-x-auto">
                          {JSON_TEMPLATE_FULL}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* 파일 처리 진행률 */}
                {isFileProcessing && fileType === 'pdf' && (
                  <div className="border-t border-foreground p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary border border-foreground overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${Math.round(fileProgress * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12">
                        {Math.round(fileProgress * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF에서 텍스트를 추출하는 중...
                    </p>
                  </div>
                )}

                {/* 에러 메시지 */}
                {fileError && (
                  <div className="border-t border-foreground p-4 bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>
                  </div>
                )}

                {/* 경고 메시지 */}
                {fileWarnings.length > 0 && (
                  <div className="border-t border-foreground p-4 bg-amber-50 dark:bg-amber-950">
                    {fileWarnings.map((warning, i) => (
                      <p key={i} className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>
                    ))}
                  </div>
                )}

                {/* JSON 미리보기 */}
                {fileType === 'json' && jsonPreviewWords.length > 0 && (
                  <>
                    <div className="border-t border-foreground p-3 flex justify-between items-center bg-secondary">
                      <span className="text-sm">
                        {jsonPreviewWords.length}개 단어
                        {jsonDuplicates.size > 0 && (
                          <span className="text-muted-foreground"> · {jsonDuplicates.size}개 중복</span>
                        )}
                      </span>
                    </div>
                    <div className="border-t border-foreground max-h-[250px] overflow-y-auto">
                      {jsonPreviewWords.map((word, index) => {
                        const isDuplicate = jsonDuplicates.has(word.english.toLowerCase());
                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 px-4 py-2 text-sm ${
                              index > 0 ? 'border-t border-foreground' : ''
                            } ${isDuplicate ? 'bg-muted text-muted-foreground' : ''}`}
                          >
                            {isDuplicate ? (
                              <span className="text-amber-500">!</span>
                            ) : (
                              <span className="text-muted-foreground">○</span>
                            )}
                            <span className={isDuplicate ? 'line-through' : 'font-medium'}>
                              {word.english}
                            </span>
                            <span className="text-muted-foreground">—</span>
                            <span>{word.korean}</span>
                            {isDuplicate && (
                              <span className="text-xs text-amber-500 ml-auto">(이미 존재)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-foreground p-4 flex gap-2">
                      <button
                        className="flex-1 py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                        onClick={resetFileState}
                      >
                        취소
                      </button>
                      <button
                        className="flex-1 py-3 bg-foreground text-background font-medium tracking-wide hover:bg-background hover:text-foreground border-2 border-foreground transition-colors disabled:opacity-50"
                        onClick={handleAddJsonWords}
                        disabled={isAddingJsonWords || jsonPreviewWords.length === jsonDuplicates.size}
                      >
                        {isAddingJsonWords
                          ? '추가 중...'
                          : `${jsonPreviewWords.length - jsonDuplicates.size}개 단어 가져오기`}
                      </button>
                    </div>
                  </>
                )}

                {/* PDF 추출 결과 */}
                {fileType === 'pdf' && pdfExtractedWords.length > 0 && (
                  <>
                    <div className="border-t border-foreground p-3 flex justify-between items-center bg-secondary">
                      <span className="text-sm">
                        {pdfExtractedWords.length}개 단어 발견 · {pdfSelectedWords.size}개 선택
                      </span>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={togglePdfSelectAll}
                      >
                        {pdfSelectedWords.size === pdfExtractedWords.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                    <div className="border-t border-foreground max-h-[200px] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
                        {pdfExtractedWords.map((word, index) => (
                          <button
                            key={word}
                            className={`p-2 text-xs sm:text-sm text-left border-b border-r border-foreground
                              ${pdfSelectedWords.has(word) ? 'bg-foreground text-background' : 'hover:bg-secondary'}
                              ${index % 3 === 2 ? 'sm:border-r-0' : ''}
                              ${index % 2 === 1 ? 'border-r-0 sm:border-r' : ''}
                            `}
                            onClick={() => togglePdfWordSelection(word)}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-foreground p-4 flex gap-2">
                      <button
                        className="flex-1 py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                        onClick={resetFileState}
                      >
                        취소
                      </button>
                      <button
                        className="flex-1 py-3 bg-foreground text-background font-medium tracking-wide hover:bg-background hover:text-foreground border-2 border-foreground transition-colors disabled:opacity-50"
                        onClick={() => handleGoToTranslationEdit('pdf')}
                        disabled={pdfSelectedWords.size === 0}
                      >
                        다음: 번역 입력 →
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 이미지 탭 (OCR) */}
            {importTab === 'image' && (
              <>
                <div className="p-4">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    className="w-full py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={isOcrProcessing}
                  >
                    <ImageIcon size={18} />
                    {isOcrProcessing ? '처리 중...' : '이미지 선택'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    책, 문서, 스크린샷 등의 이미지에서 영어 단어를 추출합니다
                  </p>
                </div>

                {/* 진행률 표시 */}
                {isOcrProcessing && (
                  <div className="border-t border-foreground p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary border border-foreground overflow-hidden">
                        <div
                          className="h-full bg-foreground transition-all duration-300"
                          style={{ width: `${Math.round(ocrProgress * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono w-12">
                        {Math.round(ocrProgress * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      처음 사용 시 언어 모델 다운로드로 시간이 더 걸릴 수 있습니다
                    </p>
                  </div>
                )}

                {/* 오류 메시지 */}
                {ocrError && (
                  <div className="border-t border-foreground p-4 bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-red-600 dark:text-red-400">{ocrError}</p>
                  </div>
                )}

                {/* 추출된 단어 목록 */}
                {ocrExtractedWords.length > 0 && (
                  <>
                    <div className="border-t border-foreground p-3 flex justify-between items-center bg-secondary">
                      <span className="text-sm">
                        {ocrExtractedWords.length}개 단어 발견 · {ocrSelectedWords.size}개 선택
                      </span>
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={toggleOcrSelectAll}
                      >
                        {ocrSelectedWords.size === ocrExtractedWords.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>
                    <div className="border-t border-foreground max-h-[200px] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
                        {ocrExtractedWords.map((word, index) => (
                          <button
                            key={word}
                            className={`p-2 text-xs sm:text-sm text-left border-b border-r border-foreground
                              ${ocrSelectedWords.has(word) ? 'bg-foreground text-background' : 'hover:bg-secondary'}
                              ${index % 3 === 2 ? 'sm:border-r-0' : ''}
                              ${index % 2 === 1 ? 'border-r-0 sm:border-r' : ''}
                            `}
                            onClick={() => toggleOcrWordSelection(word)}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-foreground p-4 flex gap-2">
                      <button
                        className="flex-1 py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                        onClick={handleCancelOcrImport}
                      >
                        취소
                      </button>
                      <button
                        className="flex-1 py-3 bg-foreground text-background font-medium tracking-wide hover:bg-background hover:text-foreground border-2 border-foreground transition-colors disabled:opacity-50"
                        onClick={() => handleGoToTranslationEdit('ocr')}
                        disabled={ocrSelectedWords.size === 0}
                      >
                        다음: 번역 입력 →
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 번역 편집 화면 */}
            {showTranslationEdit && (
              <div className="border-t-2 border-foreground">
                <div className="border-b border-foreground px-4 py-3 bg-secondary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages size={18} />
                    <span className="font-semibold text-sm">번역 확인</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({wordsWithTranslation.length}개)
                    </span>
                    {(() => {
                      const needsCount = wordsWithTranslation.filter(w =>
                        !w.isTranslating && (!w.korean.trim() || w.korean === '(번역 필요)' || w.korean === '(번역 실패)')
                      ).length;
                      return needsCount > 0 ? (
                        <span className="text-xs text-amber-500 font-mono">
                          · {needsCount}개 확인 필요
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                    onClick={handleAutoTranslateAll}
                    disabled={isAutoTranslating}
                  >
                    {isAutoTranslating ? '번역 중...' : '전체 재번역'}
                  </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {wordsWithTranslation.map((word, index) => {
                    const needsAttention = !word.korean.trim() ||
                      word.korean === '(번역 필요)' ||
                      word.korean === '(번역 실패)';

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-4 py-2 ${
                          index > 0 ? 'border-t border-foreground' : ''
                        } ${needsAttention && !word.isTranslating ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}
                      >
                        {needsAttention && !word.isTranslating && (
                          <span className="text-amber-500 text-sm">!</span>
                        )}
                        <span className={`font-medium text-sm min-w-[100px] sm:min-w-[120px] ${
                          needsAttention && !word.isTranslating ? 'text-amber-600 dark:text-amber-400' : ''
                        }`}>
                          {word.english}
                        </span>
                        <Input
                          placeholder="번역 입력..."
                          value={word.korean}
                          onChange={(e) => handleTranslationChange(index, e.target.value)}
                          className={`flex-1 text-sm h-8 ${
                            needsAttention && !word.isTranslating
                              ? 'border-amber-400 dark:border-amber-600 border-2'
                              : 'border border-foreground'
                          }`}
                          disabled={word.isTranslating}
                        />
                        <button
                          className="tag text-[10px] px-2 py-1 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                          onClick={() => handleAutoTranslateSingle(index)}
                          disabled={word.isTranslating}
                          title="자동 번역"
                        >
                          {word.isTranslating ? '...' : '재번역'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-foreground p-4 flex gap-2">
                  <button
                    className="flex-1 py-3 border-2 border-foreground font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                    onClick={handleCancelTranslationEdit}
                  >
                    취소
                  </button>
                  <button
                    className="flex-1 py-3 bg-foreground text-background font-medium tracking-wide hover:bg-background hover:text-foreground border-2 border-foreground transition-colors disabled:opacity-50"
                    onClick={handleFinalAddWords}
                    disabled={isFinalAdding}
                  >
                    {isFinalAdding
                      ? '추가 중...'
                      : `${wordsWithTranslation.length}개 단어 추가`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 단어 추가 폼 */}
        <div className="mb-8">
          <h2 className="section-title">직접 단어 추가</h2>
          <AddWordForm wordSetId={wordSet.id} />
        </div>

        {/* 단어 목록 - 날짜별 그룹 */}
        <div>
          <h2 className="section-title">단어 목록</h2>

          {wordSet.words.length === 0 ? (
            <div className="border-2 border-dashed border-foreground p-8 text-center">
              <p className="text-muted-foreground">아직 단어가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">위에서 단어를 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dateGroups.map((group) => (
                <div key={group.date} className="border-2 border-foreground">
                  {/* 날짜 헤더 */}
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{group.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">({group.words.length})</span>
                    </div>
                    <button
                      className="tag-teal text-[10px] sm:text-xs"
                      onClick={() => onStartLearning(wordSet.id, group.words)}
                    >
                      학습
                    </button>
                  </div>

                  {/* 해당 날짜 단어들 */}
                  {group.words.map((word, index) => (
                    <div
                      key={word.id}
                      className={`flex items-center justify-between p-3 sm:p-4 ${
                        index > 0 ? 'border-t border-foreground' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-muted-foreground font-mono text-xs shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm sm:text-base">{word.english}</span>
                          <span className="text-muted-foreground mx-1 sm:mx-2">—</span>
                          <span className="text-sm sm:text-base">{word.korean}</span>
                          {word.pronunciation && (
                            <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2 font-mono hidden sm:inline">
                              [{word.pronunciation}]
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2 text-lg"
                        onClick={() => handleRemoveWord(word.id)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t-2 border-foreground mt-16">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
            Custom Word Set Editor
          </p>
        </div>
      </footer>
    </div>
  );
}
