/**
 * 类型定义
 */

/** 手指映射：每个键对应的手指 */
export type Finger = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';

/** 手指颜色映射 */
export const FINGER_COLORS: Record<Finger, string> = {
  'left-pinky':    '#FF6B6B',
  'left-ring':     '#FF8E8E',
  'left-middle':   '#FFB4B4',
  'left-index':    '#FFD4D4',
  'right-index':   '#74B9FF',
  'right-middle':  '#A8D4FF',
  'right-ring':    '#CCE5FF',
  'right-pinky':   '#E0F0FF',
  'thumb':         '#FFEAA7',
};

/** 手指名称（中文） */
export const FINGER_LABELS: Record<Finger, string> = {
  'left-pinky':    '左手小指',
  'left-ring':     '左手无名指',
  'left-middle':   '左手中指',
  'left-index':    '左手食指',
  'right-index':   '右手食指',
  'right-middle':  '右手中指',
  'right-ring':    '右手无名指',
  'right-pinky':   '右手小指',
  'thumb':         '拇指',
};

/** 键盘键定义 */
export interface KeyDef {
  char: string;          // 显示字符
  key: string;           // 物理键名
  finger: Finger;
  row: number;           // 行号
}

/** 练习模式 */
export type PracticeMode = 'lesson' | 'free' | 'timed' | 'challenge';

/** 计时器时长 */
export type TimedDuration = 15 | 30 | 60;

/** 课程数据 */
export interface Lesson {
  id: string;
  level: number;
  title: string;
  text: string;
  description?: string;
}

/** 练习成绩 */
export interface PracticeResult {
  mode: PracticeMode;
  wpm: number;
  accuracy: number;
  duration: number;      // 秒
  stars: number;         // 1-3
  date: string;          // ISO 日期
  lessonId?: string;
}

/** 成就定义 */
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (progress: UserProgress) => boolean;
}

/** 用户进度 */
export interface UserProgress {
  currentLevel: number;
  completedLevels: number[];
  lessonsCompleted: string[];
  totalStars: number;
  level: string;
  levelExp: number;
  stats: {
    bestWPM: number;
    bestAccuracy: number;
    totalPracticeTime: number;
    practiceStreak: number;
    lastPracticeDate: string;
  };
  achievements: string[];
  preferences: {
    fontSize: number;
    theme: 'light' | 'dark';
    soundEnabled: boolean;
  };
}

/** 等级定义 */
export interface LevelDef {
  title: string;
  minExp: number;
}

/** 练习状态（打字时实时跟踪） */
export interface TypingState {
  currentIndex: number;    // 当前字符索引
  correctCount: number;
  wrongCount: number;
  startTime: number;       // 首次按键时间戳
  endTime: number;         // 结束时间戳
  isComplete: boolean;
}
