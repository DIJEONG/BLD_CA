import { createWorker, OEM } from 'tesseract.js';

/**
 * 이미지에서 텍스트를 추출합니다 (클라이언트 사이드 OCR)
 * @param imageFile - 처리할 이미지 파일
 * @param onProgress - 진행률 콜백 (0-1)
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker('eng', OEM.LSTM_ONLY, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  try {
    const { data: { text } } = await worker.recognize(imageFile);
    return text;
  } finally {
    await worker.terminate();
  }
}
