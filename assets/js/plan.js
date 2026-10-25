/* StudyNet — daily plan */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const state = {
    date: U.todayKey()
  };
  const els = {};

  function dateTitle(key) {
    const date = U.parseDateKey(key);
    return `${date.getMonth() + 1}月${date.getDate()}日 · ${U.weekdayCN(key)}`;
  }

  function renderWeek() {
    const selected = state.date;
    const day = U.parseDateKey(selected).getDay();
    const offset = (day + 6) % 7;
    const monday = U.addDays(selected, -offset);
    const allTasks = Store.tasks();
    let html = '';
    for (let i = 0; i < 7; i += 1) {
      const key = U.addDays(monday, i);
      const date = U.parseDateKey(key);
      const tasks = allTasks.filter((t) => t.date === key);
      const done = tasks.filter((t) => t.done).length;
      const isToday = key === U.todayKey();
      const active = key === selected;
      html += `<button type="button" class="week-day${isToday ? ' is-today' : ''}${active ? ' is-active' : ''}${
        tasks.length ? ' has-tasks' : ''
      }" data-plan-date="${key}" aria-label="${U.formatDateFull(key)}${tasks.length ? `，${tasks.length} 项任务` : ''}">
        ${tasks.length ? `<span class="week-day__count">${done}/${tasks.length}</span>` : ''}
        <span>${U.weekdayCN(key)}</span>
        <strong>${date.getDate()}</strong>
        <i></i>
      </button>`;
    }
    els.weekStrip.innerHTML = html;
  }

  function renderPlan() {
    const tasks = Store.tasksOn(state.date);
    const done = tasks.filter((t) => t.done);
    const totalMinutes = U.sum(tasks, (t) => t.duration);
    const percent = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    const stats = Store.dayStats(state.date);
    const label = U.relativeDate(state.date);
    document.getElementById('plan-date').textContent = dateTitle(state.date);
    els.dateChip.textContent = label;
    els.dateChip.className = `chip${state.date === U.todayKey() ? ' chip--primary' : ''}`;
    document.getElementById('plan-today').disabled = state.date === U.todayKey();
    document.getElementById('plan-today').style.opacity = state.date === U.todayKey() ? '0.45' : '1';

    els.ring.innerHTML =
      UI.ring(percent, { size: 142, stroke: 10, color: '#3157f5' }) +
      `<div class="plan-goal__ring-content"><strong>${percent}%</strong><span>${done.length} / ${tasks.length} 项</span></div>`;
    els.statusChip.textContent = !tasks.length
      ? '待安排'
      : percent === 100
      ? '已完成'
      : done.length
      ? '进行中'
      : '待开始';
    els.statusChip.className = `chip${percent === 100 && tasks.length ? ' chip--mint' : done.length ? ' chip--primary' : ''}`;
    document.getElementById('plan-stat-tasks').textContent = `${tasks.length} 项`;
    document.getElementById('plan-stat-minutes').textContent = U.formatDuration(totalMinutes);
    document.getElementById('plan-stat-done').textContent = `${done.length} 项`;
    document.getElementById('plan-stat-focus').textContent = U.formatDuration(stats.focusMinutes);
    document.getElementById('plan-foot-note').textContent = tasks.length
      ? `${done.length}/${tasks.length} 项完成 · 预计 ${U.formatDuration(totalMinutes)} · 已完成 ${U.formatDuration(
          U.sum(done, (t) => t.duration)
        )}`
      : '把最难的事放在精力最好的一段时间。';

    if (!tasks.length) {
      els.taskList.innerHTML = `<div class="plan-empty">${UI.empty({
        icon: 'calendar',
        title: '这一天还没有安排',
        desc: '让 AI 根据你的可用时间和薄弱学科，排一份能完成的计划。',
        action: `<div class="row gap-8"><button type="button" class="btn btn--primary btn--sm" data-plan-ai>${icon(
          'sparkles',
          { size: 14 }
        )}AI 排计划</button><button type="button" class="btn btn--ghost btn--sm" data-plan-add>${icon(
          'plus',
          { size: 14 }
        )}手动添加</button></div>`
      })}</div>`;
      els.taskList.querySelector('[data-plan-ai]')?.addEventListener('click', openAiPlan);
      els.taskList.querySelector('[data-plan-add]')?.addEventListener('click', openAdd);
    } else {
      els.taskList.innerHTML = tasks
        .map((task) => {
          const subject = U.subject(task.subject);
          const priority = U.priority(task.priority);
          return `<div class="timeline-task${task.done ? ' is-done' : ''}" data-task-id="${
            task.id
          }" style="--subject:${subject.color};--subject-soft:${subject.soft}">
            <div class="timeline-task__time"><strong>${escapeHtml(task.start)}</strong>${task.duration}m</div>
            <div class="timeline-task__dot"></div>
            <div class="timeline-task__body">
              <div class="timeline-task__title-row">
                <button type="button" class="task-check" data-toggle-task="${task.id}" aria-label="${
            task.done ? '标记为未完成' : '标记为完成'
          }" aria-pressed="${task.done}">${icon('check', { size: 13 })}</button>
                <span class="timeline-task__title" data-edit-task="${task.id}">${escapeHtml(task.title)}</span>
              </div>
              <div class="timeline-task__meta">
                <span class="subject-tag" style="--subject:${subject.color};--subject-soft:${subject.soft};--subject-ink:${subject.ink}"><i></i>${subject.name}</span>
                <span>${escapeHtml(task.type)}</span>
                <i class="dot"></i>
                <span style="color:${priority.color}">${priority.name}</span>
                ${task.notes ? `<i class="dot"></i><span>${escapeHtml(U.truncate(task.notes, 28))}</span>` : ''}
              </div>
            </div>
            <div class="timeline-task__actions">
              <button type="button" data-edit-task="${task.id}" title="编辑任务" aria-label="编辑任务">${icon('edit', {
            size: 14
          })}</button>
              <button type="button" data-delete-task="${task.id}" title="删除任务" aria-label="删除任务">${icon('trash', {
            size: 14
          })}</button>
            </div>
          </div>`;
        })
        .join('');
    }
    renderSubjects(tasks);
    renderTip(tasks, done);
  }

  function renderSubjects(tasks) {
    const grouped = {};
    tasks.forEach((task) => {
      grouped[task.subject] = (grouped[task.subject] || 0) + (Number(task.duration) || 0);
    });
    const ids = Object.keys(grouped).sort((a, b) => grouped[b] - grouped[a]);
    if (!ids.length) {
      els.subjectDist.innerHTML = '<p class="review-mini-empty" style="text-align:left;padding:4px 0 0">安排任务后，这里会出现学科用时分布。</p>';
      return;
    }
    const total = U.sum(ids, (id) => grouped[id]);
    els.subjectDist.innerHTML = ids
      .map((id) => {
        const s = U.subject(id);
        const percent = Math.round((grouped[id] / total) * 100);
        return `<div class="subject-dist__item" style="--subject:${s.color}">
          <span class="subject-dist__name"><i></i>${s.name}</span>
          <div class="subject-dist__bar"><span style="width:${percent}%"></span></div>
          <span class="subject-dist__value">${grouped[id]}m</span>
        </div>`;
      })
      .join('');
  }

  function renderTip(tasks, done) {
    const undone = tasks.filter((t) => !t.done);
    const high = undone.find((t) => t.priority === 'high');
    let tip = '先完成最重要的一件事，再开始下一件。';
    if (!tasks.length) {
      tip = '先用 AI 排一个 90 分钟左右的计划。任务少一点，反而更容易完成。';
    } else if (!undone.length) {
      tip = `这一天已经完成 ${tasks.length} 项。别急着加任务，留一点时间给复盘和休息。`;
    } else if (high) {
      tip = `优先完成「${high.title}」。它被标为重要，建议放在精力最好的一段时间。`;
    } else if (undone.length > 5) {
      tip = '任务有点多。可以顺延 1-2 项到明天，把今晚的完成率守住。';
    } else if (state.date === U.todayKey() && new Date().getHours() >= 21) {
      tip = '已经到晚上九点后了。优先完成最重要的 1 项，剩下的顺延，不要熬太晚。';
    }
    els.tip.textContent = tip;
  }

  function refresh() {
    renderWeek();
    renderPlan();
  }

  function openAdd() {
    SN.openTaskDialog({
      date: state.date,
      onSaved: () => refresh()
    });
  }

  /* ------------------------------------------------------------------ */
  /* AI plan                                                            */
  /* ------------------------------------------------------------------ */

  function openAiPlan() {
    const formId = `ai-plan-${Date.now()}`;
    const defaultSubjects = new Set(['math', 'chinese', 'english']);
    let chosenSubjects = new Set(defaultSubjects);
    let proposed = [];
    let lastForm = {
      minutes: 90,
      start: '18:30',
      focus: '完成作业与复习',
      note: ''
    };

    const formHTML = () => `<form id="${formId}" class="ai-plan-form">
      <div class="form-grid form-grid--two">
        <label class="field"><span class="field__label">可用总时长</span>
          <select class="input" name="minutes">
            ${[
              [60, '1 小时'],
              [90, '1.5 小时'],
              [120, '2 小时'],
              [150, '2.5 小时'],
              [180, '3 小时']
            ]
              .map(
                ([v, label]) =>
                  `<option value="${v}" ${lastForm.minutes === v ? 'selected' : ''}>${label}</option>`
              )
              .join('')}
          </select>
        </label>
        <label class="field"><span class="field__label">几点开始</span>
          <input class="input" type="time" name="start" value="${lastForm.start}">
        </label>
      </div>
      <div class="field">
        <span class="field__label">重点学科 <small>可多选</small></span>
        <div class="subject-choice-grid">
          ${SN.SUBJECTS.map(
            (s) =>
              `<label class="subject-choice" style="--subject:${s.color};--subject-soft:${s.soft}">
                <input type="checkbox" name="subjects" value="${s.id}" ${
                chosenSubjects.has(s.id) ? 'checked' : ''
              }><span><i>${s.short}</i>${s.name}</span>
              </label>`
          ).join('')}
        </div>
      </div>
      <div class="form-grid form-grid--two">
        <label class="field"><span class="field__label">计划侧重</span>
          <select class="input" name="focus">
            ${['完成作业与复习', '补齐薄弱学科', '预习新课', '考前冲刺', '轻松恢复节奏']
              .map(
                (f) => `<option ${lastForm.focus === f ? 'selected' : ''}>${f}</option>`
              )
              .join('')}
          </select>
        </label>
        <label class="field"><span class="field__label">补充说明 <small>选填</small></span>
          <input class="input" name="note" maxlength="120" placeholder="例如：数学作业很多，英语要背课文" value="${escapeHtml(
            lastForm.note
          )}">
        </label>
      </div>
      <div class="settings-note">${icon('sparkles', {
        size: 14
      })} AI 会避开已有任务，按开始时间顺序安排 3-6 个具体任务，任务之间会留出短暂休息。</div>
    </form>`;

    const loadingHTML = `<div class="ai-plan-loading">
      <span class="ai-plan-loading__orb">${icon('sparkles', { size: 27 })}</span>
      <h3>正在排今天的学习节奏</h3>
      <p>把作业拆成可完成的小块，并留出休息。</p>
      <div class="ai-plan-loading__steps">
        <span>${icon('check', { size: 13 })}读取可用时间与学科</span>
        <span>${icon('check', { size: 13 })}避开已有任务</span>
        <span>${icon('check', { size: 13 })}按精力曲线排序</span>
      </div>
    </div>`;

    const ref = UI.modal({
      title: '让 AI 排一天',
      eyebrow: 'AI PLANNER',
      subtitle: `${dateTitle(state.date)} · 计划要能完成，才算计划`,
      size: 'lg',
      body: formHTML(),
      footer: `<span class="dialog-foot-note">${icon('sparkles', {
        size: 14
      })} 生成后可逐项调整</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-ai-action="close">取消</button><button type="button" class="btn btn--primary" data-ai-action="generate">${icon(
        'wand',
        { size: 15 }
      )}生成计划</button>`,
      onMount(api) {
        function setFooter(html) {
          api.footer.innerHTML = html;
        }

        function renderForm() {
          api.body.innerHTML = formHTML();
          api.body.scrollTop = 0;
          setFooter(`<span class="dialog-foot-note">${icon('sparkles', {
            size: 14
          })} 生成后可逐项调整</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-ai-action="close">取消</button><button type="button" class="btn btn--primary" data-ai-action="generate">${icon(
            'wand',
            { size: 15 }
          )}生成计划</button>`);
          api.root.querySelector('.sn-dialog__head h2').textContent = '让 AI 排一天';
          UI.hydrateIcons(api.body);
        }

        function readForm() {
          const form = api.root.querySelector(`#${formId}`);
          lastForm = {
            minutes: Number(form.elements.minutes.value),
            start: form.elements.start.value || '18:30',
            focus: form.elements.focus.value,
            note: form.elements.note.value.trim()
          };
          const subjects = Array.from(form.querySelectorAll('input[name="subjects"]:checked')).map(
            (el) => el.value
          );
          chosenSubjects = new Set(subjects);
          return { subjects, ...lastForm };
        }

        async function generate() {
          const values = readForm();
          if (!values.subjects.length) {
            UI.toast('至少选择一个重点学科。', 'error');
            return;
          }
          api.body.innerHTML = loadingHTML;
          setFooter(`<span class="dialog-foot-note">通常需要十几秒</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-ai-action="close">取消</button>`);
          try {
            proposed = await SN.AI.generatePlan({
              date: state.date,
              minutes: values.minutes,
              start: values.start,
              subjects: values.subjects,
              focus: values.focus,
              note: values.note,
              existingTasks: Store.tasksOn(state.date)
            });
            renderPreview();
          } catch (err) {
            api.body.innerHTML = `<div class="empty-state" style="min-height:320px">
              <span class="empty-state__art" style="background:var(--danger-soft);color:var(--danger)">${icon(
                'alert',
                { size: 24 }
              )}</span>
              <h3>计划没有生成成功</h3>
              <p>${escapeHtml(err.message || '请稍后重试。')}</p>
              <button type="button" class="btn btn--soft" data-ai-action="back">${icon('edit', {
                size: 15
              })}返回调整</button>
            </div>`;
            setFooter(`<span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-ai-action="close">取消</button>`);
          }
        }

        function renderPreview() {
          api.root.querySelector('.sn-dialog__head h2').textContent = 'AI 建议这样安排';
          api.body.innerHTML = `<div class="ai-plan-form">
            <div class="settings-note">${icon('check-circle', {
              size: 14
            })} 已生成 ${proposed.length} 个任务，总时长 ${U.formatDuration(
            U.sum(proposed, (t) => t.duration)
          )}。取消勾选不想加入的任务。</div>
            <div class="ai-plan-preview">
              ${proposed
                .map(
                  (task, index) => `<label class="ai-plan-item">
                    <input type="checkbox" data-ai-index="${index}" checked>
                    <span class="ai-plan-item__time">${escapeHtml(task.start)}</span>
                    <div class="ai-plan-item__body"><strong>${escapeHtml(
                      task.title
                    )}</strong><small>${escapeHtml(task.type)} · ${task.duration} 分钟${
                    task.notes ? ` · ${escapeHtml(task.notes)}` : ''
                  }</small></div>
                    ${UI.subjectTag(task.subject)}
                  </label>`
                )
                .join('')}
            </div>
          </div>`;
          setFooter(`<button type="button" class="btn btn--ghost" data-ai-action="back">${icon('edit', {
            size: 15
          })}重新调整</button><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--primary" data-ai-action="accept">${icon(
            'plus',
            { size: 15 }
          )}加入计划</button>`);
          UI.hydrateIcons(api.body);
        }

        api.root.addEventListener('click', (event) => {
          const btn = event.target.closest('[data-ai-action]');
          if (!btn) return;
          const action = btn.dataset.aiAction;
          if (action === 'close') api.close();
          else if (action === 'generate') generate();
          else if (action === 'back') renderForm();
          else if (action === 'accept') {
            const selected = Array.from(
              api.body.querySelectorAll('[data-ai-index]:checked')
            ).map((el) => proposed[Number(el.dataset.aiIndex)]);
            if (!selected.length) {
              UI.toast('至少保留一个任务。', 'error');
              return;
            }
            selected.forEach((task) => Store.addTask(task));
            api.close();
            refresh();
            UI.toast(`已加入 ${selected.length} 项计划`, 'success');
          }
        });
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  function bind() {
    document.getElementById('plan-add-btn').addEventListener('click', openAdd);
    document.getElementById('plan-ai-btn').addEventListener('click', openAiPlan);
    document.getElementById('plan-prev').addEventListener('click', () => {
      state.date = U.addDays(state.date, -1);
      refresh();
    });
    document.getElementById('plan-next').addEventListener('click', () => {
      state.date = U.addDays(state.date, 1);
      refresh();
    });
    document.getElementById('plan-today').addEventListener('click', () => {
      state.date = U.todayKey();
      refresh();
    });
    els.weekStrip.addEventListener('click', (event) => {
      const day = event.target.closest('[data-plan-date]');
      if (!day) return;
      state.date = day.dataset.planDate;
      refresh();
    });
    els.taskList.addEventListener('click', async (event) => {
      const toggle = event.target.closest('[data-toggle-task]');
      if (toggle) {
        Store.toggleTask(toggle.dataset.toggleTask);
        refresh();
        return;
      }
      const edit = event.target.closest('[data-edit-task]');
      if (edit) {
        const task = Store.tasks().find((t) => t.id === edit.dataset.editTask);
        if (task) {
          SN.openTaskDialog({
            task,
            onSaved: () => refresh()
          });
        }
        return;
      }
      const del = event.target.closest('[data-delete-task]');
      if (del) {
        const task = Store.tasks().find((t) => t.id === del.dataset.deleteTask);
        if (!task) return;
        const ok = await UI.confirm({
          title: '删除这个任务？',
          message: `“${task.title}”将从这一天移除。`,
          confirmText: '删除',
          danger: true
        });
        if (!ok) return;
        Store.removeTask(task.id);
        refresh();
        UI.toast('任务已删除', 'success');
      }
    });
    document.getElementById('plan-move-unfinished').addEventListener('click', async () => {
      const undone = Store.tasksOn(state.date).filter((t) => !t.done);
      if (!undone.length) {
        UI.toast('这一天没有未完成任务。', 'info');
        return;
      }
      const next = U.addDays(state.date, 1);
      const ok = await UI.confirm({
        title: `顺延 ${undone.length} 项未完成任务？`,
        message: `它们会被移动到 ${U.formatDateFull(next)}。`,
        confirmText: '顺延'
      });
      if (!ok) return;
      undone.forEach((task) => Store.updateTask(task.id, { date: next }));
      refresh();
      UI.toast(`已顺延 ${undone.length} 项任务`, 'success');
    });
    document.getElementById('plan-clear-done').addEventListener('click', async () => {
      const done = Store.tasksOn(state.date).filter((t) => t.done);
      if (!done.length) {
        UI.toast('这一天还没有已完成任务。', 'info');
        return;
      }
      const ok = await UI.confirm({
        title: '清空已完成任务？',
        message: `将移除 ${done.length} 项已完成任务，无法恢复。`,
        confirmText: '清空',
        danger: true
      });
      if (!ok) return;
      done.forEach((task) => Store.removeTask(task.id));
      refresh();
      UI.toast('已清空完成任务', 'success');
    });
    SN.bus.on('tasks:changed', refresh);
  }

  function init() {
    els.weekStrip = document.getElementById('week-strip');
    els.taskList = document.getElementById('plan-task-list');
    els.ring = document.getElementById('plan-ring');
    els.dateChip = document.getElementById('plan-date-chip');
    els.statusChip = document.getElementById('plan-status-chip');
    els.subjectDist = document.getElementById('subject-dist-list');
    els.tip = document.getElementById('plan-tip-text');
    UI.hydrateIcons(document);
    bind();
    refresh();
    const params = new URLSearchParams(location.search);
    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      state.date = date;
      refresh();
    }
  }

  SN.Plan = { init, openAiPlan };
  SN.ready(() => {
    SN.Shell.init('plan').then(init);
  });
})(window);
