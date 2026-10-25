/* StudyNet — learning dashboard */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  let timerInterval = 0;

  function renderGreeting() {
    const profile = Store.profile();
    const today = Store.dayStats();
    const now = new Date();
    const name = profile.name || '同学';
    const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日 · ${U.weekdayCN(
      U.todayKey()
    )} · ${profile.grade || '初中'}`;
    document.getElementById('home-date').textContent = dateLabel;
    document.getElementById('home-greeting').textContent = U.greeting(now);
    document.getElementById('home-name').textContent = name;
    let sub = '今天也按自己的节奏，往前一点点。';
    if (today.taskTotal && today.taskDone === today.taskTotal) {
      sub = '今天的计划已经全部完成，给自己留一点休息。';
    } else if (today.dueCount) {
      sub = `有 ${today.dueCount} 道错题到了复习时间，先易后难，别让漏洞过夜。`;
    } else if (today.taskTotal) {
      sub = `今天还有 ${today.taskTotal - today.taskDone} 项计划，先完成最重要的一件事。`;
    }
    document.getElementById('home-sub').textContent = sub;
  }

  function renderStats() {
    const profile = Store.profile();
    const today = Store.dayStats();
    const goal = Math.max(15, Number(profile.dailyMinutes) || 90);
    const focusPercent = U.clamp(Math.round((today.focusMinutes / goal) * 100), 0, 100);
    const taskPercent = today.taskPercent;
    const week = Store.weekStats();
    const weekMinutes = U.sum(week, (d) => d.minutes);
    const streak = Store.streak();
    document.getElementById('stats-strip').innerHTML = `
      <article class="stat-card" style="--stat-color:#3157f5;--stat-soft:#e9edff">
        <div class="stat-card__top">
          <span class="stat-card__icon">${icon('timer', { size: 17 })}</span>
          <span class="stat-card__trend">目标 <b>${goal}</b> 分钟</span>
        </div>
        <div class="stat-card__value"><strong>${today.focusMinutes}</strong><span>分钟</span></div>
        <p class="stat-card__label">今日专注 <span class="dot"></span> ${focusPercent}%</p>
        <div class="stat-card__bar"><span style="width:${focusPercent}%"></span></div>
      </article>
      <article class="stat-card" style="--stat-color:#179b7f;--stat-soft:#e1f7f0">
        <div class="stat-card__top">
          <span class="stat-card__icon">${icon('check-circle', { size: 17 })}</span>
          <span class="stat-card__trend"><b>${taskPercent}%</b> 完成</span>
        </div>
        <div class="stat-card__value"><strong>${today.taskDone}</strong><span>/ ${today.taskTotal} 项</span></div>
        <p class="stat-card__label">计划完成 <span class="dot"></span> ${today.taskTotal ? '继续保持' : '待安排'}</p>
        <div class="stat-card__bar"><span style="width:${taskPercent}%"></span></div>
      </article>
      <article class="stat-card" style="--stat-color:#ef735d;--stat-soft:#ffebe6">
        <div class="stat-card__top">
          <span class="stat-card__icon">${icon('notebook', { size: 17 })}</span>
          <span class="stat-card__trend"><b>${today.dueCount}</b> 道到期</span>
        </div>
        <div class="stat-card__value"><strong>${Store.mistakes().length}</strong><span>道错题</span></div>
        <p class="stat-card__label">错题待复习 <span class="dot"></span> ${today.reviewedCount} 道已回顾</p>
        <div class="stat-card__bar"><span style="width:${today.dueCount ? 35 : 0}%;background:#ef735d"></span></div>
      </article>
      <article class="stat-card" style="--stat-color:#c78315;--stat-soft:#fff4d8">
        <div class="stat-card__top">
          <span class="stat-card__icon">${icon('flame', { size: 17 })}</span>
          <span class="stat-card__trend">本周 <b>${weekMinutes}</b> 分钟</span>
        </div>
        <div class="stat-card__value"><strong>${streak}</strong><span>天连续</span></div>
        <p class="stat-card__label">学习状态 <span class="dot"></span> ${streak ? '保持节奏' : '从今天开始'}</p>
        <div class="stat-card__bar"><span style="width:${U.clamp(streak * 12, 0, 100)}%;background:#c78315"></span></div>
      </article>`;
  }

  function renderTasks() {
    const tasks = Store.tasksOn(U.todayKey());
    const host = document.getElementById('dashboard-tasks');
    const done = tasks.filter((t) => t.done).length;
    document.getElementById('today-progress-label').textContent = `${done} / ${tasks.length}`;
    document.getElementById('today-progress-percent').textContent = `${
      tasks.length ? Math.round((done / tasks.length) * 100) : 0
    }%`;
    document.getElementById('today-progress-bar').style.width = `${
      tasks.length ? Math.round((done / tasks.length) * 100) : 0
    }%`;
    document.getElementById('today-sub').textContent = tasks.length
      ? done === tasks.length
        ? '今天的目标已经全部完成'
        : `还剩 ${tasks.length - done} 项，先做最重要的那件`
      : '把注意力放在下一件小事上';

    if (!tasks.length) {
      host.innerHTML = `<div class="today-empty">${UI.empty({
        icon: 'calendar',
        title: '今天还没有计划',
        desc: '试着写下第一件 25 分钟能完成的小事。'
      })}</div>`;
      return;
    }
    host.innerHTML = tasks
      .slice(0, 4)
      .map((task) => {
        const subject = U.subject(task.subject);
        const priority = U.priority(task.priority);
        return `<div class="today-task${task.done ? ' is-done' : ''}" data-task-open="${task.id}" style="--priority-color:${priority.color}">
          <button type="button" class="task-check" data-task-toggle="${task.id}" aria-label="${
          task.done ? '标记为未完成' : '标记为完成'
        }" aria-pressed="${task.done}">${icon('check', { size: 13 })}</button>
          <span class="today-task__time">${escapeHtml(task.start || '--:--')}</span>
          <div class="today-task__body">
            <p class="today-task__title">${escapeHtml(task.title)}</p>
            <div class="today-task__meta">
              <span class="subject-tag" style="--subject:${subject.color};--subject-soft:${subject.soft};--subject-ink:${subject.ink}"><i></i>${subject.name}</span>
              <i class="today-task__dot"></i><span>${escapeHtml(task.type)}</span>
              <i class="today-task__dot"></i><span>${task.duration} 分钟</span>
            </div>
          </div>
          <span class="today-task__priority" title="${priority.name}"></span>
        </div>`;
      })
      .join('');
    if (tasks.length > 4) {
      host.insertAdjacentHTML(
        'beforeend',
        `<a class="today-more" href="plan.html">还有 ${tasks.length - 4} 项，去计划页查看 ${icon(
          'arrow-right',
          { size: 13 }
        )}</a>`
      );
    }
    UI.hydrateIcons(host);
  }

  function renderMistakes() {
    const due = Store.dueMistakes();
    const host = document.getElementById('mistake-preview-list');
    document.getElementById('mistake-due-count').innerHTML = `${icon('clock', { size: 13 })} ${
      due.length ? `${due.length} 道待复习` : '今日已清空'
    }`;
    if (!due.length) {
      host.innerHTML = `<div class="mistake-preview__empty">${UI.empty({
        icon: 'check-circle',
        title: '今天没有到期错题',
        desc: '新的错题会在合适的时间回来找你。'
      })}</div>`;
      return;
    }
    host.innerHTML = due
      .slice(0, 3)
      .map((item) => {
        const subject = U.subject(item.subject);
        const overdue = U.daysBetween(item.review.next, U.todayKey());
        return `<div class="mini-mistake" data-mistake-link="${item.id}">
          <span class="mini-mistake__mark" style="--subject:${subject.color};--subject-soft:${subject.soft}">${subject.short}</span>
          <div class="mini-mistake__body">
            <p class="mini-mistake__title">${escapeHtml(item.title)}</p>
            <div class="mini-mistake__meta"><span>${subject.name}</span><i class="dot"></i><span>${escapeHtml(
          item.errorType
        )}</span></div>
          </div>
          <span class="mini-mistake__due">${overdue > 0 ? `逾期 ${overdue} 天` : '今天'}</span>
        </div>`;
      })
      .join('');
  }

  function renderWeek() {
    const week = Store.weekStats();
    const total = U.sum(week, (d) => d.minutes);
    document.getElementById('week-total').textContent = total;
    document.getElementById('week-days').textContent = week.filter((d) => d.minutes > 0).length;
    document.getElementById('week-tasks').textContent = U.sum(week, (d) => d.tasks);
    document.getElementById('week-chart').innerHTML = UI.weeklyChart(week);
  }

  function renderLocalInsight() {
    const today = Store.dayStats();
    const nextTask = today.tasks.find((t) => !t.done);
    const parts = [];
    if (nextTask) {
      parts.push(`先完成「<strong>${escapeHtml(nextTask.title)}</strong>」，约 ${nextTask.duration} 分钟。`);
    }
    if (today.dueCount) {
      parts.push(`还有 <strong>${today.dueCount} 道错题</strong> 到期，建议放在任务之间复习。`);
    }
    if (!parts.length) {
      parts.push('今天还没有安排。先放入一件 <strong>25 分钟</strong> 能完成的小任务，让节奏启动。');
    }
    if (today.focusMinutes >= 45) {
      parts.push('已经专注了一段时间，下一轮记得起来活动一下。');
    }
    document.getElementById('insight-text').innerHTML = parts.join(' ');
  }

  function showBrief(content) {
    const card = document.getElementById('insight-card');
    const result = document.getElementById('insight-result');
    result.innerHTML = `<div class="markdown">${UI.renderMarkdown(content)}</div>`;
    result.classList.add('is-open');
    card.classList.add('has-result');
    document.getElementById('insight-title').textContent = '今晚的 AI 调度建议';
    document.getElementById('insight-text').hidden = true;
    document.getElementById('insight-generate').innerHTML = `${icon('refresh', {
      size: 15
    })}<span>重新生成</span>`;
    UI.typeset(result);
  }

  function loadLatestBrief() {
    const reports = Store.reports();
    const latest = reports.find(
      (r) => r.kind === 'brief' && U.dateKey(r.createdAt) === U.todayKey()
    );
    if (latest && latest.content) {
      showBrief(latest.content);
      return true;
    }
    return false;
  }

  async function generateBrief() {
    const button = document.getElementById('insight-generate');
    UI.setButtonLoading(button, true, '正在分析');
    try {
      const content = await SN.AI.dashboardBrief();
      Store.addReport({ kind: 'brief', content, date: U.todayKey() });
      showBrief(content);
      UI.toast('今日学习简报已生成', 'success');
    } catch (err) {
      if (err.code === 'no_key') {
        UI.toast('还没有配置 API Key。', 'error', {
          actionLabel: '去设置',
          onAction: () => (location.href = 'settings.html')
        });
      } else {
        UI.toast(err.message || '生成失败，请稍后再试。', 'error');
      }
    } finally {
      UI.setButtonLoading(button, false);
      if (document.getElementById('insight-card').classList.contains('has-result')) {
        button.innerHTML = `${icon('refresh', { size: 15 })}<span>重新生成</span>`;
      }
    }
  }

  function renderFocusCard() {
    const state = Store.timer();
    const timeEl = document.getElementById('focus-time');
    const dial = document.getElementById('focus-dial');
    const status = document.getElementById('focus-status');
    const subjectEl = document.getElementById('focus-subject');
    const start = document.getElementById('focus-start');
    const today = Store.dayStats();
    const profile = Store.profile();
    document.getElementById('focus-today').textContent = `${today.focusMinutes} 分钟`;
    document.getElementById('focus-goal').textContent = `${profile.dailyMinutes || 90} 分钟`;

    const idle =
      !state ||
      !state.duration ||
      (!state.running && !state.startedAt && Number(state.remaining) === Number(state.duration));
    if (idle) {
      timeEl.textContent = '25:00';
      dial.style.setProperty('--progress', 0);
      status.className = 'focus-card__status';
      status.innerHTML = '<i></i>准备开始';
      subjectEl.textContent = '今天的第一段专注';
      start.href = 'focus.html?start=25';
      start.innerHTML = `${icon('play', { size: 16 })}开始 25 分钟`;
      return;
    }
    const duration = Math.max(1, Number(state.duration) || 1500);
    const now = Date.now();
    let remaining = Number(state.remaining) || duration;
    if (state.running && state.endAt) remaining = Math.max(0, Math.round((state.endAt - now) / 1000));
    const elapsed = U.clamp(duration - remaining, 0, duration);
    const percent = (elapsed / duration) * 100;
    timeEl.textContent = U.formatClock(remaining);
    dial.style.setProperty('--progress', percent.toFixed(1));
    const subject = U.subject(state.subject || 'math');
    subjectEl.textContent = `${subject.name} · ${state.running ? '正在专注' : remaining < duration ? '已暂停' : '准备开始'}`;
    if (state.running) {
      status.className = 'focus-card__status is-live';
      status.innerHTML = '<i></i>专注中';
      start.href = 'focus.html';
      start.innerHTML = `${icon('play', { size: 16 })}继续专注`;
    } else if (remaining === 0) {
      status.className = 'focus-card__status';
      status.innerHTML = '<i></i>本轮完成';
      start.href = 'focus.html?start=25';
      start.innerHTML = `${icon('rotate-ccw', { size: 16 })}再来一轮`;
    } else {
      status.className = 'focus-card__status';
      status.innerHTML = '<i></i>已暂停';
      start.href = 'focus.html';
      start.innerHTML = `${icon('play', { size: 16 })}继续专注`;
    }
  }

  function bind() {
    document.querySelectorAll('[data-quick-task]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SN.openTaskDialog({
          date: U.todayKey(),
          onSaved: () => refreshAll()
        });
      });
    });
    document.getElementById('dashboard-tasks').addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-task-toggle]');
      if (toggle) {
        event.stopPropagation();
        Store.toggleTask(toggle.dataset.taskToggle);
        refreshAll();
        return;
      }
      const row = event.target.closest('[data-task-open]');
      if (row) {
        const task = Store.tasks().find((t) => t.id === row.dataset.taskOpen);
        if (task) {
          SN.openTaskDialog({
            task,
            onSaved: () => refreshAll()
          });
        }
      }
    });
    document.getElementById('mistake-preview-list').addEventListener('click', (event) => {
      const link = event.target.closest('[data-mistake-link]');
      if (link) location.href = `mistakes.html?id=${encodeURIComponent(link.dataset.mistakeLink)}`;
    });
    document.getElementById('insight-generate').addEventListener('click', generateBrief);
    document.getElementById('focus-start').addEventListener('click', () => {});
    document.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || event.target.isContentEditable) return;
      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        document.querySelector('[data-quick-task]').click();
      }
    });
  }

  function refreshAll() {
    renderGreeting();
    renderStats();
    renderTasks();
    renderMistakes();
    renderWeek();
    renderLocalInsight();
    renderFocusCard();
  }

  function init() {
    UI.hydrateIcons(document);
    bind();
    refreshAll();
    if (!loadLatestBrief()) renderLocalInsight();
    clearInterval(timerInterval);
    timerInterval = setInterval(renderFocusCard, 1000);
    SN.bus.on('tasks:changed', refreshAll);
    SN.bus.on('mistakes:changed', refreshAll);
    SN.bus.on('sessions:changed', refreshAll);
    SN.bus.on('profile:changed', refreshAll);
  }

  SN.Dashboard = { init };
  SN.ready(() => {
    SN.Shell.init('dashboard').then(init);
  });
})(window);
