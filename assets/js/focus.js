/* StudyNet — focus timer */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const CIRCUMFERENCE = 2 * Math.PI * 178;
  const DURATIONS = [25, 45, 60, 90];
  let interval = 0;
  let audioContext = null;

  const state = {
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    endAt: null,
    subject: 'math',
    startedAt: null,
    id: null,
    logged: false,
    date: U.todayKey()
  };

  const els = {};

  function defaultState() {
    return {
      duration: 25 * 60,
      remaining: 25 * 60,
      running: false,
      endAt: null,
      subject: 'math',
      startedAt: null,
      id: null,
      logged: false,
      date: U.todayKey()
    };
  }

  function loadTimer() {
    const saved = Store.timer();
    if (!saved || !saved.duration || saved.date !== U.todayKey()) return defaultState();
    const duration = U.clamp(saved.duration, 60, 7200);
    let remaining = U.clamp(saved.remaining == null ? duration : saved.remaining, 0, duration);
    const running = Boolean(saved.running && saved.endAt);
    if (running) remaining = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
    return {
      duration,
      remaining,
      running,
      endAt: running ? saved.endAt : null,
      subject: SN.SUBJECT_MAP[saved.subject] ? saved.subject : 'math',
      startedAt: saved.startedAt || null,
      id: saved.id || null,
      logged: Boolean(saved.logged),
      date: U.todayKey()
    };
  }

  function persist() {
    Store.saveTimer({
      duration: state.duration,
      remaining: state.remaining,
      running: state.running,
      endAt: state.endAt,
      subject: state.subject,
      startedAt: state.startedAt,
      id: state.id,
      logged: state.logged,
      date: U.todayKey()
    });
  }

  function totalToday() {
    return Store.dayStats().focusMinutes;
  }

  function updateDocumentTitle() {
    document.title = state.running
      ? `${U.formatClock(state.remaining)} · 专注中 | StudyNet`
      : '专注空间 · StudyNet 学习舱';
  }

  function renderTime() {
    els.time.textContent = U.formatClock(state.remaining);
    const progress = state.duration ? U.clamp((state.duration - state.remaining) / state.duration, 0, 1) : 0;
    els.ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    const stateText = state.running
      ? '专注进行中'
      : state.remaining === 0
      ? '本轮完成'
      : state.remaining < state.duration
      ? '已暂停'
      : '准备开始';
    els.state.innerHTML = `<i></i>${stateText}`;
    document.getElementById('focus-round').innerHTML = `${U.weekdayCN(U.todayKey())} · 第 ${
      Store.dayStats().focusSessions + 1
    } 轮 · <strong>${state.running ? '保持在这一件事上' : '先开始，再谈状态'}</strong>`;
    updateDocumentTitle();
  }

  function renderControls() {
    const label = state.running
      ? '暂停一下'
      : state.remaining === 0
      ? '再来一轮'
      : state.remaining < state.duration
      ? '继续专注'
      : '开始专注';
    els.toggle.classList.toggle('is-pause', state.running);
    els.toggle.innerHTML = `${icon(state.running ? 'pause' : 'play', { size: 17 })}<span>${label}</span>`;
    els.reset.disabled = !state.running && state.remaining === state.duration;
    els.reset.style.opacity = els.reset.disabled ? '0.45' : '1';
    els.durations.querySelectorAll('[data-duration]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.duration) * 60 === state.duration);
      btn.disabled = state.running;
      btn.style.opacity = state.running && Number(btn.dataset.duration) * 60 !== state.duration ? '0.45' : '1';
    });
    els.subjects.querySelectorAll('[data-focus-subject]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.focusSubject === state.subject);
    });
  }

  function renderToday() {
    const today = Store.dayStats();
    const profile = Store.profile();
    const goal = Math.max(15, Number(profile.dailyMinutes) || 90);
    const percent = U.clamp(Math.round((today.focusMinutes / goal) * 100), 0, 100);
    els.todayDial.innerHTML =
      UI.ring(percent, { size: 87, stroke: 7, color: '#3157f5' }) +
      `<strong>${percent}%</strong><span>目标</span>`;
    els.todayMinutes.textContent = U.formatDuration(today.focusMinutes);
    els.todaySessions.textContent = `${today.focusSessions} 轮`;
    els.todayGoal.textContent = U.formatDuration(goal);
    els.todayDate.textContent = U.formatDateCN(U.todayKey(), false) + ' ' + U.weekdayCN(U.todayKey());

    const sessions = Store.sessions()
      .filter((s) => s.date === U.todayKey())
      .sort((a, b) => String(b.endedAt).localeCompare(String(a.endedAt)))
      .slice(0, 5);
    if (!sessions.length) {
      els.sessionList.innerHTML = '<p class="focus-history-empty">完成第一轮专注后，记录会出现在这里。</p>';
    } else {
      els.sessionList.innerHTML = sessions
        .map((session) => {
          const subject = U.subject(session.subject);
          const end = new Date(session.endedAt);
          const start = new Date(session.startedAt || end);
          const time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(
            2,
            '0'
          )}–${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
          return `<div class="session-item">
            <span class="session-item__dot" style="--subject:${subject.color}"></span>
            <div class="session-item__body"><strong>${subject.name}专注</strong><span>${time}</span></div>
            <span class="session-item__mins">${session.minutes} 分钟</span>
          </div>`;
        })
        .join('');
    }
    els.methodText.textContent = today.focusMinutes
      ? `今天已经专注 ${U.formatDuration(today.focusMinutes)}。如果连续专注超过 50 分钟，站起来走动一下，下一轮会更容易进入状态。`
      : '开始前写下这一轮只做什么。25 分钟结束后，站起来走动 5 分钟，再决定下一轮。';
  }

  function renderAll() {
    renderTime();
    renderControls();
    renderToday();
  }

  function ensureAudio() {
    if (audioContext) return;
    try {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (Ctx) audioContext = new Ctx();
    } catch (_) {}
  }

  function playChime() {
    ensureAudio();
    if (!audioContext) return;
    try {
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + index * 0.16);
        gain.gain.linearRampToValueAtTime(0.13, now + index * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.16 + 0.6);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now + index * 0.16);
        osc.stop(now + index * 0.16 + 0.65);
      });
    } catch (_) {}
  }

  function completeSession() {
    if (state.logged) return;
    state.running = false;
    state.remaining = 0;
    state.logged = true;
    state.endAt = null;
    persist();
    const minutes = Math.max(1, Math.round(state.duration / 60));
    const endedAt = new Date().toISOString();
    Store.addSession({
      minutes,
      subject: state.subject,
      date: U.todayKey(),
      startedAt: state.startedAt || new Date(Date.now() - state.duration * 1000).toISOString(),
      endedAt,
      mode: 'focus'
    });
    playChime();
    renderAll();
    UI.toast(`完成 ${minutes} 分钟专注，休息一下再继续。`, 'success', {
      duration: 5000
    });
  }

  function tick() {
    if (state.running && state.endAt) {
      state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
      if (state.remaining <= 0) {
        completeSession();
        return;
      }
    }
    renderTime();
  }

  function startTimer() {
    if (state.running) return;
    if (state.remaining <= 0 || state.logged) {
      state.remaining = state.duration;
      state.logged = false;
      state.id = null;
      state.startedAt = null;
    }
    ensureAudio();
    if (!state.id) state.id = U.uid('focus');
    if (!state.startedAt) state.startedAt = new Date().toISOString();
    state.running = true;
    state.endAt = Date.now() + state.remaining * 1000;
    state.date = U.todayKey();
    persist();
    renderAll();
    clearInterval(interval);
    interval = setInterval(tick, 500);
  }

  function pauseTimer() {
    if (!state.running) return;
    state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    state.running = false;
    state.endAt = null;
    persist();
    clearInterval(interval);
    renderAll();
    UI.toast('已暂停，继续时从这里开始。', 'info', { duration: 2200 });
  }

  function resetTimer(force) {
    const elapsed = state.duration - state.remaining;
    if (!force && state.running && elapsed > 60) {
      UI.confirm({
        title: '重置这一轮专注？',
        message: '已经专注的时间不会被记录，确定要从头开始吗？',
        confirmText: '重置',
        danger: true
      }).then((ok) => {
        if (ok) resetTimer(true);
      });
      return;
    }
    clearInterval(interval);
    state.running = false;
    state.remaining = state.duration;
    state.endAt = null;
    state.startedAt = null;
    state.id = null;
    state.logged = false;
    state.date = U.todayKey();
    persist();
    renderAll();
  }

  function setDuration(minutes) {
    if (state.running) {
      UI.toast('先暂停这一轮，再调整时长。', 'info');
      return;
    }
    state.duration = minutes * 60;
    state.remaining = state.duration;
    state.logged = false;
    state.id = null;
    state.startedAt = null;
    persist();
    renderAll();
  }

  function enterZen() {
    document.body.classList.add('focus-zen');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function exitZen() {
    document.body.classList.remove('focus-zen');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function bind() {
    els.toggle.addEventListener('click', () => {
      if (state.running) pauseTimer();
      else startTimer();
    });
    els.reset.addEventListener('click', () => resetTimer(false));
    els.durations.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-duration]');
      if (btn) setDuration(Number(btn.dataset.duration));
    });
    els.subjects.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-focus-subject]');
      if (!btn) return;
      state.subject = btn.dataset.focusSubject;
      persist();
      renderControls();
    });
    document.getElementById('zen-btn').addEventListener('click', enterZen);
    document.getElementById('zen-exit').addEventListener('click', exitZen);
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) document.body.classList.remove('focus-zen');
    });
    document.addEventListener('keydown', (event) => {
      const tag = (event.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || event.target.isContentEditable) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (state.running) pauseTimer();
        else startTimer();
      }
      if (event.key === 'Escape' && document.body.classList.contains('focus-zen')) exitZen();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tick();
    });
    SN.bus.on('sessions:changed', renderToday);
  }

  function init() {
    els.time = document.getElementById('focus-clock-label');
    els.ring = document.getElementById('focus-ring-progress');
    els.state = document.getElementById('focus-state');
    els.toggle = document.getElementById('focus-toggle');
    els.reset = document.getElementById('focus-reset');
    els.durations = document.getElementById('focus-durations');
    els.subjects = document.getElementById('focus-subjects');
    els.todayDial = document.getElementById('focus-today-dial');
    els.todayMinutes = document.getElementById('focus-today-minutes');
    els.todaySessions = document.getElementById('focus-today-sessions');
    els.todayGoal = document.getElementById('focus-today-goal');
    els.todayDate = document.getElementById('focus-today-date');
    els.sessionList = document.getElementById('focus-session-list');
    els.methodText = document.getElementById('focus-method-text');

    Object.assign(state, loadTimer());

    els.subjects.innerHTML = SN.SUBJECTS.map(
      (s) =>
        `<button type="button" data-focus-subject="${s.id}" class="${
          state.subject === s.id ? 'is-active' : ''
        }">${s.name}</button>`
    ).join('');
    els.ring.style.strokeDasharray = String(CIRCUMFERENCE);

    UI.hydrateIcons(document);
    bind();

    if (state.running && state.remaining <= 0) {
      // The timer finished while the page was closed.
      state.running = false;
      if (!state.logged) completeSession();
      else {
        state.endAt = null;
        persist();
      }
    }
    if (state.running) {
      clearInterval(interval);
      interval = setInterval(tick, 500);
    }
    renderAll();

    const params = new URLSearchParams(location.search);
    const start = Number(params.get('start'));
    if (DURATIONS.includes(start) && !state.running) {
      state.duration = start * 60;
      state.remaining = state.duration;
      state.logged = false;
      state.id = null;
      state.startedAt = null;
      startTimer();
    }
  }

  SN.Focus = { init };
  SN.ready(() => {
    SN.Shell.init('focus').then(init);
  });
})(window);
