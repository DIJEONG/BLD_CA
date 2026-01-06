/**
 * MyMemory Translation API
 * 무료, API 키 불필요, 하루 5,000자 제한
 */

const API_URL = 'https://api.mymemory.translated.net/get';
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
