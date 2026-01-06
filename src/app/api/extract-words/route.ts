import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromHTML, extractVocabularyWords } from '@/lib/wordExtractor';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 URL입니다.' },
        { status: 400 }
      );
    }

    // URL에서 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `페이지를 불러올 수 없습니다. (${response.status})` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const text = extractTextFromHTML(html);
    const words = extractVocabularyWords(text);

    if (words.length === 0) {
      return NextResponse.json(
        { success: false, error: '추출할 영어 단어가 없습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      words,
      count: words.length,
    });
  } catch (error) {
    console.error('Word extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '단어 추출 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
