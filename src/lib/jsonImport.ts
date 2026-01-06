import { Word } from '@/types';

export interface ImportedWord {
  english: string;
  korean: string;
  pronunciation?: string;
  example?: string;
  exampleKorean?: string;
}

export interface ImportResult {
  success: boolean;
  words?: ImportedWord[];
  name?: string;
  description?: string;
  error?: string;
  warnings?: string[];
}

interface JSONWordSet {
  name?: string;
  description?: string;
  words: Array<{
    english?: string;
    korean?: string;
    pronunciation?: string;
    example?: string;
    exampleKorean?: string;
  }>;
}

export async function parseWordSetJSON(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'JSON 형식이 올바르지 않습니다.',
      };
    }

    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        error: 'JSON 객체 형식이어야 합니다.',
      };
    }

    const jsonData = data as JSONWordSet;

    if (!jsonData.words || !Array.isArray(jsonData.words)) {
      return {
        success: false,
        error: '"words" 배열이 필요합니다.',
      };
    }

    if (jsonData.words.length === 0) {
      return {
        success: false,
        error: '단어가 하나도 없습니다.',
      };
    }

    const warnings: string[] = [];
    const validWords: ImportedWord[] = [];
    const invalidIndices: number[] = [];

    jsonData.words.forEach((word, index) => {
      if (!word.english || typeof word.english !== 'string' || !word.english.trim()) {
        invalidIndices.push(index + 1);
        return;
      }
      if (!word.korean || typeof word.korean !== 'string' || !word.korean.trim()) {
        invalidIndices.push(index + 1);
        return;
      }

      validWords.push({
        english: word.english.trim(),
        korean: word.korean.trim(),
        pronunciation: word.pronunciation?.trim() || undefined,
        example: word.example?.trim() || undefined,
        exampleKorean: word.exampleKorean?.trim() || undefined,
      });
    });

    if (invalidIndices.length > 0) {
      if (invalidIndices.length <= 3) {
        warnings.push(`${invalidIndices.join(', ')}번째 단어에 필수 필드(english, korean)가 누락되어 건너뛰었습니다.`);
      } else {
        warnings.push(`${invalidIndices.length}개의 단어에 필수 필드가 누락되어 건너뛰었습니다.`);
      }
    }

    if (validWords.length === 0) {
      return {
        success: false,
        error: '유효한 단어가 없습니다. 각 단어에 english와 korean 필드가 필요합니다.',
      };
    }

    return {
      success: true,
      words: validWords,
      name: jsonData.name?.trim() || undefined,
      description: jsonData.description?.trim() || undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일을 읽을 수 없습니다.',
    };
  }
}

export function findDuplicateWords(
  importedWords: ImportedWord[],
  existingWords: Word[]
): Set<string> {
  const existingEnglish = new Set(
    existingWords.map((w) => w.english.toLowerCase())
  );

  const duplicates = new Set<string>();
  importedWords.forEach((word) => {
    if (existingEnglish.has(word.english.toLowerCase())) {
      duplicates.add(word.english.toLowerCase());
    }
  });

  return duplicates;
}

export const JSON_TEMPLATE_SIMPLE = `{
  "words": [
    { "english": "apple", "korean": "사과" },
    { "english": "book", "korean": "책" }
  ]
}`;

export const JSON_TEMPLATE_FULL = `{
  "name": "TOEIC 빈출 단어",
  "description": "토익 자주 나오는 단어 모음",
  "words": [
    {
      "english": "accommodate",
      "korean": "수용하다",
      "pronunciation": "əˈkɑːmədeɪt",
      "example": "The hotel can accommodate 500 guests.",
      "exampleKorean": "그 호텔은 500명의 손님을 수용할 수 있다."
    }
  ]
}`;
