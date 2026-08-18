/**
 * 常量定义
 */

import type { LevelDef } from './types';


/** 手指颜色映射 */
export const FINGER_COLORS: Record<string, string> = {
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

/** 等级表 */
export const LEVELS: LevelDef[] = [
  { title: '新手', minExp: 0 },
  { title: '打字学徒', minExp: 10 },
  { title: '打字能手', minExp: 50 },
  { title: '打字达人', minExp: 150 },
  { title: '打字大师', minExp: 300 },
];

/** 默认用户进度 */
export const DEFAULT_PROGRESS = {
  currentLevel: 1,
  completedLevels: [] as number[],
  lessonsCompleted: [] as string[],
  totalStars: 0,
  level: '新手',
  levelExp: 0,
  stats: {
    bestWPM: 0,
    bestAccuracy: 0,
    totalPracticeTime: 0,
    practiceStreak: 0,
    lastPracticeDate: '',
  },
  achievements: [] as string[],
  preferences: {
    fontSize: 24,
    theme: 'light' as const,
    soundEnabled: true,
  },
};

/** 默认字体大小选项 */
export const FONT_SIZES = [18, 20, 24, 28, 32, 36];

/** 键盘布局数据（QWERTY 标准） */
export const KEYBOARD_ROWS: string[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'"],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
  ['Space'],
];

/** 键到手指的映射（QWERTY 标准指法） */
export const FINGER_MAP: Record<string, string> = {
  // 第一行
  '`': 'left-pinky', '1': 'left-pinky', 'q': 'left-pinky', 'Q': 'left-pinky',
  '-': 'left-pinky', '=': 'left-pinky',
  '2': 'left-ring', 'w': 'left-ring', 'W': 'left-ring',
  '3': 'left-middle', 'e': 'left-middle', 'E': 'left-middle',
  '4': 'left-index', 'r': 'left-index', 'R': 'left-index',
  '5': 'left-index', 't': 'left-index', 'T': 'left-index',
  '6': 'right-index', 'y': 'right-index', 'Y': 'right-index',
  '7': 'right-index', 'u': 'right-index', 'U': 'right-index',
  '8': 'right-middle', 'i': 'right-middle', 'I': 'right-middle',
  '9': 'right-ring', 'o': 'right-ring', 'O': 'right-ring',
  '0': 'right-pinky', 'p': 'right-pinky', 'P': 'right-pinky',
  '[': 'right-pinky', ']': 'right-pinky',
  '\\': 'right-pinky',

  // 第二行 Home Row
  'a': 'left-pinky', 'A': 'left-pinky',
  's': 'left-ring', 'S': 'left-ring',
  'd': 'left-middle', 'D': 'left-middle',
  'f': 'left-index', 'F': 'left-index',
  'g': 'left-index', 'G': 'left-index',
  'h': 'right-index', 'H': 'right-index',
  'j': 'right-index', 'J': 'right-index',
  'k': 'right-middle', 'K': 'right-middle',
  'l': 'right-ring', 'L': 'right-ring',
  ';': 'right-pinky',
  "'": 'right-pinky',

  // 第三行
  'z': 'left-pinky', 'Z': 'left-pinky',
  'x': 'left-ring', 'X': 'left-ring',
  'c': 'left-middle', 'C': 'left-middle',
  'v': 'left-index', 'V': 'left-index',
  'b': 'left-index', 'B': 'left-index',
  'n': 'right-index', 'N': 'right-index',
  'm': 'right-index', 'M': 'right-index',
  ',': 'right-middle',
  '.': 'right-ring',
  '/': 'right-pinky',

  // 空格
  ' ': 'thumb',
};
