/**
 * 字母练习 8 阶段训练数据 / Letter Practice Phase Definitions
 * 按「键位范围 + 组合规则」双递进，难度随阶段自动提升
 * 支持 QWERTY 与 AZERTY（通过 fingerMap 动态生成组合）
 * @module data/letter-phases
 */

import layouts from './keyboard-layouts.js';

/**
 * 从 fingerMap 中按手指筛选出所有单字符键
 * @param {Object} layout
 * @param {string[]} fingers 手指 ID 列表
 * @returns {string[]}
 */
function keysByFingers(layout, fingers) {
  const result = [];
  for (const key of Object.keys(layout.fingerMap)) {
    if (fingers.includes(layout.fingerMap[key]) && key.length === 1) {
      result.push(key);
    }
  }
  return result;
}

/**
 * 生成单指列（某一手指负责的垂直列，不含功能键）
 * @param {Object} layout
 * @returns {Object} key: fingerId -> keys[]
 */
function columnsByFingers(layout) {
  const result = {};
  const fingers = [
    'left-pinky', 'left-ring', 'left-middle', 'left-index',
    'right-index', 'right-middle', 'right-ring', 'right-pinky'
  ];
  for (const finger of fingers) {
    const cols = keysByFingers(layout, [finger]);
    if (cols.length > 0) result[finger] = cols;
  }
  return result;
}

/**
 * 生成「同指相邻上下键」组合（如 s->w, d->e）
 * 用于阶段 1、2 的逐指扩展
 * @param {Object} layout
 * @returns {string[]}
 */
function sameFingerAdjacent(layout) {
  const topRow = layout.rows[1];
  const homeRow = layout.rows[2];
  const bottomRow = layout.rows[3];
  const seq = [];
  for (let r = 0; r < homeRow.length; r++) {
    const home = homeRow[r];
    const top = topRow[r];
    const bottom = bottomRow[r];
    if (top) seq.push(home + top);
    if (bottom) seq.push(home + bottom);
  }
  return seq;
}

/**
 * 生成逐阶段字母表（0..n 的字母）
 * @param {number} count 字母数量 (1-26)
 * @returns {string}
 */
function alphabetPrefix(count) {
  return 'abcdefghijklmnopqrstuvwxyz'.slice(0, Math.max(0, Math.min(26, count)));
}

// 8 个阶段定义：键位范围 + 组合规则双递进
// 数字与符号跨多阶段逐步引入，避免难度悬崖
const LETTER_PHASES = [
  {
    id: 0,
    name: '基准键',
    nameEn: 'Home Row',
    keys: 'asdfjk;',
    combine: 'same',
    batchSize: 10,
    describe: 'ASDF JKL; 基准键单键重复与左右互换',
    require: { accuracy: 0.85, wpm: 12, minBatches: 1 }
  },
  {
    id: 1,
    name: '同指相邻',
    nameEn: 'Same Finger Adjacent',
    keys: 'asdfjk;qwertyuiop',
    combine: 'adjacent',
    batchSize: 12,
    describe: '基准键 + 上排，同指上下相邻组合',
    require: { accuracy: 0.85, wpm: 14, minBatches: 1 }
  },
  {
    id: 2,
    name: '单指列',
    nameEn: 'Single Finger Columns',
    keys: 'asdfjk;qwertyuiopzxcvbnm',
    combine: 'columns',
    batchSize: 14,
    describe: '加入下排，逐列单指往返练习',
    require: { accuracy: 0.85, wpm: 16, minBatches: 1 }
  },
  {
    id: 3,
    name: '跨指相邻',
    nameEn: 'Cross Finger Adjacent',
    keys: 'asdfjk;qwertyuiopzxcvbnm',
    combine: 'cross',
    batchSize: 16,
    describe: '前两排全键，跨指相邻组合，左右手交替',
    require: { accuracy: 0.85, wpm: 18, minBatches: 1 }
  },
  {
    id: 4,
    name: '双指配对·入门数字',
    nameEn: 'Two-Hand Pairs · Intro Numbers',
    keys: 'abcdefghijklmnopqrstuvwxyz1234',
    combine: 'pairs',
    batchSize: 16,
    describe: '全字母左右手配对 + 数字 1234 逐步引入',
    require: { accuracy: 0.85, wpm: 20, minBatches: 1 }
  },
  {
    id: 5,
    name: '随机字母·进阶数字',
    nameEn: 'Random Letters · More Numbers',
    keys: 'abcdefghijklmnopqrstuvwxyz1234567890',
    combine: 'random',
    batchSize: 16,
    describe: '全字母乱序 + 全数字行 0-9',
    require: { accuracy: 0.85, wpm: 22, minBatches: 1 }
  },
  {
    id: 6,
    name: '字母数字·常用符号',
    nameEn: 'Letters + Numbers · Common Symbols',
    keys: 'abcdefghijklmnopqrstuvwxyz1234567890-=[]\\;:\'',
    combine: 'random',
    batchSize: 20,
    describe: '字母数字 + 常用符号 -=[]\\;\' 引入',
    require: { accuracy: 0.88, wpm: 25, minBatches: 1 }
  },
  {
    id: 7,
    name: '全键盘',
    nameEn: 'Full Keyboard',
    keys: 'abcdefghijklmnopqrstuvwxyz1234567890-=[]\\;:\'.,/\`',
    combine: 'random',
    batchSize: 24,
    describe: '全键位连续随机，含所有符号',
    require: { accuracy: 0.88, wpm: 28, minBatches: 1 }
  }
];

