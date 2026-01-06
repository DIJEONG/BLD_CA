/**
 * 흑백 미니멀 테마 시스템
 * 참고: Brutalist / Editorial / Swiss Typography 스타일
 */

export const theme = {
  colors: {
    // 기본 색상
    black: '#000000',
    white: '#ffffff',

    // 그레이 스케일
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // 액센트 (최소한으로 사용)
    accent: {
      success: '#000000', // 테두리로 표현
      error: '#000000',
      warning: '#000000',
    },
  },

  typography: {
    // 폰트 패밀리
    fontFamily: {
      sans: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      serif: '"Noto Serif KR", Georgia, serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },

    // 폰트 크기
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },

    // 폰트 굵기
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },

    // 행간
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },

    // 자간
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
      wider: '0.1em',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },

  borders: {
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
    style: 'solid',
    color: '#000000',
  },

  shadows: {
    none: 'none',
    // 그림자 대신 테두리 사용
  },

  transitions: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

// 타입 정의
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeTypography = typeof theme.typography;
