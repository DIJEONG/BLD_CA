/**
 * MyMemory Translation API
 * 무료, API 키 불필요, 하루 5,000자 제한
 */

const API_URL = 'https://api.mymemory.translated.net/get';
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TIMEOUT_MS = 5000;

export interface TranslationResult {
  success: boolean;
  translation?: string;
  error?: string;
}

export async function translateToKorean(english: string): Promise<TranslationResult> {
  if (!english.trim()) {
    return { success: false, error: '빈 텍스트' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${API_URL}?q=${encodeURIComponent(english.trim())}&langpair=en|ko`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: 'API 오류' };
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translation = data.responseData.translatedText;

      // 번역 실패 메시지 필터링
      if (
        translation.toUpperCase().includes('NOT AVAILABLE') ||
        translation.toUpperCase().includes('PLEASE REFER') ||
        translation === english // 번역 안됨
      ) {
        return { success: false, error: '번역 없음' };
      }

      return { success: true, translation };
    }

    return { success: false, error: '번역 실패' };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '시간 초과' };
    }

    return { success: false, error: '네트워크 오류' };
  }
}

/**
 * Free Dictionary API를 사용한 예문 자동 생성
 * 무료, API 키 불필요
 */
export interface ExampleResult {
  success: boolean;
  example?: string;
  error?: string;
}

export async function generateExample(word: string): Promise<ExampleResult> {
  if (!word.trim()) {
    return { success: false, error: '빈 단어' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${DICTIONARY_API_URL}/${encodeURIComponent(word.trim().toLowerCase())}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: '사전에 없는 단어' };
    }

    const data = await response.json();

    // 예문 찾기: meanings -> definitions -> example
    if (Array.isArray(data) && data.length > 0) {
      for (const entry of data) {
        if (entry.meanings && Array.isArray(entry.meanings)) {
          for (const meaning of entry.meanings) {
            if (meaning.definitions && Array.isArray(meaning.definitions)) {
              for (const def of meaning.definitions) {
                if (def.example && typeof def.example === 'string') {
                  // 예문의 첫 글자를 대문자로
                  const example = def.example.charAt(0).toUpperCase() + def.example.slice(1);
                  // 마침표가 없으면 추가
                  const finalExample = example.endsWith('.') || example.endsWith('!') || example.endsWith('?')
                    ? example
                    : example + '.';
                  return { success: true, example: finalExample };
                }
              }
            }
          }
        }
      }
    }

    return { success: false, error: '예문 없음' };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '시간 초과' };
    }

    return { success: false, error: '네트워크 오류' };
  }
}
