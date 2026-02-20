import type { Metadata } from "next";
import { Gowun_Batang, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vocab-app-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VOCAB - 영어 단어 학습 앱 | 플래시카드 & 간격 반복",
    template: "%s | VOCAB",
  },
  description: "무료 영어 단어 학습 앱. SM-2 간격 반복 알고리즘, 플래시카드, 타이핑 테스트로 효과적인 영어 암기. 초등/중등/고등/성인/CELPIP 레벨별 단어장 제공. 캐나다 영주권 준비를 위한 CELPIP 시험 대비 단어장도 지원합니다.",
  keywords: [
    "영어 단어", "단어 암기", "플래시카드", "영어 공부", "간격 반복", "SM-2",
    "영어 학습", "단어장", "vocabulary", "영어 앱", "무료 영어",
    "CELPIP", "셀핍", "캐나다 영주권", "Canadian PR", "CLB", "Express Entry",
    "이민 영어", "캐나다 이민", "영어 시험", "IELTS 대안"
  ],
  authors: [{ name: "VOCAB" }],
  creator: "VOCAB",
  publisher: "VOCAB",
  applicationName: "VOCAB",
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    title: "VOCAB - 영어 단어 학습 앱",
    description: "SM-2 간격 반복 알고리즘으로 효과적인 영어 단어 암기. 플래시카드, 타이핑 테스트, CELPIP/이민 영어 단어장 지원.",
    siteName: "VOCAB",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VOCAB - 영어 단어 학습 앱",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOCAB - 영어 단어 학습 앱",
    description: "SM-2 간격 반복 알고리즘으로 효과적인 영어 단어 암기. CELPIP 시험 대비 단어장 지원.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "",
  },
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },
  other: {
    "google-site-verification": "",
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

// JSON-LD 구조화된 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VOCAB",
  description: "무료 영어 단어 학습 앱. SM-2 간격 반복 알고리즘, 플래시카드, CELPIP 시험 대비 단어장 지원.",
  url: siteUrl,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "100",
  },
  featureList: [
    "SM-2 간격 반복 알고리즘",
    "플래시카드 학습",
    "타이핑 테스트",
    "CELPIP 시험 대비",
    "커스텀 단어장",
    "학습 진도 추적",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
