/**
 * 进度存储管理
 * 使用 chrome.storage.local（Chrome/Firefox 通用）
 */
import type { UserProgress, PracticeResult } from '../lib/types';
import { DEFAULT_PROGRESS } from '../lib/constants';

// 兼容 Chrome 和 Firefox：chrome.storage.local.get/set 在 Chrome 中返回 Promise，
// Firefox 的 browser.storage.local.get/set 也返回 Promise，因此可直接 await
const storage = (typeof chrome !== 'undefined' ? chrome : browser).storage.local;

/** 获取用户进度 */
async function getProgress(): Promise<UserProgress> {
  const result: any = await storage.get('childtype_progress');
  return result.childtype_progress || { ...DEFAULT_PROGRESS };
}

/** 保存用户进度 */
async function saveProgress(progress: UserProgress): Promise<void> {
  await storage.set({ childtype_progress: progress });
}

/** 保存练习结果 */
async function saveResult(result: PracticeResult): Promise<void> {
  try {
    const progress = await getProgress();

    if (result.wpm > progress.stats.bestWPM) {
      progress.stats.bestWPM = result.wpm;
    }
    if (result.accuracy > progress.stats.bestAccuracy) {
      progress.stats.bestAccuracy = result.accuracy;
    }
    progress.stats.totalPracticeTime += result.duration;

    const { getTodayISO, isStreakDay } = await import('../lib/utils');
    const today = getTodayISO();
    if (isStreakDay(progress.stats.lastPracticeDate)) {
      progress.stats.practiceStreak += 1;
    } else if (progress.stats.lastPracticeDate !== today) {
      progress.stats.practiceStreak = 1;
    }
    progress.stats.lastPracticeDate = today;

    progress.totalStars += result.stars;
    progress.levelExp += result.stars * 5;

    const { LEVELS } = await import('../lib/constants');
    const newLevel = LEVELS.reduce((acc, l) => {
      if (progress.levelExp >= l.minExp) return l;
      return acc;
    }, LEVELS[0]);
    progress.level = newLevel.title;

    // 检查并解锁成就
    const { checkNewAchievements } = await import('../data/achievements');
    const achResult = checkNewAchievements(progress, progress.achievements);
    if (achResult.newIds.length > 0) {
      progress.achievements.push(...achResult.newIds);
      console.log('新成就解锁:', achResult.newAchievements.map((a: any) => a.title).join(', '));
    }

    await saveProgress(progress);
  } catch (error) {
    console.error('[progressStore] saveResult 失败:', error);
  }
}

/** 标记课程完成 */
async function completeLesson(lessonId: string): Promise<void> {
  const progress = await getProgress();
  if (!progress.lessonsCompleted.includes(lessonId)) {
    progress.lessonsCompleted.push(lessonId);
  }
  await saveProgress(progress);
}

/** 标记关卡完成 */
async function completeLevel(level: number): Promise<void> {
  const progress = await getProgress();
  if (!progress.completedLevels.includes(level)) {
    progress.completedLevels.push(level);
    progress.currentLevel = Math.max(progress.currentLevel, level + 1);
  }
  await saveProgress(progress);
}

export const progressStore = {
  get: getProgress,
  save: saveProgress,
  saveResult,
  completeLesson,
  completeLevel,
};
