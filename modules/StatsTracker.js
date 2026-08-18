/**
 * StatsTracker — 统计追踪模块
 * 实时统计、会话管理、每日历史记录
 * @module modules/StatsTracker
 */

import store from './StorageManager.js';

class StatsTracker {
  constructor() {
    this._listeners = {};
    this._liveStats = {
      wpm: 0,
      accuracy: 0,
      streak: 0,
      maxStreak: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      errors: 0,
      elapsedSeconds: 0,
      mode: 'letters'
    };
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(fn => fn(data));
  }

  startSession(mode) {
    this._liveStats = {
      wpm: 0,
      accuracy: 0,
      streak: 0,
      maxStreak: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      errors: 0,
      elapsedSeconds: 0,
      mode
    };
    this._emit('onStatsUpdate', { liveStats: this._liveStats });
  }

  update(stats) {
    Object.assign(this._liveStats, stats);
    this._emit('onStatsUpdate', { liveStats: this._liveStats });
  }

  getLiveStats() {
    return { ...this._liveStats };
  }

  async endSession() {
    const sessionStats = {
      ...this._liveStats,
      sessionDuration: this._liveStats.elapsedSeconds
    };

    const minutes = Math.round((sessionStats.sessionDuration / 60) * 10) / 10;
    const accuracy = this._liveStats.totalKeystrokes > 0
      ? Math.round(((this._liveStats.totalKeystrokes - this._liveStats.errors) / this._liveStats.totalKeystrokes) * 1000) / 10
      : 0;

    await store.update('progress', (current) => {
      const modeStats = { ...current.modeStats };
      const modeStat = modeStats[this._liveStats.mode] || { sessions: 0, bestWPM: 0, accuracy: 0, totalMinutes: 0 };
      modeStat.sessions += 1;
      modeStat.totalMinutes += minutes;
      modeStat.bestWPM = Math.max(modeStat.bestWPM, sessionStats.wpm);
      modeStat.accuracy = accuracy;
      modeStats[this._liveStats.mode] = modeStat;

      const newBestWPM = Math.max(current.bestWPM, sessionStats.wpm);

      return {
        ...current,
        modeStats,
        bestWPM: newBestWPM,
        totalKeystrokes: (current.totalKeystrokes || 0) + this._liveStats.totalKeystrokes,
        totalPracticeMinutes: (current.totalPracticeMinutes || 0) + minutes,
        dailyHistory: this._addToDailyHistory(current.dailyHistory || [], minutes, accuracy)
      };
    });

    this._emit('onSessionEnd', { sessionStats });
    return sessionStats;
  }

  getHistory(mode) {
    return store.get('progress').then(progress => {
      return (progress.dailyHistory || []).filter(h => h.date);
    });
  }

  getDailySummary(date) {
    return store.get('progress').then(progress => {
      const history = progress.dailyHistory || [];
      return history.find(h => h.date === date) || null;
    });
  }

  getWeeklySummary(startDate) {
    return store.get('progress').then(progress => {
      const history = progress.dailyHistory || [];
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const weekly = history.filter(h => {
        const d = new Date(h.date);
        return d >= start && d <= end;
      });

      const totalMinutes = weekly.reduce((sum, h) => sum + (h.minutes || 0), 0);
      const avgAccuracy = weekly.length > 0
        ? weekly.reduce((sum, h) => sum + (h.accuracy || 0), 0) / weekly.length
        : 0;

      return {
        startDate: startDate,
        endDate: end.toISOString().split('T')[0],
        totalMinutes: Math.round(totalMinutes * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        sessions: weekly.length,
        entries: weekly
      };
    });
  }

  _addToDailyHistory(history, minutes, accuracy) {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = history.findIndex(h => h.date === today);

    if (existingIndex >= 0) {
      const existing = history[existingIndex];
      existing.minutes = Math.round((existing.minutes + minutes) * 10) / 10;
      existing.accuracy = Math.round(
        ((existing.accuracy * (existing.minutes - minutes) + accuracy * minutes) / existing.minutes) * 10
      ) / 10;
    } else {
      history.push({ date: today, minutes, accuracy });
    }

    return history.filter(h => {
      const daysAgo = (Date.now() - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    });
  }
}

export default StatsTracker;
