/**
 * 成就系统定义
 */
import type { AchievementDef, UserProgress } from '../lib/types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_type',
    title: '第一次打字',
    description: '完成第一次打字练习',
    icon: '🎯',
    condition: (p: UserProgress) => p.lessonsCompleted.length >= 1,
  },
  {
    id: 'ten_lessons',
    title: '勤奋练习',
    description: '完成 10 个课程',
    icon: '📚',
    condition: (p: UserProgress) => p.lessonsCompleted.length >= 10,
  },
  {
    id: 'thirty_lessons',
    title: '学习达人',
    description: '完成 30 个课程',
    icon: '🎓',
    condition: (p: UserProgress) => p.lessonsCompleted.length >= 30,
  },
  {
    id: 'wpm_20',
    title: '初速度',
    description: '打字速度达到 20 WPM',
    icon: '🐢',
    condition: (p: UserProgress) => p.stats.bestWPM >= 20,
  },
  {
    id: 'wpm_40',
    title: '中速度',
    description: '打字速度达到 40 WPM',
    icon: '🐇',
    condition: (p: UserProgress) => p.stats.bestWPM >= 40,
  },
  {
    id: 'wpm_60',
    title: '快速打字',
    description: '打字速度达到 60 WPM',
    icon: '🚀',
    condition: (p: UserProgress) => p.stats.bestWPM >= 60,
  },
  {
    id: 'wpm_80',
    title: '打字高手',
    description: '打字速度达到 80 WPM',
    icon: '⚡',
    condition: (p: UserProgress) => p.stats.bestWPM >= 80,
  },
  {
    id: 'wpm_100',
    title: '100 WPM 达人',
    description: '打字速度达到 100 WPM',
    icon: '🏆',
    condition: (p: UserProgress) => p.stats.bestWPM >= 100,
  },
  {
    id: 'accuracy_90',
    title: '精准打击',
    description: '单次准确率 90%+',
    icon: '🎯',
    condition: (p: UserProgress) => p.stats.bestAccuracy >= 90,
  },
  {
    id: 'accuracy_95',
    title: '完美无瑕',
    description: '单次准确率 95%+',
    icon: '💎',
    condition: (p: UserProgress) => p.stats.bestAccuracy >= 95,
  },
  {
    id: 'accuracy_100',
    title: '零失误',
    description: '单次准确率 100%',
    icon: '✨',
    condition: (p: UserProgress) => p.stats.bestAccuracy >= 100,
  },
  {
    id: 'streak_3',
    title: '连续三天',
    description: '连续练习 3 天',
    icon: '🔥',
    condition: (p: UserProgress) => p.stats.practiceStreak >= 3,
  },
  {
    id: 'streak_7',
    title: '每日练习者',
    description: '连续练习 7 天',
    icon: '🌟',
    condition: (p: UserProgress) => p.stats.practiceStreak >= 7,
  },
  {
    id: 'streak_30',
    title: '月度坚持',
    description: '连续练习 30 天',
    icon: '👑',
    condition: (p: UserProgress) => p.stats.practiceStreak >= 30,
  },
  {
    id: 'level_2',
    title: '打字学徒',
    description: '升级到打字学徒',
    icon: '📖',
    condition: (p: UserProgress) => p.level === '打字学徒',
  },
  {
    id: 'level_3',
    title: '打字能手',
    description: '升级到打字能手',
    icon: '📝',
    condition: (p: UserProgress) => p.level === '打字能手',
  },
  {
    id: 'level_4',
    title: '打字达人',
    description: '升级到打字达人',
    icon: '✍️',
    condition: (p: UserProgress) => p.level === '打字达人',
  },
  {
    id: 'level_5',
    title: '打字大师',
    description: '升级到打字大师',
    icon: '🏅',
    condition: (p: UserProgress) => p.level === '打字大师',
  },
  {
    id: 'total_100',
    title: '百星达成',
    description: '累计获得 100 颗星星',
    icon: '💫',
    condition: (p: UserProgress) => p.totalStars >= 100,
  },
  {
    id: 'total_500',
    title: '星光闪耀',
    description: '累计获得 500 颗星星',
    icon: '🌠',
    condition: (p: UserProgress) => p.totalStars >= 500,
  },
];

/** 检查并解锁新成就 */
export function checkNewAchievements(progress: UserProgress, unlocked: string[]): { newIds: string[]; newAchievements: AchievementDef[] } {
  const newIds: string[] = [];
  const newAchievements: AchievementDef[] = [];

  ACHIEVEMENTS.forEach((ach) => {
    if (unlocked.includes(ach.id)) return;
    if (ach.condition(progress)) {
      newIds.push(ach.id);
      newAchievements.push(ach);
    }
  });

  return { newIds, newAchievements };
}

/** 渲染成就列表 */
export function renderAchievements(progress: UserProgress): string {
  const unlocked = new Set(progress.achievements);
  let html = '<div class="achievements-grid">';

  ACHIEVEMENTS.forEach((ach) => {
    const isUnlocked = unlocked.has(ach.id);
    html += `
      <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" title="${isUnlocked ? ach.title : '🔒 未解锁'}">
        <div class="achievement-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="achievement-title">${ach.title}</div>
        <div class="achievement-desc">${ach.description}</div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}
