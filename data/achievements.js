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
  },
  {
    id: 'phase_home',
    name: '基准稳固',
    nameEn: 'Home Row Master',
    description: '完成指法训练：基准键阶段',
    icon: '🏠',
    condition: { type: 'fingerPhase', threshold: 1 },
    experienceReward: 40
  },
  {
    id: 'phase_single',
    name: '单指有成',
    nameEn: 'Single Finger Pro',
    description: '完成指法训练：单指列阶段',
    icon: '👉',
    condition: { type: 'fingerPhase', threshold: 2 },
    experienceReward: 60
  },
  {
    id: 'phase_onehand',
    name: '单手娴熟',
    nameEn: 'One Hand Expert',
    description: '完成指法训练：单手往返阶段',
    icon: '🖐️',
    condition: { type: 'fingerPhase', threshold: 3 },
    experienceReward: 80
  },
  {
    id: 'phase_both',
    name: '双手协调',
    nameEn: 'Both Hands Coordinated',
    description: '完成指法训练：双手混合阶段',
    icon: '👐',
    condition: { type: 'fingerPhase', threshold: 4 },
    experienceReward: 100
  },
  {
    id: 'phase_top',
    name: '上排自如',
    nameEn: 'Top Row Fluent',
    description: '完成指法训练：上排阶段',
    icon: '⬆️',
    condition: { type: 'fingerPhase', threshold: 5 },
    experienceReward: 80
  },
  {
    id: 'phase_bottom',
    name: '下排+',
    nameEn: 'Bottom Row + Symbols',
    description: '完成指法训练：下排+符号阶段',
    icon: '⬇️',
    condition: { type: 'fingerPhase', threshold: 6 },
    experienceReward: 80
  },
  {
    id: 'wpm_70',
    name: '音速',
    nameEn: 'Sound Speed',
    description: 'WPM 达到 70',
    icon: '🚀',
    condition: { type: 'bestWPM', threshold: 70 },
    experienceReward: 120
  },
  {
    id: 'wpm_80',
    name: '极限速度',
    nameEn: 'Limit Breaker',
    description: 'WPM 达到 80',
    icon: '🏆',
    condition: { type: 'bestWPM', threshold: 80 },
    experienceReward: 180
  },
  {
    id: 'streak_100',
    name: '世纪连击',
    nameEn: 'Century Streak',
    description: '连续正确 100 个键',
    icon: '💥',
    condition: { type: 'maxStreak', threshold: 100 },
    experienceReward: 200
  },
  {
    id: 'perfect_50',
    name: '完美五十',
    nameEn: 'Perfect Fifty',
    description: '单次练习准确率 100%（至少 50 个键）',
    icon: '💎',
    condition: { type: 'perfectSession', threshold: 50 },
    experienceReward: 150
  },
  {
    id: 'perfect_100',
    name: '完美百击',
    nameEn: 'Perfect Century',
    description: '单次练习准确率 100%（至少 100 个键）',
    icon: '👑',
    condition: { type: 'perfectSession', threshold: 100 },
    experienceReward: 300
  },
  {
    id: 'thirty_minutes',
    name: '半小时',
    nameEn: 'Half Hour',
    description: '累计练习 30 分钟',
    icon: '⏳',
    condition: { type: 'totalMinutes', threshold: 30 },
    experienceReward: 80
  },
  {
    id: 'five_hours',
    name: '五小时',
    nameEn: 'Five Hours',
    description: '累计练习 300 分钟',
    icon: '🕰️',
    condition: { type: 'totalMinutes', threshold: 300 },
    experienceReward: 200
  },
  {
    id: 'ten_thousand_keys',
    name: '万击',
    nameEn: 'Ten Thousand',
    description: '累计按下 10000 个键',
    icon: '💪',
    condition: { type: 'totalKeystrokes', threshold: 10000 },
    experienceReward: 150
  },
  {
    id: 'hundred_thousand_keys',
    name: '十万击',
    nameEn: 'Hundred Thousand',
    description: '累计按下 100000 个键',
    icon: '🔥',
    condition: { type: 'totalKeystrokes', threshold: 100000 },
    experienceReward: 500
  },
  {
    id: 'level_15',
    name: '大师之路',
    nameEn: 'Master Path',
    description: '达到 Lv.15',
    icon: '🌟',
    condition: { type: 'level', threshold: 15 },
    experienceReward: 300
  },
  {
    id: 'level_20',
    name: '传奇',
    nameEn: 'Legend',
    description: '达到 Lv.20',
    icon: '🏅',
    condition: { type: 'level', threshold: 20 },
    experienceReward: 500
  },
  {
    id: 'fourteen_days',
    name: '双周坚持',
    nameEn: 'Fortnight Streak',
    description: '连续 14 天练习',
    icon: '📆',
    condition: { type: 'consecutiveDays', threshold: 14 },
    experienceReward: 200
  },
  {
    id: 'thirty_days',
    name: '月度达人',
    nameEn: 'Monthly Pro',
    description: '连续 30 天练习',
    icon: '🗓️',
    condition: { type: 'consecutiveDays', threshold: 30 },
    experienceReward: 400
  },
  {
    id: 'marathon',
    name: '马拉松',
    nameEn: 'Marathon',
    description: '累计练习 120 分钟',
    icon: '🏃',
    condition: { type: 'totalMinutes', threshold: 120 },
    experienceReward: 250
  },
  {
    id: 'speed_demon',
    name: '极速恶魔',
    nameEn: 'Speed Demon',
    description: '连续正确 200 个键',
    icon: '⚡',
    condition: { type: 'maxStreak', threshold: 200 },
    experienceReward: 350
  },
  {
    id: 'perfect_hour',
    name: '完美小时',
    nameEn: 'Perfect Hour',
    description: '单次练习准确率 100%（至少 120 个键）',
    icon: '💯',
    condition: { type: 'perfectSession', threshold: 120 },
    experienceReward: 400
  },
  {
    id: 'level_25',
    name: '宗师',
    nameEn: 'Grandmaster',
    description: '达到 Lv.25',
    icon: '🎖️',
    condition: { type: 'level', threshold: 25 },
    experienceReward: 800
  },
  {
    id: 'sixty_days',
    name: '两月坚持',
    nameEn: 'Bi-Monthly Streak',
    description: '连续 60 天练习',
    icon: '🎖️',
    condition: { type: 'consecutiveDays', threshold: 60 },
    experienceReward: 600
  },
  {
    id: 'total_keys_50k',
    name: '五万击',
    nameEn: 'Fifty Thousand',
    description: '累计按下 50000 个键',
    icon: '🏋️',
    condition: { type: 'totalKeystrokes', threshold: 50000 },
    experienceReward: 250
  },
  {
    id: 'speed_100',
    name: '百速',
    nameEn: 'Century Speed',
    description: 'WPM 达到 100',
    icon: '👑',
    condition: { type: 'bestWPM', threshold: 100 },
    experienceReward: 500
  }
];

export default ACHIEVEMENTS;
