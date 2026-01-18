import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'VOCAB - 영어 단어 학습 앱';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', marginBottom: 20 }}>
          VOCAB
        </div>
        <div style={{ fontSize: 32, color: '#a3a3a3', fontFamily: 'sans-serif' }}>
          영어 단어 학습 앱
        </div>
        <div style={{ fontSize: 24, color: '#14b8a6', marginTop: 20, fontFamily: 'sans-serif' }}>
          플래시카드 · 간격 반복 · CELPIP
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
