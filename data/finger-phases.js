/**
 * 指法分阶段训练数据 / Finger Training Phase Definitions
 * 阶段键位不按硬编码，按 keyboard-layouts.js 的 fingerMap/rows 动态生成
 * 使 QWERTY 与 AZERTY 共用同一套逻辑
 * @module data/finger-phases
 */

import layouts from './keyboard-layouts.js';

/**
 * 根据 fingerMap 从所有键中筛选出属于给定手指集合的键
 * @param {Object} layout - 布局对象（含 fingerMap）
 * @param {string[]} fingers - 手指 ID 列表
 * @returns {string[]}
 */
function keysForFingers(layout, fingers) {
  const result = [];
  for (const key of Object.keys(layout.fingerMap)) {
    if (fingers.includes(layout.fingerMap[key])) {
      result.push(key);
    }
  }
  return result;
}

/**
 * 按列（单指列）生成键位
 * @param {Object} layout
 * @returns {string[]}
 */
function keysForColumns(layout) {
  const result = [];
  const rows = layout.rows;
  // 每列的键：index 0,1,2,3 分别对应不同手指的列
  for (let col = 0; col < rows[1].length; col++) {
    const colKeys = [];
    for (let r = 0; r < rows.length; r++) {
      if (col < rows[r].length) {
        const key = rows[r][col];
        if (key !== 'Space' && key !== 'Enter' && key !== 'Backspace' && key !== 'Shift') {
          colKeys.push(key);
        }
      }
    }
    if (colKeys.length > 0) result.push(colKeys.join(''));
  }
  return result;
}

/**
 * 单手往返 sequences（取左手或右手所有字母键）
 * @param {Object} layout
 * @returns {string[]}
 */
function keysForOneHand(layout) {
  const leftFingers = ['left-pinky', 'left-ring', 'left-middle', 'left-index'];
  const rightFingers = ['right-pinky', 'right-ring', 'right-middle', 'right-index'];
  const left = keysForFingers(layout, leftFingers).filter(k => k.length === 1);
  const right = keysForFingers(layout, rightFingers).filter(k => k.length === 1);
  const leftSeq = left.join('');
  const rightSeq = right.join('');
  return [leftSeq, rightSeq, left.concat(right).join('')];
}

/**
 * 双手混合 pairs（左右手指配对键位）
 * @param {Object} layout
 * @returns {string[]}
 */
function keysForBothHands(layout) {
  const leftIndex = keysForFingers(layout, ['left-index']);
  const rightIndex = keysForFingers(layout, ['right-index']);
  const pairs = [];
  for (let i = 0; i < Math.min(leftIndex.length, rightIndex.length); i++) {
    pairs.push((leftIndex[i] + rightIndex[i]).join(''));
  }
  return pairs.length ? pairs : [leftIndex.join(''), rightIndex.join('')];
}

/**
 * 上排（q-p 行）
 * @param {Object} layout
 * @returns {string[]}
 */
function keysForTopRow(layout) {
  return keysForFingers(layout, ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'right-index', 'right-middle', 'right-ring', 'right-pinky'])
    .filter(k => layout.rows[1] && layout.rows[1].includes(k));
}

/**
 * 下排 + 符号（z-m 行 + 符号键）
 * @param {Object} layout
 * @returns {string[]}
 */
function keysForBottomRow(layout) {
  const bottomLetters = keysForFingers(layout, ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'right-index', 'right-middle', 'right-ring', 'right-pinky'])
    .filter(k => layout.rows[3] && layout.rows[3].includes(k));
  const symbols = layout.rows[0] ? layout.rows[0].filter(k => k !== 'Space' && k !== 'Enter') : [];
  return [bottomLetters.join(''), symbols.join('')];
}

// 6 个阶段定义
const DEFAULT_FINGER_PHASES = {
  0: {
    id: 'home',
    name: '基准键',
    nameEn: 'Home Row',
    description: 'ASDF JKL; 基准键练习',
    keys: ['asdfjk;'],
    require: { minKeys: 4, minSamples: 15, minScore: 0.5, coverageRatio: 0.8 }
  },
  1: {
    id: 'single',
    name: '单指列',
    nameEn: 'Single Finger Columns',
    description: '逐列单指练习',
    keys: null,
    generate: (layout) => keysForColumns(layout).slice(0, 8),
    require: { minKeys: 4, minSamples: 15, minScore: 0.5, coverageRatio: 0.6 }
  },
  2: {
    id: 'onehand',
    name: '单手往返',
    nameEn: 'One Hand Back and Forth',
    description: '左手/右手往返练习',
    keys: null,
    generate: (layout) => keysForOneHand(layout),
    require: { minKeys: 6, minSamples: 20, minScore: 0.55, coverageRatio: 0.6 }
  },
  3: {
    id: 'both',
    name: '双手混合',
    nameEn: 'Both Hands Mixed',
    description: '左右手指配对练习',
    keys: null,
    generate: (layout) => keysForBothHands(layout),
    require: { minKeys: 6, minSamples: 20, minScore: 0.6, coverageRatio: 0.6 }
  },
  4: {
    id: 'top',
    name: '上排',
    nameEn: 'Top Row',
    description: 'q-p 上排练习',
    keys: null,
    generate: (layout) => keysForTopRow(layout),
    require: { minKeys: 6, minSamples: 20, minScore: 0.6, coverageRatio: 0.6 }
  },
  5: {
    id: 'bottom',
    name: '下排+符号',
    nameEn: 'Bottom Row + Symbols',
    description: 'z-m 下排与符号练习',
    keys: null,
    generate: (layout) => keysForBottomRow(layout),
    require: { minKeys: 8, minSamples: 25, minScore: 0.6, coverageRatio: 0.6 }
  }
};

/**
 * 获取某阶段在某布局下的键位列表
 * @param {Object} phase - 阶段定义
 * @param {string} layoutName - 布局名（QWERTY/AZERTY）
 * @returns {string[]}
 */
function keysForPhase(phase, layoutName = 'QWERTY') {
  const layout = layouts[layoutName] || layouts.QWERTY;
  if (typeof phase.keys === 'function') {
    return phase.keys(layout) || [];
  }
  if (phase.generate) {
    return phase.generate(layout) || [];
  }
  return Array.isArray(phase.keys) ? phase.keys : [];
}

export { DEFAULT_FINGER_PHASES, keysForPhase };
export default { DEFAULT_FINGER_PHASES, keysForPhase };
