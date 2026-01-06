import type { Metadata } from "next";
import { Gowun_Batang, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const gowunBatang = Gowun_Batang({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VOCAB - 영어 단어 학습 앱 | 플래시카드 & 간격 반복",
  description: "무료 영어 단어 학습 앱. SM-2 간격 반복 알고리즘, 플래시카드, 타이핑 테스트로 효과적인 영어 암기. 초등/중등/고등/성인 레벨별 단어장 제공. 나만의 커스텀 단어장도 만들 수 있습니다.",
  keywords: ["영어 단어", "단어 암기", "플래시카드", "영어 공부", "간격 반복", "SM-2", "영어 학습", "단어장", "vocabulary", "영어 앱", "무료 영어"],
  authors: [{ name: "VOCAB" }],
  creator: "VOCAB",
  publisher: "VOCAB",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "VOCAB - 영어 단어 학습 앱",
    description: "SM-2 간격 반복 알고리즘으로 효과적인 영어 단어 암기. 플래시카드, 타이핑 테스트, 커스텀 단어장 지원.",
    siteName: "VOCAB",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOCAB - 영어 단어 학습 앱",
    description: "SM-2 간격 반복 알고리즘으로 효과적인 영어 단어 암기",
  },
  verification: {
    google: "",
  },
  alternates: {
    canonical: "/",
  },
};

// 다크모드 플래시 방지 스크립트 (기본값: 라이트 모드)
const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${gowunBatang.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
