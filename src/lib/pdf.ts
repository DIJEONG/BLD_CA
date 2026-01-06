/**
 * PDF 파일에서 텍스트를 추출합니다
 * @param file - PDF 파일
 * @param onProgress - 진행률 콜백 (0-1)
 * @returns 추출된 텍스트
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 동적 import로 클라이언트 사이드에서만 로드
  const pdfjsLib = await import('pdfjs-dist');

  // PDF.js worker 설정
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  const textParts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // 텍스트 아이템들을 문자열로 결합
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ');

    textParts.push(pageText);

    if (onProgress) {
      onProgress(i / totalPages);
    }
  }

  return textParts.join('\n');
}

/**
 * PDF에서 텍스트가 추출 가능한지 확인합니다
 * (스캔된 PDF는 텍스트가 거의 없음)
 * @param text - 추출된 텍스트
 * @returns 텍스트가 충분한지 여부
 */
export function hasSufficientText(text: string): boolean {
  // 공백 제거 후 최소 50자 이상이면 텍스트 PDF로 판단
  const cleanText = text.replace(/\s+/g, '');
  return cleanText.length >= 50;
}
