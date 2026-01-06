/**
 * URL/텍스트에서 어휘 단어 추출
 */

// 기본 단어 (제외할 단어들)
const STOP_WORDS = new Set([
  // Articles & Pronouns
  'a', 'an', 'the', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those',
  'who', 'whom', 'which', 'what', 'whose',

  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out',
  'into', 'over', 'under', 'between', 'through', 'during', 'before', 'after',
  'above', 'below', 'about', 'against', 'among', 'around',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'than', 'when', 'where', 'while', 'if', 'then', 'because',
  'although', 'unless', 'since', 'until', 'whether',

  // Common verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'done',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'get', 'got', 'getting', 'go', 'goes', 'went', 'going', 'gone',
  'come', 'came', 'coming', 'make', 'made', 'making', 'take', 'took', 'taken',
  'see', 'saw', 'seen', 'know', 'knew', 'known', 'think', 'thought',
  'say', 'said', 'tell', 'told', 'ask', 'asked', 'use', 'used',
  'find', 'found', 'give', 'gave', 'given', 'let', 'put', 'keep', 'kept',
  'begin', 'began', 'begun', 'seem', 'seemed', 'leave', 'left',
  'call', 'called', 'try', 'tried', 'need', 'needed', 'feel', 'felt',
  'become', 'became', 'want', 'wanted', 'show', 'showed', 'shown',
  'hear', 'heard', 'play', 'played', 'run', 'ran', 'move', 'moved',
  'live', 'lived', 'believe', 'believed', 'hold', 'held', 'bring', 'brought',
  'happen', 'happened', 'write', 'wrote', 'written', 'provide', 'provided',
  'sit', 'sat', 'stand', 'stood', 'lose', 'lost', 'pay', 'paid',
  'meet', 'met', 'include', 'included', 'continue', 'continued',
  'set', 'learn', 'learned', 'change', 'changed', 'lead', 'led',
  'understand', 'understood', 'watch', 'watched', 'follow', 'followed',
  'stop', 'stopped', 'create', 'created', 'speak', 'spoke', 'spoken',
  'read', 'allow', 'allowed', 'add', 'added', 'spend', 'spent',
  'grow', 'grew', 'grown', 'open', 'opened', 'walk', 'walked',
  'win', 'won', 'offer', 'offered', 'remember', 'remembered',
  'love', 'loved', 'consider', 'considered', 'appear', 'appeared',
  'buy', 'bought', 'wait', 'waited', 'serve', 'served', 'die', 'died',
  'send', 'sent', 'expect', 'expected', 'build', 'built', 'stay', 'stayed',
  'fall', 'fell', 'fallen', 'cut', 'reach', 'reached', 'kill', 'killed',
  'remain', 'remained',

  // Common adjectives & adverbs
  'good', 'bad', 'great', 'big', 'small', 'large', 'little', 'long', 'short',
  'old', 'new', 'young', 'high', 'low', 'right', 'left', 'first', 'last',
  'next', 'few', 'many', 'much', 'more', 'most', 'other', 'same', 'different',
  'own', 'such', 'even', 'also', 'back', 'well', 'just', 'only', 'still',
  'very', 'really', 'too', 'quite', 'almost', 'already', 'always', 'never',
  'often', 'sometimes', 'usually', 'again', 'away', 'here', 'there', 'now',
  'today', 'soon', 'later', 'early', 'late', 'hard', 'easy', 'far', 'near',
  'full', 'empty', 'real', 'true', 'sure', 'able', 'possible', 'likely',
  'certain', 'clear', 'free', 'whole', 'best', 'better', 'worst', 'worse',

  // Common nouns
  'people', 'person', 'man', 'woman', 'child', 'children', 'time', 'year',
  'day', 'week', 'month', 'way', 'thing', 'place', 'case', 'point', 'part',
  'group', 'number', 'world', 'area', 'country', 'problem', 'fact', 'hand',
  'home', 'school', 'work', 'life', 'system', 'program', 'question', 'job',
  'government', 'company', 'night', 'family', 'head', 'house', 'service',
  'side', 'end', 'word', 'water', 'room', 'mother', 'father', 'story',
  'money', 'lot', 'right', 'study', 'book', 'eye', 'door', 'car',
  'city', 'name', 'team', 'minute', 'idea', 'kid', 'body', 'information',
  'nothing', 'everything', 'something', 'anything', 'everyone', 'someone',
  'anyone', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'hundred', 'thousand', 'million', 'billion',

  // Web/tech common words
  'click', 'search', 'share', 'view', 'comment', 'like', 'post', 'page',
  'site', 'website', 'link', 'image', 'video', 'photo', 'news', 'article',
  'menu', 'button', 'email', 'sign', 'login', 'register', 'account',
  'home', 'contact', 'help', 'about', 'terms', 'privacy', 'policy',
  'copyright', 'reserved', 'rights', 'subscribe', 'newsletter',
]);

// 최소 단어 길이
const MIN_WORD_LENGTH = 4;
// 최대 추출 단어 수
const MAX_WORDS = 50;

/**
 * HTML에서 텍스트 추출
 */
export function extractTextFromHTML(html: string): string {
  // script, style 태그 제거
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // HTML 태그 제거
  text = text.replace(/<[^>]+>/g, ' ');
  // HTML entities 디코딩
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // 여러 공백을 하나로
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

/**
 * 텍스트에서 어휘 단어 추출
 */
export function extractVocabularyWords(text: string): string[] {
  // 영어 단어만 추출 (알파벳으로만 구성)
  const words = text.match(/[a-zA-Z]+/g) || [];

  // 소문자로 변환 후 필터링
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const lower = word.toLowerCase();

    // 필터링 조건
    if (lower.length < MIN_WORD_LENGTH) continue;
    if (STOP_WORDS.has(lower)) continue;
    if (/^\d+$/.test(lower)) continue; // 숫자만 있는 경우

    // 빈도 카운트
    wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
  }

  // 빈도순 정렬 후 상위 단어 반환
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_WORDS)
    .map(([word]) => word);

  return sorted;
}

/**
 * URL에서 단어 추출 (API 라우트에서 사용)
 */
export async function extractWordsFromUrl(url: string): Promise<{
  success: boolean;
  words?: string[];
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VocabBot/1.0)',
      },
    });

    if (!response.ok) {
      return { success: false, error: '페이지를 불러올 수 없습니다.' };
    }

    const html = await response.text();
    const text = extractTextFromHTML(html);
    const words = extractVocabularyWords(text);

    if (words.length === 0) {
      return { success: false, error: '추출할 단어가 없습니다.' };
    }

    return { success: true, words };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}
