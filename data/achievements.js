/**
 * 成就定义 / Achievement Definitions
 * @module data/achievements
 */

const ACHIEVEMENTS = [
  {
    id: 'first_key',
    name: '第一步',
    nameEn: 'First Step',
    description: '按下第一个键',
    icon: '🎯',
    condition: { type: 'totalKeystrokes', threshold: 1 },
    experienceReward: 10
  },
  {
    id: 'ten_keys',
    name: '初露锋芒',
    nameEn: 'Ten Keys',
    description: '累计按下 10 个键',
    icon: '🔑',
    condition: { type: 'totalKeystrokes', threshold: 10 },
    experienceReward: 15
  },
  {
    id: 'hundred_keys',
    name: '熟能生巧',
    nameEn: 'Hundred Keys',
    description: '累计按下 100 个键',
    icon: '🔨',
    condition: { type: 'totalKeystrokes', threshold: 100 },
    experienceReward: 30
  },
  {
    id: 'thousand_keys',
    name: '千锤百炼',
    nameEn: 'Thousand Keys',
    description: '累计按下 1000 个键',
    icon: '⚒️',
    condition: { type: 'totalKeystrokes', threshold: 1000 },
    experienceReward: 80
  },
  {
    id: 'streak_5',
    name: '小有连续',
    nameEn: 'Small Streak',
    description: '连续正确 5 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 5 },
    experienceReward: 20
  },
  {
    id: 'streak_10',
    name: '连击新手',
    nameEn: 'Streak Novice',
    description: '连续正确 10 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 10 },
    experienceReward: 25
  },
  {
    id: 'streak_25',
    name: '连击达人',
    nameEn: 'Streak Expert',
    description: '连续正确 25 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 25 },
    experienceReward: 50
  },
  {
    id: 'streak_50',
    name: '连击大师',
    nameEn: 'Streak Master',
    description: '连续正确 50 个键',
    icon: '🔥',
    condition: { type: 'maxStreak', threshold: 50 },
    experienceReward: 100
  },
  {
    id: 'wpm_10',
    name: '慢慢来',
    nameEn: 'Slow Start',
    description: 'WPM 达到 10',
    icon: '🐢',
    condition: { type: 'bestWPM', threshold: 10 },
    experienceReward: 20
  },
  {
    id: 'wpm_20',
    name: '渐入佳境',
    nameEn: 'Getting Going',
    description: 'WPM 达到 20',
    icon: '🚶',
    condition: { type: 'bestWPM', threshold: 20 },
    experienceReward: 30
  },
  {
    id: 'wpm_30',
    name: '速度入门',
    nameEn: 'Speed Starter',
    description: 'WPM 达到 30',
    icon: '⚡',
    condition: { type: 'bestWPM', threshold: 30 },
    experienceReward: 50
  },
  {
    id: 'wpm_40',
    name: '疾速如风',
    nameEn: 'Wind Speed',
    description: 'WPM 达到 40',
    icon: '💨',
    condition: { type: 'bestWPM', threshold: 40 },
    experienceReward: 75
  },
  {
    id: 'wpm_50',
    name: '风驰电掣',
    nameEn: 'Lightning Fast',
    description: 'WPM 达到 50',
    icon: '⚡',
    condition: { type: 'bestWPM', threshold: 50 },
    experienceReward: 100
  },
  {
    id: 'wpm_60',
    name: '键盘闪电',
    nameEn: 'Keyboard Lightning',
    description: 'WPM 达到 60',
    icon: '🌩️',
    condition: { type: 'bestWPM', threshold: 60 },
    experienceReward: 150
  },
  {
    id: 'perfect_20',
    name: '完美起步',
    nameEn: 'Perfect Start',
    description: '单次练习准确率 100%（至少 20 个键）',
    icon: '💯',
    condition: { type: 'perfectSession', threshold: 20 },
    experienceReward: 40
  },
  {
    id: 'minute_practice',
    name: '一分钟',
    nameEn: 'One Minute',
    description: '累计练习 1 分钟',
    icon: '⏱️',
    condition: { type: 'totalMinutes', threshold: 1 },
    experienceReward: 15
  },
  {
    id: 'ten_minutes',
    name: '十分钟',
    nameEn: 'Ten Minutes',
    description: '累计练习 10 分钟',
    icon: '⏲️',
    condition: { type: 'totalMinutes', threshold: 10 },
    experienceReward: 40
  },
  {
    id: 'hour_practice',
    name: '一小时',
    nameEn: 'One Hour',
    description: '累计练习 60 分钟',
    icon: '🕐',
    condition: { type: 'totalMinutes', threshold: 60 },
    experienceReward: 100
  },
  {
    id: 'level_5',
    name: '小有成就',
    nameEn: 'Little Achievement',
    description: '达到 Lv.5 句子达人',
    icon: '📋',
    condition: { type: 'level', threshold: 5 },
    experienceReward: 60
  },
  {
    id: 'level_10',
    name: '登峰造极',
    nameEn: 'Peak Performance',
    description: '达到 Lv.10 打字之神',
    icon: '🏅',
    condition: { type: 'level', threshold: 10 },
    experienceReward: 200
  },
  {
    id: 'all_modes',
    name: '全面发展',
    nameEn: 'Well Rounded',
    description: '体验所有练习模式',
    icon: '🎮',
    condition: { type: 'modesPlayed', threshold: 5 },
    experienceReward: 80
  },
  {
    id: 'seven_days',
    name: '一周坚持',
    nameEn: 'Week Streak',
    description: '连续 7 天练习',
    icon: '📅',
    condition: { type: 'consecutiveDays', threshold: 7 },
    experienceReward: 100
  }
];

export default ACHIEVEMENTS;
