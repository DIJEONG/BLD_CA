/**
 * TTS (Text-to-Speech) 유틸리티
 * Web Speech API 기반 발음 재생
 */

/**
 * 텍스트를 음성으로 재생
 * @param text 재생할 텍스트
 * @param lang 언어 코드 (기본: 영어)
 */
export function speak(text: string, lang: string = 'en-US'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // 이전 발화 취소
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85; // 약간 느리게 (학습용)
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

/**
 * TTS 지원 여부 확인
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * 현재 재생 중인지 확인
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }
  return window.speechSynthesis.speaking;
}

/**
 * 재생 중지
 */
export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
}
