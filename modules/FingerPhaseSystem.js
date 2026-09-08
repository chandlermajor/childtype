/**
 * FingerPhaseSystem — 指法分阶段推进系统
 * 按熟练度（非按次数）判定阶段完成，触发阶段推进事件
 * @module modules/FingerPhaseSystem
 */

import store from './StorageManager.js';
import layouts from '../data/keyboard-layouts.js';
import { proficiencyScore } from './FingerProficiency.js';
import { DEFAULT_FINGER_PHASES, keysForPhase } from '../data/finger-phases.js';

class FingerPhaseSystem {
  constructor() {
    this._listeners = {};
  }

  /** 注册事件监听 */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  /** 触发事件 */
  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(fn => fn(data));
  }

  /**
   * 从 progress.fingerPhase 起遍历，返回第一个未满足的阶段 ID
   * @returns {Promise<number>} 阶段 ID
   */
  async getCurrentPhase() {
    const progress = await store.get('progress');
    let phase = progress.fingerPhase || 0;
    const phases = Object.keys(DEFAULT_FINGER_PHASES).map(Number).sort((a, b) => a - b);

    while (phase < phases[phases.length - 1]) {
      const nextId = phase + 1;
      const phaseDef = DEFAULT_FINGER_PHASES[nextId];
      if (!phaseDef) break;
      if (await this.phaseSatisfied(nextId)) {
        phase = nextId;
        continue;
      }
      break;
    }
    return phase;
  }

  /**
   * 判断某阶段是否满足（逐键熟练度达标 + 样本数达标，满足比例达标）
   * @param {number} phaseId
   * @returns {Promise<boolean>}
   */
  async phaseSatisfied(phaseId) {
    const phaseDef = DEFAULT_FINGER_PHASES[phaseId];
    if (!phaseDef) return false;

    const layoutName = (await store.get('settings'))?.keyboardLayout || 'QWERTY';
    const layout = layouts[layoutName] || layouts.QWERTY;
    const keys = keysForPhase(phaseDef, layoutName);
    if (!keys || keys.length === 0) return false;

    const keyProficiency = (await store.get('progress.keyProficiency')) || {};
    const require = phaseDef.require || {};
    const minKeys = require.minKeys || 1;
    const minSamples = require.minSamples || 0;
    const minScore = require.minScore || 0;
    const coverageRatio = require.coverageRatio || 1;

    const requiredCoverage = Math.ceil(keys.length * coverageRatio);
    let satisfied = 0;

    for (const key of keys) {
      const data = keyProficiency[key];
      if (!data) continue;
      const score = proficiencyScore(data);
      if (score >= minScore && (data.attempts || 0) >= minSamples) {
        satisfied++;
      }
    }

    return satisfied >= requiredCoverage;
  }

  /**
   * 若当前阶段满足条件则推进，并发 onPhaseAdvance 事件
   * @returns {Promise<number|null>} 新阶段 ID，或 null（未推进）
   */
  async advanceIfReady() {
    const current = await this.getCurrentPhase();
    const nextId = current + 1;
    const phaseDef = DEFAULT_FINGER_PHASES[nextId];

    if (!phaseDef) return null;
    if (!(await this.phaseSatisfied(nextId))) return null;

    await store.set('progress.fingerPhase', nextId);
    this._emit('onPhaseAdvance', {
      fromPhase: current,
      toPhase: nextId,
      phase: phaseDef
    });
    return nextId;
  }
}

export default new FingerPhaseSystem();