/**
 * 获取某阶段定义
 * @param {number} id 阶段 id (0-7)
 * @returns {Object|null}
 */
function getPhase(id) {
  return LETTER_PHASES[id] || null;
}

/**
 * 获取阶段总数
 * @returns {number}
 */
function phaseCount() {
  return LETTER_PHASES.length;
}

/**
 * 生成某阶段在某布局下的批次字母（按组合规则）
 * @param {number} phaseId 阶段 id
 * @param {string} layoutName QWERTY/AZERTY
 * @param {number} count 需要生成的字母数量
 * @returns {string[]}
 */
function generateBatchKeys(phaseId, layoutName = 'QWERTY', count = 16) {
  const phase = LETTER_PHASES[phaseId];
  if (!phase) return [];
  const layout = layouts[layoutName] || layouts.QWERTY;
  const result = [];

  // 收集阶段允许的键位集合
  const keySet = new Set(phase.keys.toLowerCase());

  switch (phase.combine) {
    case 'same': {
      // 单键重复 + 左右手互换（asdf <-> jkl;），加入随机顺序
      const home = layout.rows[2];
      const left = home.slice(0, 4);   // asdf
      const right = home.slice(4, 8);  // jkl;
      const pool = [...left, ...right];
      for (let i = 0; i < count; i++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      break;
    }

    case 'adjacent': {
      // 同指相邻上下组合
      const seq = sameFingerAdjacent(layout);
      for (let i = 0; i < count; i++) {
        const pair = seq[Math.floor(Math.random() * seq.length)];
        result.push(pair[Math.floor(Math.random() * pair.length)]);
      }
      break;
    }

    case 'columns': {
      // 单指列往返
      const cols = columnsByFingers(layout);
      const allCols = Object.values(cols).flat();
      for (let i = 0; i < count; i++) {
        const col = allCols[Math.floor(Math.random() * allCols.length)];
        result.push(col[Math.floor(Math.random() * col.length)]);
      }
      break;
    }

    case 'cross': {
      // 跨指相邻：左右手按键交替 + 上排按键，全部随机抽取
      const home = layout.rows[2];
      const left = home.slice(0, 4);
      const right = home.slice(4, 8);
      const pool = [...left, ...right, ...layout.rows[1]];
      for (let i = 0; i < count; i++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      break;
    }

    case 'pairs': {
      // 左右手指配对（左手键 + 右手键随机组合）
      const left = keysByFingers(layout, ['left-pinky', 'left-ring', 'left-middle', 'left-index']);
      const right = keysByFingers(layout, ['right-index', 'right-middle', 'right-ring', 'right-pinky']);
      const pool = [...left, ...right];
      for (let i = 0; i < count; i++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      break;
    }

    case 'random':
    default: {
      // 全随机（从键位集合中抽取）
      const pool = Array.from(keySet);
      for (let i = 0; i < count; i++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      break;
    }
  }

  return result.slice(0, count);
}

export {
  LETTER_PHASES,
  getPhase,
  phaseCount,
  generateBatchKeys,
  columnsByFingers,
  sameFingerAdjacent
};

export default {
  LETTER_PHASES,
  getPhase,
  phaseCount,
  generateBatchKeys,
  columnsByFingers,
  sameFingerAdjacent
};
