/**
 * 工具函数
 */

/** 计算 WPM */
export function calculateWPM(totalChars: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  // WPM = (字符数 / 5) / (分钟数)
  const minutes = durationSeconds / 60;
  return Math.round(totalChars / 5 / minutes);
}

/** 计算准确率 */
export function calculateAccuracy(correct: number, wrong: number): number {
  const total = correct + wrong;
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

/** 计算练习获得的星星（1-3） */
export function calculateStars(wpm: number, accuracy: number): number {
  if (accuracy < 60) return 1;
  if (accuracy < 80) return 1;
  if (accuracy >= 90 && wpm >= 30) return 2;
  if (accuracy >= 95 && wpm >= 50) return 3;
  return 2;
}

/** 格式化时间（秒 → MM:SS） */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 获取当前日期（ISO 格式） */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** 判断是否连续练习日 */
export function isStreakDay(lastDate: string): boolean {
  const today = getTodayISO();
  const last = new Date(lastDate);
  const now = new Date(today);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/** 截断文本以适应显示（保留空格） */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\S+$/, '') + '...';
}
