/* StudyNet — shared data layer and utilities */
(function (global) {
  'use strict';

  const SN = (global.SN = global.SN || {});
  SN.VERSION = '1.0.1';

  const KEYS = {
    config: 'studynet.config.v1',
    profile: 'studynet.profile.v1',
    tasks: 'studynet.tasks.v1',
    mistakes: 'studynet.mistakes.v1',
    sessions: 'studynet.sessions.v1',
    chats: 'studynet.chats.v1',
    timer: 'studynet.timer.v1',
    reports: 'studynet.reports.v1',
    meta: 'studynet.meta.v1'
  };
  SN.KEYS = KEYS;

  const SUBJECTS = [
    { id: 'chinese', name: '语文', short: '语', color: '#e86657', soft: '#ffede8', ink: '#a84135' },
    { id: 'math', name: '数学', short: '数', color: '#3157f5', soft: '#e9edff', ink: '#203fc0' },
    { id: 'english', name: '英语', short: '英', color: '#159a80', soft: '#e2f7f0', ink: '#0e705d' },
    { id: 'physics', name: '物理', short: '物', color: '#7a5be0', soft: '#f0ecff', ink: '#5a3fbc' },
    { id: 'chemistry', name: '化学', short: '化', color: '#c78315', soft: '#fff3d8', ink: '#985f08' },
    { id: 'politics', name: '道法', short: '道', color: '#bf568a', soft: '#fbeaf3', ink: '#963a67' },
    { id: 'history', name: '历史', short: '史', color: '#9a693c', soft: '#f7ede3', ink: '#754b26' },
    { id: 'geography', name: '地理', short: '地', color: '#3b89a8', soft: '#e6f3f8', ink: '#26677f' },
    { id: 'biology', name: '生物', short: '生', color: '#4a9642', soft: '#eaf6e7', ink: '#34702e' },
    { id: 'other', name: '其他', short: '其', color: '#6b7280', soft: '#f0f1f3', ink: '#4b5563' }
  ];
  const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
  SN.SUBJECTS = SUBJECTS;
  SN.SUBJECT_MAP = SUBJECT_MAP;

  const PROVIDERS = {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      note: '国内直连 · 性价比高',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      models: ['deepseek-chat', 'deepseek-reasoner']
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      note: 'GPT 系列 · 需可访问网络',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini']
    },
    custom: {
      id: 'custom',
      name: '自定义接口',
      note: '任意 OpenAI 兼容接口',
      baseUrl: '',
      model: '',
      models: []
    }
  };
  SN.PROVIDERS = PROVIDERS;

  const ERROR_TYPES = ['概念不清', '审题失误', '计算错误', '方法不会', '记忆不牢', '粗心大意', '时间不足', '其他'];
  const TASK_TYPES = ['作业', '复习', '预习', '练习', '背诵', '整理'];
  const PRIORITIES = [
    { id: 'high', name: '重要', color: '#e86657' },
    { id: 'medium', name: '普通', color: '#3157f5' },
    { id: 'low', name: '轻松', color: '#159a80' }
  ];
  SN.ERROR_TYPES = ERROR_TYPES;
  SN.TASK_TYPES = TASK_TYPES;
  SN.PRIORITIES = PRIORITIES;

  const DEFAULT_CONFIG = {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: '',
    temperature: 0.5,
    maxTokens: 1800,
    streaming: true,
    route: 'auto',
    configuredAt: null,
    lastTest: null,
    lastTestAt: null
  };

  const DEFAULT_PROFILE = {
    name: '',
    grade: '八年级',
    dailyMinutes: 90,
    goal: '',
    setupComplete: false,
    createdAt: null
  };

  /* ------------------------------------------------------------------ */
  /* Utilities                                                          */
  /* ------------------------------------------------------------------ */

  const pad2 = (n) => String(n).padStart(2, '0');

  function uid(prefix) {
    const rand =
      global.crypto && typeof global.crypto.randomUUID === 'function'
        ? global.crypto.randomUUID().replace(/-/g, '').slice(0, 12)
        : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    return `${prefix || 'id'}_${rand}`;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, Number(n) || 0));
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function dateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function addDays(keyOrDate, days) {
    const d = typeof keyOrDate === 'string' ? parseDateKey(keyOrDate) : new Date(keyOrDate);
    d.setDate(d.getDate() + Number(days || 0));
    return typeof keyOrDate === 'string' ? dateKey(d) : d;
  }

  function daysBetween(fromKey, toKey) {
    const a = parseDateKey(fromKey);
    const b = parseDateKey(toKey);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }

  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

  function weekdayCN(key) {
    return WEEKDAYS[parseDateKey(key).getDay()];
  }

  function formatDateCN(key, withYear) {
    const d = typeof key === 'string' ? parseDateKey(key) : key;
    const now = new Date();
    const year = withYear === false ? '' : `${d.getFullYear()}年`;
    return `${year}${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function formatDateFull(key) {
    const d = typeof key === 'string' ? parseDateKey(key) : key;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`;
  }

  function relativeDate(key) {
    if (!key) return '未安排';
    const diff = daysBetween(todayKey(), key);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === 2) return '后天';
    if (diff === -1) return '昨天';
    if (diff === -2) return '前天';
    if (diff > 2 && diff < 7) return `${diff} 天后`;
    if (diff < -2 && diff > -7) return `逾期 ${Math.abs(diff)} 天`;
    return `${parseDateKey(key).getMonth() + 1}月${parseDateKey(key).getDate()}日`;
  }

  function greeting(date) {
    const h = (date || new Date()).getHours();
    if (h >= 5 && h < 11) return '早上好';
    if (h >= 11 && h < 14) return '中午好';
    if (h >= 14 && h < 18) return '下午好';
    return '晚上好';
  }

  function formatDuration(minutes, compact) {
    const m = Math.max(0, Math.round(Number(minutes) || 0));
    if (m < 60) return compact ? `${m}m` : `${m} 分钟`;
    const h = Math.floor(m / 60);
    const rest = m % 60;
    if (compact) return rest ? `${h}h${rest}m` : `${h}h`;
    return rest ? `${h} 小时 ${rest} 分` : `${h} 小时`;
  }

  function formatClock(seconds) {
    const s = Math.max(0, Math.round(seconds));
    return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function truncate(text, len) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    if (s.length <= len) return s;
    return `${s.slice(0, Math.max(1, len - 1))}…`;
  }

  function stripMarkdown(text) {
    return String(text || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_~$]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function debounce(fn, wait) {
    let timer = 0;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function sum(list, pick) {
    return (list || []).reduce((total, item) => total + (pick ? Number(pick(item)) || 0 : Number(item) || 0), 0);
  }

  function groupBy(list, pick) {
    return (list || []).reduce((map, item) => {
      const key = typeof pick === 'function' ? pick(item) : item[pick];
      (map[key] || (map[key] = [])).push(item);
      return map;
    }, {});
  }

  function sortBy(list, pick, direction) {
    const dir = direction === 'desc' ? -1 : 1;
    return [...(list || [])].sort((a, b) => {
      const av = typeof pick === 'function' ? pick(a) : a[pick];
      const bv = typeof pick === 'function' ? pick(b) : b[pick];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    });
  }

  function safeUrl(url) {
    try {
      const u = new URL(url, global.location.href);
      if (['http:', 'https:'].includes(u.protocol)) return u.href;
    } catch (_) {}
    return '';
  }

  function subject(id) {
    return SUBJECT_MAP[id] || SUBJECT_MAP.other;
  }

  function subjectByName(name) {
    return SUBJECTS.find((s) => s.name === name || s.id === name) || SUBJECT_MAP.other;
  }

  function priority(id) {
    return PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];
  }

  function taskEnd(task) {
    if (!task || !task.start) return '';
    const [h, m] = String(task.start).split(':').map(Number);
    const total = (h || 0) * 60 + (m || 0) + (Number(task.duration) || 0);
    return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
  }

  function greetingName(profile) {
    const name = (profile && profile.name) || '同学';
    return name.length > 6 ? `${name.slice(0, 6)}…` : name;
  }

  const randomId = uid;

  /* ------------------------------------------------------------------ */
  /* Storage                                                            */
  /* ------------------------------------------------------------------ */

  function readRaw(key, fallback) {
    try {
      const raw = global.localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[StudyNet] 读取本地数据失败', key, err);
      return fallback;
    }
  }

  function writeRaw(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[StudyNet] 写入本地数据失败', key, err);
      if (SN.UI && SN.UI.toast) {
        SN.UI.toast('本地存储空间不足，请先导出并清理旧数据。', 'error');
      }
      return false;
    }
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeTask(task) {
    return {
      id: task.id || uid('task'),
      title: String(task.title || '未命名任务').trim().slice(0, 120),
      subject: SUBJECT_MAP[task.subject] ? task.subject : 'other',
      date: task.date || todayKey(),
      start: task.start || '19:00',
      duration: clamp(task.duration || 30, 5, 300),
      type: TASK_TYPES.includes(task.type) ? task.type : '作业',
      priority: PRIORITIES.some((p) => p.id === task.priority) ? task.priority : 'medium',
      notes: String(task.notes || '').slice(0, 500),
      done: Boolean(task.done),
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt || null,
      source: task.source || 'manual'
    };
  }

  function normalizeMistake(item) {
    const review = item.review || {};
    return {
      id: item.id || uid('wrong'),
      title: String(item.title || '未命名错题').trim().slice(0, 120),
      subject: SUBJECT_MAP[item.subject] ? item.subject : 'other',
      source: String(item.source || '作业').slice(0, 40),
      question: String(item.question || '').slice(0, 6000),
      myAnswer: String(item.myAnswer || '').slice(0, 3000),
      correctAnswer: String(item.correctAnswer || '').slice(0, 4000),
      reason: String(item.reason || '').slice(0, 1000),
      errorType: ERROR_TYPES.includes(item.errorType) ? item.errorType : '概念不清',
      knowledgePoints: asArray(item.knowledgePoints).map(String).filter(Boolean).slice(0, 12),
      difficulty: clamp(item.difficulty || 3, 1, 5),
      tags: asArray(item.tags).map(String).filter(Boolean).slice(0, 8),
      starred: Boolean(item.starred),
      mastery: clamp(item.mastery == null ? 20 : item.mastery, 0, 100),
      review: {
        level: clamp(review.level == null ? 0 : review.level, 0, 5),
        count: clamp(review.count || 0, 0, 999),
        last: review.last || null,
        next: review.next || addDays(todayKey(), 1),
        history: asArray(review.history).slice(-30)
      },
      ai: item.ai || null,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    };
  }

  const Store = {
    readRaw,
    writeRaw,

    config() {
      return Object.assign({}, DEFAULT_CONFIG, readRaw(KEYS.config, {}) || {});
    },

    saveConfig(patch) {
      const next = Object.assign({}, this.config(), patch || {});
      next.temperature = clamp(next.temperature, 0, 1.4);
      next.maxTokens = clamp(next.maxTokens, 256, 8000);
      if (!next.configuredAt && next.apiKey) next.configuredAt = new Date().toISOString();
      writeRaw(KEYS.config, next);
      SN.bus.emit('config:changed', next);
      return next;
    },

    hasApiKey() {
      return Boolean(String(this.config().apiKey || '').trim());
    },

    profile() {
      return Object.assign({}, DEFAULT_PROFILE, readRaw(KEYS.profile, {}) || {});
    },

    saveProfile(patch) {
      const next = Object.assign({}, this.profile(), patch || {});
      if (!next.createdAt) next.createdAt = new Date().toISOString();
      writeRaw(KEYS.profile, next);
      SN.bus.emit('profile:changed', next);
      return next;
    },

    tasks() {
      return asArray(readRaw(KEYS.tasks, [])).map(normalizeTask);
    },

    saveTasks(list) {
      const next = asArray(list).map(normalizeTask);
      writeRaw(KEYS.tasks, next);
      SN.bus.emit('tasks:changed', next);
      return next;
    },

    tasksOn(date) {
      return this.tasks()
        .filter((t) => t.date === date)
        .sort((a, b) => `${a.done ? 1 : 0}${a.start}`.localeCompare(`${b.done ? 1 : 0}${b.start}`));
    },

    addTask(task) {
      const list = this.tasks();
      const item = normalizeTask(task);
      list.push(item);
      this.saveTasks(list);
      return item;
    },

    updateTask(id, patch) {
      const list = this.tasks();
      const index = list.findIndex((t) => t.id === id);
      if (index < 0) return null;
      list[index] = normalizeTask(Object.assign({}, list[index], patch, { id }));
      this.saveTasks(list);
      return list[index];
    },

    removeTask(id) {
      this.saveTasks(this.tasks().filter((t) => t.id !== id));
    },

    toggleTask(id) {
      const list = this.tasks();
      const index = list.findIndex((t) => t.id === id);
      if (index < 0) return null;
      const done = !list[index].done;
      list[index] = normalizeTask(
        Object.assign({}, list[index], {
          done,
          completedAt: done ? new Date().toISOString() : null
        })
      );
      this.saveTasks(list);
      if (done) {
        SN.bus.emit('activity', { type: 'task', subject: list[index].subject });
      }
      return list[index];
    },

    mistakes() {
      return asArray(readRaw(KEYS.mistakes, [])).map(normalizeMistake);
    },

    saveMistakes(list) {
      const next = asArray(list).map(normalizeMistake);
      writeRaw(KEYS.mistakes, next);
      SN.bus.emit('mistakes:changed', next);
      return next;
    },

    addMistake(item) {
      const list = this.mistakes();
      const next = normalizeMistake(item);
      list.unshift(next);
      this.saveMistakes(list);
      return next;
    },

    updateMistake(id, patch) {
      const list = this.mistakes();
      const index = list.findIndex((m) => m.id === id);
      if (index < 0) return null;
      list[index] = normalizeMistake(
        Object.assign({}, list[index], patch, { id, updatedAt: new Date().toISOString() })
      );
      this.saveMistakes(list);
      return list[index];
    },

    removeMistake(id) {
      this.saveMistakes(this.mistakes().filter((m) => m.id !== id));
    },

    dueMistakes(date) {
      const key = date || todayKey();
      return this.mistakes()
        .filter((m) => m.mastery < 100 && m.review.next <= key)
        .sort((a, b) => a.review.next.localeCompare(b.review.next));
    },

    reviewMistake(id, rating) {
      const list = this.mistakes();
      const index = list.findIndex((m) => m.id === id);
      if (index < 0) return null;
      const item = list[index];
      const intervals = [1, 2, 4, 7, 15, 30];
      let level = Number(item.review.level) || 0;
      let mastery = Number(item.mastery) || 0;
      let days = 1;
      if (rating === 'again') {
        level = 0;
        mastery = Math.max(0, mastery - 12);
        days = 1;
      } else if (rating === 'hard') {
        level = Math.max(0, level - 1);
        mastery = Math.min(100, mastery + 6);
        days = level === 0 ? 1 : Math.max(2, intervals[level] - 1);
      } else {
        level = Math.min(intervals.length - 1, level + 1);
        mastery = Math.min(100, mastery + 16);
        days = intervals[level] || 30;
      }
      const now = todayKey();
      const next = Object.assign({}, item, {
        mastery,
        review: {
          level,
          count: (Number(item.review.count) || 0) + 1,
          last: now,
          next: addDays(now, days),
          history: [
            ...(item.review.history || []),
            { date: new Date().toISOString(), rating, mastery, level }
          ].slice(-30)
        },
        updatedAt: new Date().toISOString()
      });
      list[index] = normalizeMistake(next);
      this.saveMistakes(list);
      return list[index];
    },

    sessions() {
      return asArray(readRaw(KEYS.sessions, []));
    },

    saveSessions(list) {
      writeRaw(KEYS.sessions, asArray(list).slice(-1000));
      SN.bus.emit('sessions:changed');
    },

    addSession(session) {
      const item = {
        id: session.id || uid('focus'),
        minutes: clamp(session.minutes || 0, 1, 600),
        subject: SUBJECT_MAP[session.subject] ? session.subject : 'other',
        date: session.date || todayKey(),
        startedAt: session.startedAt || new Date().toISOString(),
        endedAt: session.endedAt || new Date().toISOString(),
        mode: session.mode || 'focus'
      };
      const list = this.sessions();
      list.push(item);
      this.saveSessions(list);
      return item;
    },

    timer() {
      return readRaw(KEYS.timer, null);
    },

    saveTimer(state) {
      writeRaw(KEYS.timer, state);
    },

    chats() {
      return asArray(readRaw(KEYS.chats, []));
    },

    saveChats(list) {
      const next = asArray(list)
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        .slice(0, 40);
      writeRaw(KEYS.chats, next);
      SN.bus.emit('chats:changed');
      return next;
    },

    getChat(id) {
      return this.chats().find((c) => c.id === id) || null;
    },

    saveChat(chat) {
      const list = this.chats();
      const index = list.findIndex((c) => c.id === chat.id);
      const next = Object.assign({}, chat, {
        updatedAt: new Date().toISOString(),
        messages: asArray(chat.messages).slice(-120)
      });
      if (index < 0) list.unshift(next);
      else list[index] = next;
      this.saveChats(list);
      return next;
    },

    removeChat(id) {
      this.saveChats(this.chats().filter((c) => c.id !== id));
    },

    reports() {
      return asArray(readRaw(KEYS.reports, []));
    },

    addReport(report) {
      const list = this.reports();
      list.unshift(Object.assign({ id: uid('report'), createdAt: new Date().toISOString() }, report));
      writeRaw(KEYS.reports, list.slice(0, 20));
      return list[0];
    },

    dayStats(date) {
      const key = date || todayKey();
      const tasks = this.tasksOn(key);
      const doneTasks = tasks.filter((t) => t.done);
      const focus = this.sessions().filter((s) => s.date === key);
      const due = this.dueMistakes(key);
      const reviewed = this.mistakes().filter((m) =>
        (m.review.history || []).some((h) => dateKey(h.date) === key)
      );
      return {
        date: key,
        tasks,
        doneTasks,
        taskTotal: tasks.length,
        taskDone: doneTasks.length,
        taskPercent: tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
        focusMinutes: sum(focus, (s) => s.minutes),
        focusSessions: focus.length,
        due,
        dueCount: due.length,
        reviewedCount: reviewed.length
      };
    },

    weekStats(endDate) {
      const end = endDate || todayKey();
      const days = [];
      for (let i = 6; i >= 0; i -= 1) {
        const key = addDays(end, -i);
        const stats = this.dayStats(key);
        days.push({
          date: key,
          label: WEEKDAYS_SHORT[parseDateKey(key).getDay()],
          minutes: stats.focusMinutes,
          tasks: stats.taskDone,
          taskTotal: stats.taskTotal,
          due: stats.dueCount,
          isToday: key === todayKey()
        });
      }
      return days;
    },

    streak() {
      const active = new Set();
      this.sessions().forEach((s) => active.add(s.date));
      this.tasks().forEach((t) => {
        if (t.done && t.completedAt) active.add(dateKey(t.completedAt));
      });
      this.mistakes().forEach((m) => {
        (m.review.history || []).forEach((h) => active.add(dateKey(h.date)));
      });
      let cursor = todayKey();
      if (!active.has(cursor)) cursor = addDays(cursor, -1);
      let count = 0;
      while (active.has(cursor) && count < 3650) {
        count += 1;
        cursor = addDays(cursor, -1);
      }
      return count;
    },

    totalFocus() {
      return sum(this.sessions(), (s) => s.minutes);
    },

    exportAll(options) {
      const opts = options || {};
      const config = this.config();
      const safeConfig = Object.assign({}, config);
      if (!opts.includeKey) {
        safeConfig.apiKey = '';
        safeConfig.hasApiKey = Boolean(config.apiKey);
      }
      return {
        app: 'StudyNet',
        version: SN.VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          profile: this.profile(),
          config: safeConfig,
          tasks: this.tasks(),
          mistakes: this.mistakes(),
          sessions: this.sessions(),
          chats: this.chats(),
          reports: this.reports()
        }
      };
    },

    importAll(payload) {
      if (!payload || payload.app !== 'StudyNet' || !payload.data || typeof payload.data !== 'object') {
        throw new Error('不是有效的 StudyNet 备份文件');
      }
      const data = payload.data;
      const currentConfig = this.config();
      // An import is a full restore: remove old learning data first, but keep
      // the current browser's API configuration unless the backup includes one.
      Object.keys(KEYS).forEach((name) => {
        if (name === 'config') return;
        try {
          global.localStorage.removeItem(KEYS[name]);
        } catch (_) {}
      });
      if (data.profile) writeRaw(KEYS.profile, Object.assign({}, DEFAULT_PROFILE, data.profile));
      if (data.config) {
        const incoming = Object.assign({}, DEFAULT_CONFIG, data.config);
        if (!incoming.apiKey && currentConfig.apiKey) incoming.apiKey = currentConfig.apiKey;
        if (!incoming.apiKey) incoming.configuredAt = null;
        writeRaw(KEYS.config, incoming);
      }
      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.mistakes)) this.saveMistakes(data.mistakes);
      if (Array.isArray(data.sessions)) this.saveSessions(data.sessions);
      if (Array.isArray(data.chats)) this.saveChats(data.chats);
      if (Array.isArray(data.reports)) writeRaw(KEYS.reports, data.reports.slice(0, 20));
      return true;
    },

    clearAll(options) {
      const opts = options || {};
      Object.keys(KEYS).forEach((name) => {
        if (name === 'config' && opts.keepConfig) return;
        try {
          global.localStorage.removeItem(KEYS[name]);
        } catch (_) {}
      });
    },

    storageSize() {
      let chars = 0;
      Object.values(KEYS).forEach((key) => {
        try {
          chars += (global.localStorage.getItem(key) || '').length;
        } catch (_) {}
      });
      return chars;
    }
  };
  SN.Store = Store;

  /* ------------------------------------------------------------------ */
  /* Tiny event bus                                                     */
  /* ------------------------------------------------------------------ */

  const listeners = {};
  SN.bus = {
    on(event, fn) {
      (listeners[event] || (listeners[event] = [])).push(fn);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      listeners[event] = (listeners[event] || []).filter((cb) => cb !== fn);
    },
    emit(event, payload) {
      (listeners[event] || []).slice().forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error('[StudyNet] event handler failed', event, err);
        }
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Shared helpers                                                     */
  /* ------------------------------------------------------------------ */

  SN.utils = {
    uid,
    clamp,
    todayKey,
    dateKey,
    parseDateKey,
    addDays,
    daysBetween,
    weekdayCN,
    formatDateCN,
    formatDateFull,
    relativeDate,
    greeting,
    greetingName,
    formatDuration,
    formatClock,
    escapeHtml,
    escapeAttr,
    truncate,
    stripMarkdown,
    debounce,
    sum,
    groupBy,
    sortBy,
    safeUrl,
    subject,
    subjectByName,
    priority,
    taskEnd,
    randomId
  };

  SN.ready = function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };
})(window);
