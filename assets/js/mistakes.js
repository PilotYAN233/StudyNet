/* StudyNet — smart mistake notebook */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const state = {
    subject: 'all',
    status: 'all',
    sort: 'recent',
    query: '',
    view: Store.readRaw('studynet.mistake.view', 'grid') === 'list' ? 'list' : 'grid'
  };

  const els = {};

  function isDue(item) {
    return item.mastery < 100 && item.review.next <= U.todayKey();
  }

  function isMastered(item) {
    return item.mastery >= 100;
  }

  function masteryColor(value) {
    if (value >= 80) return 'var(--mint)';
    if (value >= 40) return '#c78315';
    return 'var(--coral)';
  }

  /* ------------------------------------------------------------------ */
  /* Stats & filters                                                    */
  /* ------------------------------------------------------------------ */

  function renderStats() {
    const mistakes = Store.mistakes();
    const due = mistakes.filter(isDue).length;
    const weekAdded = mistakes.filter(
      (m) => U.daysBetween(U.dateKey(m.createdAt), U.todayKey()) <= 6
    ).length;
    const mastered = mistakes.filter(isMastered).length;
    els.stats.innerHTML = `
      <article class="mistake-stat" style="--stat-color:#3157f5;--stat-soft:#e9edff">
        <span class="mistake-stat__icon">${icon('notebook', { size: 18 })}</span>
        <div class="mistake-stat__body"><strong>${mistakes.length}</strong><span>全部错题</span></div>
      </article>
      <article class="mistake-stat" style="--stat-color:#ef735d;--stat-soft:#ffebe6">
        <span class="mistake-stat__icon">${icon('clock', { size: 18 })}</span>
        <div class="mistake-stat__body"><strong>${due}</strong><span>今日待复习</span></div>
      </article>
      <article class="mistake-stat" style="--stat-color:#c78315;--stat-soft:#fff4d8">
        <span class="mistake-stat__icon">${icon('plus', { size: 18 })}</span>
        <div class="mistake-stat__body"><strong>${weekAdded}</strong><span>本周新增</span></div>
      </article>
      <article class="mistake-stat" style="--stat-color:#179b7f;--stat-soft:#e1f7f0">
        <span class="mistake-stat__icon">${icon('check-circle', { size: 18 })}</span>
        <div class="mistake-stat__body"><strong>${mastered}</strong><span>已经掌握</span></div>
      </article>`;

    const banner = els.dueBanner;
    if (due) {
      const overdue = mistakes.filter(
        (m) => isDue(m) && m.review.next < U.todayKey()
      ).length;
      banner.hidden = false;
      els.dueBannerTitle.textContent = `今天有 ${due} 道错题需要复习`;
      els.dueBannerText.textContent = overdue
        ? `其中 ${overdue} 道已经逾期。先复习最久没见的那道，10 分钟就能启动。`
        : '按遗忘曲线复习，比反复看错题更有效。先回忆，再看答案。';
    } else {
      banner.hidden = true;
    }
  }

  function renderSubjectFilters() {
    const mistakes = Store.mistakes();
    const counts = {};
    mistakes.forEach((m) => {
      counts[m.subject] = (counts[m.subject] || 0) + 1;
    });
    const available = SN.SUBJECTS.filter((s) => counts[s.id]);
    els.subjectFilters.innerHTML =
      `<button type="button" class="filter-chip${
        state.subject === 'all' ? ' is-active' : ''
      }" data-subject-filter="all">全部</button>` +
      available
        .map(
          (s) =>
            `<button type="button" class="filter-chip${
              state.subject === s.id ? ' is-active' : ''
            }" data-subject-filter="${s.id}" style="--filter-color:${s.color}"><i></i>${s.name}${
              counts[s.id] ? ` ${counts[s.id]}` : ''
            }</button>`
        )
        .join('');
  }

  /* ------------------------------------------------------------------ */
  /* Grid                                                               */
  /* ------------------------------------------------------------------ */

  function filtered() {
    const query = state.query.trim().toLowerCase();
    let list = Store.mistakes();
    if (state.subject !== 'all') list = list.filter((m) => m.subject === state.subject);
    if (state.status === 'due') list = list.filter(isDue);
    else if (state.status === 'mastered') list = list.filter(isMastered);
    else if (state.status === 'starred') list = list.filter((m) => m.starred);
    if (query) {
      list = list.filter((m) =>
        [m.title, m.question, m.reason, m.correctAnswer, ...(m.knowledgePoints || [])]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }
    if (state.sort === 'recent') {
      list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } else if (state.sort === 'due') {
      list.sort((a, b) => {
        const av = a.review.next || '9999-12-31';
        const bv = b.review.next || '9999-12-31';
        return av.localeCompare(bv);
      });
    } else if (state.sort === 'mastery') {
      list.sort((a, b) => a.mastery - b.mastery);
    } else if (state.sort === 'difficulty') {
      list.sort((a, b) => b.difficulty - a.difficulty);
    }
    return list;
  }

  function dueLabel(item) {
    if (isMastered(item)) return '<span class="due-tag is-mastered">已掌握</span>';
    if (item.review.next <= U.todayKey()) {
      const overdue = U.daysBetween(item.review.next, U.todayKey());
      return `<span class="due-tag is-due">${overdue > 0 ? `逾期 ${overdue} 天` : '今天复习'}</span>`;
    }
    return `<span class="due-tag">${U.relativeDate(item.review.next)}复习</span>`;
  }

  function cardHTML(item) {
    const subject = U.subject(item.subject);
    const points = (item.knowledgePoints || []).slice(0, 3);
    return `<article class="mistake-card" data-mistake-id="${item.id}" style="--subject:${subject.color};--mastery-color:${masteryColor(
      item.mastery
    )}">
      <div class="mistake-card__head">
        <span class="subject-tag" style="--subject:${subject.color};--subject-soft:${subject.soft};--subject-ink:${subject.ink}"><i></i>${subject.name}</span>
        <span class="chip">${escapeHtml(item.source || '作业')}</span>
        <span class="mistake-card__date">${U.formatDateCN(item.createdAt, false)}</span>
        <button type="button" class="mistake-card__star${item.starred ? ' is-starred' : ''}" data-star="${item.id}" aria-label="${
      item.starred ? '取消重点标记' : '标记为重点'
    }">${icon('star', { size: 14 })}</button>
      </div>
      <h3 class="mistake-card__title">${escapeHtml(item.title)}</h3>
      <p class="mistake-card__excerpt">${escapeHtml(U.truncate(item.question, 90))}</p>
      ${
        points.length
          ? `<div class="mistake-card__tags">${points
              .map((p) => `<span class="knowledge-tag">${escapeHtml(p)}</span>`)
              .join('')}${
              (item.knowledgePoints || []).length > 3
                ? `<span class="knowledge-tag">+${item.knowledgePoints.length - 3}</span>`
                : ''
            }</div>`
          : ''
      }
      <div class="mistake-card__foot">
        <div class="mastery">
          <div class="mastery__label"><span>掌握度</span><strong>${item.mastery}%</strong></div>
          <div class="mastery__track"><span style="width:${item.mastery}%"></span></div>
        </div>
        ${dueLabel(item)}
      </div>
    </article>`;
  }

  function renderGrid() {
    const list = filtered();
    els.grid.classList.toggle('is-list', state.view === 'list');
    els.viewGrid.classList.toggle('is-active', state.view === 'grid');
    els.viewList.classList.toggle('is-active', state.view === 'list');
    if (!list.length) {
      const hasAny = Store.mistakes().length > 0;
      els.grid.innerHTML = `<div style="grid-column:1/-1">${UI.empty({
        icon: hasAny ? 'search' : 'notebook',
        title: hasAny ? '没有找到匹配的错题' : '错题本还空着',
        desc: hasAny
          ? '换一个关键词或筛选条件再试试。'
          : '记录第一道错题，让 AI 帮你找到真正的漏洞。',
        action: hasAny
          ? '<button type="button" class="btn btn--ghost" data-reset-filters>清除筛选</button>'
          : `<button type="button" class="btn btn--primary" data-add-empty>${icon('plus', {
              size: 16
            })}记录第一道错题</button>`
      })}</div>`;
      els.grid.querySelector('[data-reset-filters]')?.addEventListener('click', resetFilters);
      els.grid.querySelector('[data-add-empty]')?.addEventListener('click', openAdd);
      return;
    }
    els.grid.innerHTML = list.map(cardHTML).join('');
    UI.hydrateIcons(els.grid);
  }

  function resetFilters() {
    state.subject = 'all';
    state.status = 'all';
    state.query = '';
    state.sort = 'recent';
    els.search.value = '';
    els.status.value = 'all';
    els.sort.value = 'recent';
    renderSubjectFilters();
    renderGrid();
  }

  function refresh() {
    renderStats();
    renderSubjectFilters();
    renderGrid();
  }

  /* ------------------------------------------------------------------ */
  /* Detail drawer                                                      */
  /* ------------------------------------------------------------------ */

  function ratingLabel(rating) {
    return { again: '重新学', hard: '有点模糊', good: '掌握' }[rating] || '复习';
  }

  function detailBody(item) {
    const subject = U.subject(item.subject);
    const tags = (item.knowledgePoints || [])
      .map((p) => `<span class="knowledge-tag">${escapeHtml(p)}</span>`)
      .join('');
    const ai = item.ai;
    return `<div class="detail-hero">
        <div class="detail-hero__top">
          <span class="subject-tag" style="--subject:${subject.color};--subject-soft:${subject.soft};--subject-ink:${subject.ink}"><i></i>${subject.name}</span>
          <span class="chip">${escapeHtml(item.source || '作业')}</span>
          <span class="chip">${escapeHtml(item.errorType)}</span>
          <button type="button" class="mistake-card__star${item.starred ? ' is-starred' : ''}" data-detail-action="star" style="margin-left:auto" aria-label="切换重点标记">${icon(
      'star',
      { size: 15 }
    )}</button>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <div class="detail-hero__meta">
          <span>${U.formatDateFull(item.createdAt)}</span><i class="dot"></i>
          <span>复习 ${item.review.count} 次</span><i class="dot"></i>
          <span>${'★'.repeat(item.difficulty)}${'☆'.repeat(5 - item.difficulty)}</span>
        </div>
      </div>

      <section class="detail-section">
        <div class="detail-label"><span>题目</span><button type="button" class="field__hint-link" data-detail-action="edit">编辑</button></div>
        <div class="question-paper">${escapeHtml(item.question)}</div>
      </section>

      <section class="detail-section">
        <div class="detail-label">答案对照</div>
        <div class="answer-compare">
          <div class="answer-box"><div class="answer-box__label">${icon('x', {
            size: 12
          })} 我的答案</div><p>${item.myAnswer ? escapeHtml(item.myAnswer) : '<span class="muted">未填写</span>'}</p></div>
          <div class="answer-box answer-box--right"><div class="answer-box__label">${icon('check', {
            size: 12
          })} 正确答案</div><div class="markdown" style="font-size:10.5px;line-height:1.7">${
      item.correctAnswer
        ? UI.renderMarkdown(item.correctAnswer)
        : '<p class="muted">还没有参考答案，可以点下面的 AI 深度解析。</p>'
    }</div></div>
        </div>
      </section>

      <section class="detail-section">
        <div class="detail-label">错因与掌握度</div>
        <div class="detail-chip-row">${tags || '<span class="knowledge-tag">暂未标记知识点</span>'}</div>
        ${
          item.reason
            ? `<p style="margin-top:10px;color:var(--ink-2);font-size:11px;line-height:1.7">${escapeHtml(
                item.reason
              )}</p>`
            : ''
        }
        <div class="mastery" style="margin-top:14px;--mastery-color:${masteryColor(item.mastery)}">
          <div class="mastery__label"><span>当前掌握度</span><strong>${item.mastery}%</strong></div>
          <div class="mastery__track" style="height:5px"><span style="width:${item.mastery}%"></span></div>
        </div>
      </section>

      <section class="detail-section">
        <div class="detail-label"><span>AI 深度解析</span>${
          ai ? '<span class="chip chip--primary">已生成</span>' : ''
        }</div>
        ${
          ai
            ? `<div class="ai-analysis">
                <div class="ai-analysis__head">${icon('sparkles', { size: 15 })} 错因诊断 · ${escapeHtml(
                ai.errorType || item.errorType
              )}</div>
                <p class="ai-analysis__summary">${escapeHtml(ai.reason || '')}</p>
                ${
                  (ai.solutionSteps || []).length
                    ? `<div class="solution-steps">${ai.solutionSteps
                        .map(
                          (step, i) =>
                            `<div class="solution-step"><i>${i + 1}</i><span>${escapeHtml(step)}</span></div>`
                        )
                        .join('')}</div>`
                    : ''
                }
                ${
                  (ai.tips || []).length
                    ? `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #e1e5f5"><div class="detail-label" style="margin-bottom:6px">避坑提醒</div>${ai.tips
                        .map(
                          (tip) =>
                            `<div class="solution-step"><i style="background:var(--amber-soft);color:#9a670d">!</i><span>${escapeHtml(
                              tip
                            )}</span></div>`
                        )
                        .join('')}</div>`
                    : ''
                }
                ${
                  ai.similarQuestion
                    ? `<details style="margin-top:12px;border-top:1px solid #e1e5f5;padding-top:10px">
                        <summary style="cursor:pointer;color:var(--primary);font-size:9px;font-weight:700">查看同类变式练习</summary>
                        <div class="question-paper" style="margin-top:8px;font-size:10.5px">${escapeHtml(
                          ai.similarQuestion.question
                        )}</div>
                        <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--mint);font-size:9px;font-weight:700">查看变式答案</summary><div class="markdown" style="margin-top:6px;font-size:10.5px">${UI.renderMarkdown(
                          ai.similarQuestion.answer
                        )}</div></details>
                      </details>`
                    : ''
                }
              </div>`
            : `<div class="ai-analysis">
                <div class="ai-analysis__head">${icon('wand', { size: 15 })} 还没有 AI 解析</div>
                <p class="ai-analysis__summary">让 AI 判断错因、补全关键步骤，并生成一道同类变式题。</p>
                <button type="button" class="btn btn--soft btn--sm" data-detail-action="analyze" style="margin-top:10px">${icon(
                  'sparkles',
                  { size: 14 }
                )}开始 AI 解析</button>
              </div>`
        }
      </section>

      <section class="detail-section">
        <div class="detail-label"><span>复习记录</span><span>${U.relativeDate(item.review.next)}再复习</span></div>
        ${
          (item.review.history || []).length
            ? `<div class="review-history">${[...item.review.history]
                .reverse()
                .slice(0, 6)
                .map(
                  (h) =>
                    `<div class="review-history__item"><strong>${ratingLabel(h.rating)}</strong><span>${U.formatDateCN(
                      U.dateKey(h.date),
                      false
                    )}</span><span>掌握度 ${h.mastery}%</span></div>`
                )
                .join('')}</div>`
            : '<p class="review-mini-empty">还没有复习记录。第一次复习会在录入后的第二天。</p>'
        }
      </section>

      <div class="detail-actions">
        <button type="button" class="btn btn--primary" data-detail-action="review">${icon('play', {
          size: 15
        })}开始复习</button>
        <button type="button" class="btn btn--ghost" data-detail-action="analyze">${icon('brain', {
          size: 15
        })}AI 深度解析</button>
        <button type="button" class="btn btn--ghost" data-detail-action="edit">${icon('edit', {
          size: 15
        })}编辑</button>
        <button type="button" class="btn btn--danger-ghost" data-detail-action="delete">${icon('trash', {
          size: 15
        })}删除</button>
      </div>`;
  }

  function openDetail(id) {
    let item = Store.mistakes().find((m) => m.id === id);
    if (!item) {
      UI.toast('没有找到这道错题', 'error');
      return;
    }
    let analyzing = false;
    const ref = UI.modal({
      title: '错题详情',
      eyebrow: '错题本',
      size: 'drawer',
      body: `<div id="mistake-detail-content">${detailBody(item)}</div>`,
      footer: `<span class="dialog-foot-note">${icon('lock', {
        size: 14
      })} 只保存在本机</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-detail-action="close">关闭</button><button type="button" class="btn btn--primary" data-detail-action="review">${icon(
        'play',
        { size: 14 }
      )}开始复习</button>`,
      onMount(api) {
        const content = api.body.querySelector('#mistake-detail-content');
        UI.typeset(content);
        UI.hydrateIcons(content);

        function repaint() {
          content.innerHTML = detailBody(item);
          UI.typeset(content);
          UI.hydrateIcons(content);
        }

        api.root.addEventListener('click', async (event) => {
          const action = event.target.closest('[data-detail-action]');
          if (!action) return;
          const name = action.dataset.detailAction;
          if (name === 'close') {
            api.close();
            return;
          }
          if (name === 'review') {
            api.close();
            startReview(item.id);
            return;
          }
          if (name === 'star') {
            item = Store.updateMistake(item.id, { starred: !item.starred });
            repaint();
            renderGrid();
            return;
          }
          if (name === 'edit') {
            api.close();
            SN.openMistakeDialog({
              mistake: item,
              onSaved: (saved) => {
                refresh();
                if (saved) setTimeout(() => openDetail(saved.id), 180);
              }
            });
            return;
          }
          if (name === 'delete') {
            const ok = await UI.confirm({
              title: '删除这道错题？',
              message: `“${item.title}”的题目、解析和复习记录都会被删除。`,
              confirmText: '删除',
              danger: true
            });
            if (!ok) return;
            Store.removeMistake(item.id);
            api.close();
            refresh();
            UI.toast('错题已删除', 'success');
            return;
          }
          if (name === 'analyze') {
            if (analyzing) return;
            analyzing = true;
            UI.setButtonLoading(action, true, 'AI 分析中');
            try {
              const result = await SN.AI.analyzeMistake(item);
              const current = Store.mistakes().find((m) => m.id === item.id) || item;
              const points = Array.from(
                new Set([...(current.knowledgePoints || []), ...(result.knowledgePoints || [])])
              ).slice(0, 12);
              item = Store.updateMistake(item.id, {
                ai: result,
                errorType: result.errorType || current.errorType,
                knowledgePoints: points,
                difficulty: result.difficulty || current.difficulty,
                correctAnswer: current.correctAnswer || result.correctAnswer || '',
                reason: current.reason || result.reason || ''
              });
              repaint();
              renderGrid();
              renderStats();
              UI.toast('AI 解析已生成', 'success');
            } catch (err) {
              UI.toast(err.message || 'AI 分析失败，请稍后再试。', 'error');
            } finally {
              analyzing = false;
              if (action.isConnected) UI.setButtonLoading(action, false);
            }
          }
        });
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* Review                                                             */
  /* ------------------------------------------------------------------ */

  function startReview(singleId) {
    let queue;
    if (singleId) {
      const item = Store.mistakes().find((m) => m.id === singleId);
      queue = item ? [item] : [];
    } else {
      queue = Store.dueMistakes();
    }
    if (!queue.length) {
      UI.toast('今天没有到期错题，去记录一道新错题吧。', 'info');
      return;
    }
    let index = 0;
    let reviewed = 0;
    let finished = false;
    const ref = UI.modal({
      title: '今日错题复习',
      eyebrow: 'SPACED REVIEW',
      subtitle: '先在心里回答一遍，再看答案。',
      size: 'lg',
      body: '<div id="review-root"></div>',
      footer: `<span class="dialog-foot-note">${icon('brain', {
        size: 14
      })} 按遗忘曲线安排下一次</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-review-close>退出复习</button>`,
      onMount(api) {
        const root = api.body.querySelector('#review-root');

        function render() {
          if (index >= queue.length) {
            finished = true;
            api.root.querySelector('.sn-dialog__head h2').textContent = '这一轮复习完成';
            root.innerHTML = `<div class="review-sheet" style="padding:10px 0 12px">
              <div class="setup-done__mark" style="margin:0 auto 18px">${icon('check', {
                size: 28,
                strokeWidth: 2.2
              })}</div>
              <h2 style="font-size:23px">刚刚复习了 ${reviewed} 道错题</h2>
              <p style="margin:7px auto 0;max-width:360px;color:var(--muted);font-size:10.5px;line-height:1.7">记忆需要间隔。下一次它们会在合适的时间回来，不用今天一次做完。</p>
              <div class="setup-ready-list" style="justify-content:center;margin-top:18px">
                <span>${icon('check', { size: 13 })} 已完成 ${reviewed} 道</span>
                <span>${icon('clock', { size: 13 })} 下次按时复习</span>
              </div>
            </div>`;
            api.root.querySelector('[data-review-close]').textContent = '完成';
            refresh();
            return;
          }
          const item = queue[index];
          const subject = U.subject(item.subject);
          const answer = item.correctAnswer || (item.ai && item.ai.correctAnswer) || '';
          root.innerHTML = `<div class="review-sheet">
            <div class="review-sheet__top">
              <span class="subject-tag" style="--subject:${subject.color};--subject-soft:${subject.soft};--subject-ink:${subject.ink}"><i></i>${subject.name}</span>
              <span>${index + 1} / ${queue.length}</span>
              <div class="review-progress">${queue
                .map((_, i) => `<i class="${i < index ? 'is-done' : ''}"></i>`)
                .join('')}</div>
            </div>
            <h3 style="font-size:15px;margin-bottom:10px">${escapeHtml(item.title)}</h3>
            <div class="review-question">${escapeHtml(item.question)}</div>
            <div class="review-answer" data-review-answer><div class="detail-label" style="margin-bottom:5px">参考答案</div><div class="markdown" style="font-size:11.5px">${
              answer ? UI.renderMarkdown(answer) : '<p class="muted">暂无参考答案，可以回去补充，或先口述自己的思路。</p>'
            }</div></div>
            <button type="button" class="btn btn--dark review-reveal" data-review-reveal>${icon('eye', {
              size: 15
            })}我回答完了，看答案</button>
            <div class="review-rating" data-review-rating>
              <button type="button" data-rating="again" style="--rating-color:#d94d42;--rating-soft:#fdecea"><span>完全忘了</span><strong>明天再来</strong></button>
              <button type="button" data-rating="hard" style="--rating-color:#c78315;--rating-soft:#fff4d8"><span>有点模糊</span><strong>缩短间隔</strong></button>
              <button type="button" data-rating="good" style="--rating-color:#179b7f;--rating-soft:#e1f7f0"><span>已经掌握</span><strong>拉长间隔</strong></button>
            </div>
          </div>`;
          UI.typeset(root);
          UI.hydrateIcons(root);
        }

        root.addEventListener('click', (event) => {
          const reveal = event.target.closest('[data-review-reveal]');
          if (reveal) {
            root.querySelector('[data-review-answer]').classList.add('is-open');
            root.querySelector('[data-review-rating]').classList.add('is-open');
            reveal.style.display = 'none';
            return;
          }
          const rating = event.target.closest('[data-rating]');
          if (rating) {
            const item = queue[index];
            Store.reviewMistake(item.id, rating.dataset.rating);
            reviewed += 1;
            index += 1;
            render();
            root.scrollIntoView({ block: 'nearest' });
          }
        });

        api.root.querySelector('[data-review-close]').addEventListener('click', () => api.close());
        render();
      },
      onClose() {
        refresh();
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* AI report                                                          */
  /* ------------------------------------------------------------------ */

  function reportLoadingHTML() {
    return `<div class="ai-plan-loading">
      <span class="ai-plan-loading__orb">${icon('brain', { size: 27 })}</span>
      <h3>正在翻阅你的错题</h3>
      <p>寻找反复出现的错因和可以马上补上的漏洞。</p>
      <div class="ai-plan-loading__steps">
        <span>${icon('check', { size: 13 })}归类学科与知识点</span>
        <span>${icon('check', { size: 13 })}识别高频错误模式</span>
        <span>${icon('check', { size: 13 })}生成 7 天行动清单</span>
      </div>
    </div>`;
  }

  async function generateReport() {
    const mistakes = Store.mistakes();
    if (!mistakes.length) {
      UI.toast('至少记录一道错题后，才能生成归因报告。', 'info');
      return;
    }
    const ref = UI.modal({
      title: 'AI 错因归纳报告',
      eyebrow: 'MISTAKE INTELLIGENCE',
      subtitle: `基于 ${mistakes.length} 道错题 · 找出真正该补的地方`,
      size: 'lg',
      body: reportLoadingHTML(),
      footer: `<span class="dialog-foot-note">${icon('sparkles', {
        size: 14
      })} 由 AI 生成，请结合老师讲评判断</span><span class="dialog-foot-spacer"></span><button type="button" class="btn btn--ghost" data-report-close>关闭</button>`,
      onMount(api) {
        api.root.querySelector('[data-report-close]').addEventListener('click', () => api.close());
        (async () => {
          try {
            const content = await SN.AI.summarizeMistakes(mistakes);
            Store.addReport({ kind: 'mistake-report', content, date: U.todayKey(), count: mistakes.length });
            api.body.innerHTML = `<div class="report-sheet">
              <div class="report-sheet__hero"><span class="ai-orb-mini">${icon('brain', {
                size: 20
              })}</span><div><strong>错因归纳报告</strong><span>${mistakes.length} 道错题 · ${U.formatDateFull(
              U.todayKey()
            )}</span></div></div>
              <div class="markdown">${UI.renderMarkdown(content)}</div>
            </div>`;
            UI.typeset(api.body);
            UI.hydrateIcons(api.body);
          } catch (err) {
            api.body.innerHTML = `<div class="empty-state" style="min-height:300px">
              <span class="empty-state__art" style="background:var(--danger-soft);color:var(--danger)">${icon(
                'alert',
                { size: 24 }
              )}</span>
              <h3>报告没有生成成功</h3>
              <p>${escapeHtml(err.message || '请稍后重试。')}</p>
              <button type="button" class="btn btn--soft" data-report-retry>${icon('refresh', {
                size: 15
              })}再试一次</button>
            </div>`;
            api.body.querySelector('[data-report-retry]').addEventListener('click', () => {
              api.close();
              setTimeout(generateReport, 150);
            });
          }
        })();
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  function openAdd() {
    SN.openMistakeDialog({
      onSaved: () => {
        refresh();
        UI.toast('错题已经放入复习队列', 'success');
      }
    });
  }

  function bind() {
    els.addBtn.addEventListener('click', openAdd);
    els.reportBtn.addEventListener('click', generateReport);
    els.dueReviewBtn.addEventListener('click', () => startReview());
    UI.debounceInput(els.search, () => {
      state.query = els.search.value;
      renderGrid();
    }, 140);
    els.status.addEventListener('change', () => {
      state.status = els.status.value;
      renderGrid();
    });
    els.sort.addEventListener('change', () => {
      state.sort = els.sort.value;
      renderGrid();
    });
    els.subjectFilters.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-subject-filter]');
      if (!chip) return;
      state.subject = chip.dataset.subjectFilter;
      renderSubjectFilters();
      renderGrid();
    });
    els.grid.addEventListener('click', (event) => {
      const star = event.target.closest('[data-star]');
      if (star) {
        event.stopPropagation();
        const item = Store.mistakes().find((m) => m.id === star.dataset.star);
        if (item) {
          Store.updateMistake(item.id, { starred: !item.starred });
          renderGrid();
        }
        return;
      }
      const card = event.target.closest('[data-mistake-id]');
      if (card) openDetail(card.dataset.mistakeId);
    });
    els.viewGrid.addEventListener('click', () => {
      state.view = 'grid';
      Store.writeRaw('studynet.mistake.view', 'grid');
      renderGrid();
    });
    els.viewList.addEventListener('click', () => {
      state.view = 'list';
      Store.writeRaw('studynet.mistake.view', 'list');
      renderGrid();
    });
    SN.bus.on('mistakes:changed', refresh);
  }

  function init() {
    els.stats = document.getElementById('mistake-stats');
    els.grid = document.getElementById('mistake-grid');
    els.search = document.getElementById('mistake-search');
    els.status = document.getElementById('status-filter');
    els.sort = document.getElementById('sort-filter');
    els.subjectFilters = document.getElementById('subject-filters');
    els.viewGrid = document.getElementById('view-grid');
    els.viewList = document.getElementById('view-list');
    els.addBtn = document.getElementById('mistake-add-btn');
    els.reportBtn = document.getElementById('mistake-report-btn');
    els.dueBanner = document.getElementById('due-banner');
    els.dueBannerTitle = document.getElementById('due-banner-title');
    els.dueBannerText = document.getElementById('due-banner-text');
    els.dueReviewBtn = document.getElementById('due-review-btn');

    UI.hydrateIcons(document);
    bind();
    refresh();

    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const review = params.get('review');
    if (id) setTimeout(() => openDetail(id), 250);
    else if (review === 'due') setTimeout(() => startReview(), 350);
  }

  SN.Mistakes = { init, openDetail, startReview, generateReport };
  SN.ready(() => {
    SN.Shell.init('mistakes').then(init);
  });
})(window);
