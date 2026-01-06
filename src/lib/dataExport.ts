/**
 * 학습 데이터 내보내기/가져오기 유틸
 */

import { AppState } from '@/types';

// 내보내기 데이터 형식
interface ExportData {
  version: string;
  exportedAt: string;
  data: Omit<AppState, 'isOnboarded'> & { isOnboarded: boolean };
}

/**
 * 학습 데이터를 JSON 파일로 내보내기
 */
export function exportDataToJSON(state: AppState): void {
  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // 파일명: vocab-backup-YYYY-MM-DD.json
  const date = new Date().toISOString().split('T')[0];
  const filename = `vocab-backup-${date}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * JSON 파일에서 학습 데이터 가져오기
 */
export function importDataFromJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: ExportData = JSON.parse(content);

        // 버전 체크
        if (!parsed.version || !parsed.data) {
          throw new Error('잘못된 파일 형식입니다.');
        }

        // 필수 필드 검증
        const data = parsed.data;
        if (
          typeof data.profile !== 'object' ||
          typeof data.wordProgress !== 'object' ||
          !Array.isArray(data.sessions)
        ) {
          throw new Error('데이터 구조가 올바르지 않습니다.');
        }

        resolve(data as AppState);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('파일을 읽을 수 없습니다.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    };

    reader.readAsText(file);
  });
}

/**
 * 내보내기 데이터 요약 정보
 */
export function getExportSummary(state: AppState): {
  wordsLearned: number;
  totalSessions: number;
  currentStreak: number;
  customWordSets: number;
} {
  return {
    wordsLearned: Object.keys(state.wordProgress).length,
    totalSessions: state.sessions.length,
    currentStreak: state.currentStreak,
    customWordSets: state.customWordSets.length,
  };
}
