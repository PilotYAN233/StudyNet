/* StudyNet — app shell, onboarding and shared study forms */
(function (global) {
  'use strict';

  const SN = (global.SN = global.SN || {});
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const NAV = [
    {
      label: '学习台',
      items: [
        { id: 'dashboard', label: '学习首页', href: 'index.html', icon: 'home' },
        { id: 'chat', label: 'AI 答疑', href: 'chat.html', icon: 'sparkles', badge: 'AI' },
        { id: 'mistakes', label: '智能错题本', href: 'mistakes.html', icon: 'notebook' }
      ]
    },
    {
      label: '学习节奏',
      items: [
        { id: 'plan', label: '每日计划', href: 'plan.html', icon: 'calendar' },
        { id: 'focus', label: '专注空间', href: 'focus.html', icon: 'timer' }
      ]
    },
    {
      label: '系统',
      items: [{ id: 'settings', label: '设置与档案', href: 'settings.html', icon: 'settings' }]
    }
  ];

  const PAGE_META = {
    dashboard: { group: '学习台', label: '学习首页' },
    chat: { group: '学习台', label: 'AI 答疑' },
    mistakes: { group: '学习台', label: '智能错题本' },
    plan: { group: '学习节奏', label: '每日计划' },
    focus: { group: '学习节奏', label: '专注空间' },
    settings: { group: '系统', label: '设置与档案' }
  };

  function brand(compact) {
    return `<a class="brand${compact ? ' brand--compact' : ''}" href="index.html" aria-label="StudyNet 学习首页">
      <span class="brand__mark">${icon('sparkles', { size: 21, strokeWidth: 2 })}</span>
      <span class="brand__text"><strong>StudyNet</strong><small>学习舱</small></span>
    </a>`;
  }

  function activePage(page) {
    return document.body.dataset.page || page || 'dashboard';
  }

  function renderSidebar(page) {
    const host = document.getElementById('sidebar');
    if (!host) return;
    const config = Store.config();
    const profile = Store.profile();
    const week = Store.weekStats();
    const weekMinutes = U.sum(week, (d) => d.minutes);
    const goal = Math.max(30, (profile.dailyMinutes || 90) * 7);
    const percent = U.clamp(Math.round((weekMinutes / goal) * 100), 0, 100);
    const due = Store.dueMistakes().length;

    host.className = 'sidebar';
    host.innerHTML = `
      <div class="sidebar__top">
        ${brand()}
      </div>
      <nav class="sidebar__nav" aria-label="主导航">
        ${NAV.map(
          (group) => `<div class="nav-group">
            <p class="nav-group__label">${group.label}</p>
            ${group.items
              .map((item) => {
                const active = item.id === page;
                const badge =
                  item.id === 'mistakes' && due
                    ? `<span class="nav-item__count">${due > 9 ? '9+' : due}</span>`
                    : item.badge
                    ? `<span class="nav-item__badge">${item.badge}</span>`
                    : '';
                return `<a class="nav-item${active ? ' is-active' : ''}" href="${item.href}" ${
                  active ? 'aria-current="page"' : ''
                } title="${item.label}">
                  <span class="nav-item__icon">${icon(item.icon, { size: 20 })}</span>
                  <span class="nav-item__label">${item.label}</span>
                  ${badge}
                </a>`;
              })
              .join('')}
          </div>`
        ).join('')}
      </nav>
      <div class="sidebar__bottom">
        <a class="sidebar-focus" href="focus.html">
          <div class="sidebar-focus__top">
            <span class="sidebar-focus__icon">${icon('target', { size: 17 })}</span>
            <span>本周专注</span>
            <strong>${percent}%</strong>
          </div>
          <div class="sidebar-focus__bar"><span style="width:${percent}%"></span></div>
          <p><strong>${U.formatDuration(weekMinutes, true)}</strong> / ${U.formatDuration(goal, true)}</p>
        </a>
        <a class="sidebar-user" href="settings.html">
          ${UI.avatar(profile.name || '同学', { size: 36 })}
          <span class="sidebar-user__meta">
            <strong>${escapeHtml(U.greetingName(profile))}</strong>
            <small>${escapeHtml(profile.grade || '初中')} · ${config.apiKey ? 'AI 已连接' : '待配置'}</small>
          </span>
          <span class="sidebar-user__chevron">${icon('chevron-right', { size: 16 })}</span>
        </a>
      </div>`;
  }

  function renderTopbar(page) {
    const host = document.getElementById('topbar');
    if (!host) return;
    const meta = PAGE_META[page] || PAGE_META.dashboard;
    const profile = Store.profile();
    const config = Store.config();
    const now = new Date();
    const streak = Store.streak();
    host.className = 'topbar';
    host.innerHTML = `
      <div class="topbar__left">
        <div class="topbar__mobile-brand">${brand(true)}</div>
        <div class="topbar__crumb"><span>${meta.group}</span><i>/</i><strong>${meta.label}</strong></div>
        <span class="topbar__date">${now.getMonth() + 1}月${now.getDate()}日 · ${U.weekdayCN(
      U.todayKey()
    )}</span>
      </div>
      <div class="topbar__right">
        <span class="save-pill" title="数据保存在当前浏览器，不会自动同步"><i></i>本机保存</span>
        ${
          streak
            ? `<span class="streak-pill" title="连续学习天数">${icon('flame', { size: 15 })}<strong>${streak}</strong> 天</span>`
            : ''
        }
        ${
          config.apiKey
            ? `<span class="model-pill" title="当前 AI 模型">${icon('sparkles', { size: 14 })} ${escapeHtml(
                config.model || 'AI'
              )}</span>`
            : `<a class="config-pill" href="settings.html">${icon('key', { size: 14 })} 配置 AI</a>`
        }
        <a class="icon-btn topbar__focus" href="focus.html" title="进入专注空间" aria-label="进入专注空间">${icon(
          'timer',
          { size: 19 }
        )}</a>
        <a class="topbar__avatar" href="settings.html" aria-label="打开学习档案">
          ${UI.avatar(profile.name || '同学', { size: 34 })}
        </a>
      </div>`;
  }

  function renderMobileNav(page) {
    const host = document.getElementById('mobile-nav');
    if (!host) return;
    const due = Store.dueMistakes().length;
    const items = [
      { id: 'dashboard', href: 'index.html', icon: 'home', label: '首页' },
      { id: 'mistakes', href: 'mistakes.html', icon: 'notebook', label: '错题', badge: due },
      { id: 'chat', href: 'chat.html', icon: 'sparkles', label: 'AI 答疑', ai: true },
      { id: 'plan', href: 'plan.html', icon: 'calendar', label: '计划' },
      { id: 'settings', href: 'settings.html', icon: 'settings', label: '我的' }
    ];
    host.className = 'mobile-nav';
    host.innerHTML = items
      .map((item) => {
        const active = item.id === page;
        return `<a class="mobile-nav__item${active ? ' is-active' : ''}${item.ai ? ' mobile-nav__item--ai' : ''}" href="${
          item.href
        }" ${active ? 'aria-current="page"' : ''}>
          <span class="mobile-nav__icon">${icon(item.icon, { size: item.ai ? 22 : 21 })}</span>
          <span class="mobile-nav__label">${item.label}</span>
          ${
            item.badge
              ? `<span class="mobile-nav__badge">${item.badge > 9 ? '9+' : item.badge}</span>`
              : ''
          }
        </a>`;
      })
      .join('');
  }

  function refresh() {
    const page = activePage();
    renderSidebar(page);
    renderTopbar(page);
    renderMobileNav(page);
  }

  /* ------------------------------------------------------------------ */
  /* Onboarding                                                         */
  /* ------------------------------------------------------------------ */

  let onboardingOpen = false;

  function openOnboarding(force) {
    if (onboardingOpen && !force) return;
    if (document.getElementById('onboarding')) return;
    onboardingOpen = true;
    const existingConfig = Store.config();
    const existingProfile = Store.profile();
    const state = {
      step: existingProfile.setupComplete ? 2 : 1,
      profile: {
        name: existingProfile.name || '',
        grade: existingProfile.grade || '八年级',
        dailyMinutes: existingProfile.dailyMinutes || 90,
        goal: existingProfile.goal || ''
      },
      config: {
        provider: existingConfig.provider || 'deepseek',
        baseUrl: existingConfig.baseUrl || 'https://api.deepseek.com/v1',
        model: existingConfig.model || 'deepseek-chat',
        apiKey: existingConfig.apiKey || '',
        route: existingConfig.route || 'auto',
        temperature: existingConfig.temperature == null ? 0.5 : existingConfig.temperature,
        maxTokens: existingConfig.maxTokens || 1800,
        streaming: existingConfig.streaming !== false
      },
      tested: existingConfig.lastTest === 'ok',
      testing: false
    };
    if (existingConfig.apiKey && existingConfig.configuredAt && existingProfile.setupComplete) {
      // Normally unreachable; settings edits configuration in-place.
      state.step = 2;
    }

    const root = document.createElement('div');
    root.id = 'onboarding';
    root.className = 'onboarding';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'onboarding-title');
    root.innerHTML = `
      <div class="onboarding__glow onboarding__glow--one"></div>
      <div class="onboarding__glow onboarding__glow--two"></div>
      <div class="onboarding__panel">
        <aside class="onboarding__story">
          <div class="onboarding__story-head">
            ${brand()}
            <span class="onboarding__beta">AI STUDY OS</span>
          </div>
          <div class="onboarding__story-copy">
            <span class="eyebrow">为初中三年准备的学习工作台</span>
            <h1 id="onboarding-title">把今天的努力，<br><em>收进明天的底气。</em></h1>
            <p>AI 答疑、错题归纳、每日计划和专注时钟，在一个看板里形成你的学习闭环。</p>
          </div>
          <div class="onboarding__mock" aria-hidden="true">
            <div class="mock-card mock-card--task">
              <span class="mock-card__label">${icon('calendar', { size: 14 })} 今日计划</span>
              <div class="mock-task"><i></i><span>数学 · 二次函数练习</span><b>25m</b></div>
              <div class="mock-task"><i></i><span>英语 · 课文背诵</span><b>15m</b></div>
              <div class="mock-task is-done"><i>${icon('check', { size: 10 })}</i><span>语文 · 古诗默写</span><b>10m</b></div>
            </div>
            <div class="mock-card mock-card--focus">
              <span class="mock-card__label">${icon('timer', { size: 14 })} 专注时钟</span>
              <strong>25:00</strong>
              <div class="mock-focus-bar"><span></span></div>
              <small>正在专注 · 数学</small>
            </div>
            <div class="mock-card mock-card--wrong">
              <span class="mock-card__icon">${icon('brain', { size: 18 })}</span>
              <div><b>3 道错题</b><small>今天适合复习</small></div>
            </div>
            <div class="mock-orbit mock-orbit--one"></div>
            <div class="mock-orbit mock-orbit--two"></div>
          </div>
          <div class="onboarding__story-foot">
            <span>${icon('shield', { size: 16 })} 数据留在这台设备</span>
            <span>·</span>
            <span>无需注册账号</span>
          </div>
        </aside>
        <section class="onboarding__form-wrap">
          <div class="onboarding__form-head">
            <div class="onboarding__mobile-brand">${brand()}</div>
            <span class="onboarding__step-count">SETUP <b id="setup-step-number">01</b> / 03</span>
          </div>
          <div class="setup-progress" aria-hidden="true">
            <span data-progress="1"></span><span data-progress="2"></span><span data-progress="3"></span>
          </div>
          <form id="setup-form" class="setup-form" novalidate>
            <section class="setup-step" data-step="1">
              <div class="setup-title">
                <span class="eyebrow">先认识一下</span>
                <h2>你的学习舱，<br>从一个小目标开始。</h2>
                <p>这些信息只用来调整 AI 的回答方式和计划强度。</p>
              </div>
              <label class="field">
                <span class="field__label">怎么称呼你</span>
                <input class="input input--lg" id="setup-name" type="text" maxlength="12" placeholder="例如：小林" autocomplete="nickname" value="${escapeHtml(
                  state.profile.name
                )}">
              </label>
              <div class="field">
                <span class="field__label">目前年级</span>
                <div class="choice-chips" data-choice-group="grade">
                  ${['七年级', '八年级', '九年级']
                    .map(
                      (g) =>
                        `<label class="choice-chip"><input type="radio" name="grade" value="${g}" ${
                          state.profile.grade === g ? 'checked' : ''
                        }><span>${g}</span></label>`
                    )
                    .join('')}
                </div>
              </div>
              <div class="field">
                <span class="field__label">每天愿意投入多久</span>
                <div class="choice-chips" data-choice-group="minutes">
                  ${[
                    [60, '1 小时'],
                    [90, '1.5 小时'],
                    [120, '2 小时'],
                    [180, '3 小时']
                  ]
                    .map(
                      ([v, label]) =>
                        `<label class="choice-chip"><input type="radio" name="dailyMinutes" value="${v}" ${
                          Number(state.profile.dailyMinutes) === v ? 'checked' : ''
                        }><span>${label}</span></label>`
                    )
                    .join('')}
                </div>
              </div>
              <label class="field">
                <span class="field__label">近期最想达成的一件事 <small>选填</small></span>
                <input class="input" id="setup-goal" type="text" maxlength="60" placeholder="例如：数学稳定在 105 分以上" value="${escapeHtml(
                  state.profile.goal
                )}">
              </label>
            </section>

            <section class="setup-step" data-step="2" hidden>
              <div class="setup-title">
                <span class="eyebrow">连接你的 AI</span>
                <h2>填入自己的 API Key，<br>让学习搭子上线。</h2>
                <p>StudyNet 不内置公共密钥。你使用的模型由自己掌控，费用也直接结算给服务商。</p>
              </div>
              <div class="provider-grid" data-provider-grid>
                ${Object.values(SN.PROVIDERS)
                  .map(
                    (p) => `<button type="button" class="provider-card${
                      state.config.provider === p.id ? ' is-active' : ''
                    }" data-provider="${p.id}">
                      <span class="provider-card__logo">${escapeHtml(p.name.slice(0, 1))}</span>
                      <span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.note)}</small></span>
                      <i>${icon('check', { size: 13 })}</i>
                    </button>`
                  )
                  .join('')}
              </div>
              <label class="field">
                <span class="field__label">API Key <button type="button" class="field__hint-link" id="setup-key-help">去哪里获取？</button></span>
                <div class="input-affix">
                  <input class="input" id="setup-key" type="password" placeholder="sk-..." autocomplete="off" spellcheck="false" enterkeyhint="next" value="${escapeHtml(
                    state.config.apiKey
                  )}">
                  <button type="button" class="input-affix__btn" id="setup-key-toggle" aria-label="显示或隐藏 API Key">${icon(
                    'eye',
                    { size: 18 }
                  )}</button>
                </div>
                <span class="field__help" id="setup-key-help-text">Key 只保存在当前浏览器的本地存储中。请不要在公共电脑上保存。</span>
              </label>
              <div class="form-grid form-grid--two">
                <label class="field">
                  <span class="field__label">模型</span>
                  <input class="input" id="setup-model" type="text" spellcheck="false" placeholder="deepseek-chat" value="${escapeHtml(
                    state.config.model
                  )}">
                </label>
                <label class="field">
                  <span class="field__label">接口地址</span>
                  <input class="input" id="setup-base" type="url" spellcheck="false" placeholder="https://api.deepseek.com/v1" value="${escapeHtml(
                    state.config.baseUrl
                  )}">
                </label>
              </div>
              <div class="setup-test-row">
                <button type="button" class="btn btn--soft btn--sm" id="setup-test">${icon('zap', {
                  size: 16
                })} 测试连接</button>
                <span class="setup-test-status" id="setup-test-status">${
                  state.tested ? `${icon('check-circle', { size: 15 })} 已连接过，可再次测试` : '建议先测试一次'
                }</span>
              </div>
              <details class="setup-advanced">
                <summary>高级选项 <span>可选</span></summary>
                <div class="form-grid form-grid--two">
                  <label class="field">
                    <span class="field__label">请求通道</span>
                    <select class="input" id="setup-route">
                      <option value="auto" ${state.config.route === 'auto' ? 'selected' : ''}>自动（推荐）</option>
                      <option value="direct" ${state.config.route === 'direct' ? 'selected' : ''}>浏览器直连</option>
                      <option value="proxy" ${state.config.route === 'proxy' ? 'selected' : ''}>Cloudflare 中转</option>
                    </select>
                  </label>
                  <div class="field field--note">
                    <span class="field__label">隐私说明</span>
                    <p>部署在 Cloudflare Pages 时，官方模型会经由同源函数转发，密钥不会被服务器保存。</p>
                  </div>
                </div>
              </details>
              <div class="setup-privacy">${icon('lock', { size: 15 })} <span>没有注册、没有云端账号。你的计划、错题和对话都保存在本机浏览器。</span></div>
            </section>

            <section class="setup-step" data-step="3" hidden>
              <div class="setup-done">
                <span class="setup-done__mark">${icon('check', { size: 30, strokeWidth: 2.2 })}</span>
                <span class="eyebrow">一切就绪</span>
                <h2>学习舱已经准备好。</h2>
                <p>从今天的第一个 25 分钟开始。StudyNet 会把你做过的每一道题，慢慢变成看得见的进步。</p>
                <div class="setup-summary">
                  <div><span>学习档案</span><strong id="summary-name">同学</strong><small id="summary-grade">八年级</small></div>
                  <div><span>AI 模型</span><strong id="summary-model">deepseek-chat</strong><small id="summary-provider">DeepSeek</small></div>
                  <div><span>每日目标</span><strong id="summary-minutes">90 分钟</strong><small>可随时在设置中调整</small></div>
                </div>
                <div class="setup-ready-list">
                  <span>${icon('check', { size: 14 })} AI 答疑</span>
                  <span>${icon('check', { size: 14 })} 智能错题本</span>
                  <span>${icon('check', { size: 14 })} 每日计划</span>
                  <span>${icon('check', { size: 14 })} 专注时钟</span>
                </div>
              </div>
            </section>
          </form>
          <footer class="setup-footer" id="setup-footer"></footer>
        </section>
      </div>
    `;
    document.body.appendChild(root);
    document.body.classList.add('is-onboarding');
    const appShell = document.querySelector('.app-shell');
    if (appShell) appShell.setAttribute('inert', '');
    requestAnimationFrame(() => root.classList.add('is-open'));

    const $ = (sel) => root.querySelector(sel);
    const form = $('#setup-form');
    const steps = root.querySelectorAll('.setup-step');
    const progress = root.querySelectorAll('[data-progress]');
    const footer = $('#setup-footer');
    const stepNumber = $('#setup-step-number');

    function readProfile() {
      const name = $('#setup-name').value.trim();
      const grade = form.querySelector('input[name="grade"]:checked');
      const minutes = form.querySelector('input[name="dailyMinutes"]:checked');
      return {
        name: name || '同学',
        grade: grade ? grade.value : '八年级',
        dailyMinutes: minutes ? Number(minutes.value) : 90,
        goal: $('#setup-goal').value.trim()
      };
    }

    function readConfig() {
      return {
        provider: state.config.provider,
        baseUrl: $('#setup-base').value.trim(),
        model: $('#setup-model').value.trim(),
        apiKey: $('#setup-key').value.trim(),
        route: $('#setup-route').value,
        temperature: state.config.temperature,
        maxTokens: state.config.maxTokens,
        streaming: state.config.streaming
      };
    }

    function validateProfile() {
      const data = readProfile();
      if (!data.name) {
        UI.toast('先写下怎么称呼你吧。', 'error');
        $('#setup-name').focus();
        return false;
      }
      state.profile = data;
      return true;
    }

    function validateConfig() {
      const cfg = readConfig();
      if (!cfg.apiKey) {
        UI.toast('请先填写自己的 API Key。', 'error');
        $('#setup-key').focus();
        return false;
      }
      if (!/^https?:\/\//i.test(cfg.baseUrl)) {
        UI.toast('接口地址需要以 https:// 开头。', 'error');
        $('#setup-base').focus();
        return false;
      }
      if (!cfg.model) {
        UI.toast('请填写要使用的模型名称。', 'error');
        $('#setup-model').focus();
        return false;
      }
      state.config = Object.assign({}, state.config, cfg);
      return true;
    }

    function updateSummary() {
      $('#summary-name').textContent = state.profile.name || '同学';
      $('#summary-grade').textContent = state.profile.grade;
      $('#summary-model').textContent = state.config.model;
      $('#summary-provider').textContent =
        (SN.PROVIDERS[state.config.provider] && SN.PROVIDERS[state.config.provider].name) || '自定义';
      $('#summary-minutes').textContent = `${state.profile.dailyMinutes} 分钟`;
    }

    // iOS keeps innerHeight at the full layout height when the keyboard opens.
    // Lift the fixed action bar by the visual-viewport keyboard inset so the
    // "保存并继续" button never ends up behind the keyboard.
    function syncKeyboardInset() {
      const viewport = global.visualViewport;
      if (!viewport || !footer.isConnected) return;
      const inset = Math.max(0, global.innerHeight - viewport.height - viewport.offsetTop);
      footer.style.setProperty('--setup-keyboard-inset', `${Math.round(inset)}px`);
    }

    function render() {
      steps.forEach((el) => {
        el.hidden = Number(el.dataset.step) !== state.step;
      });
      progress.forEach((el, i) => {
        el.classList.toggle('is-active', i + 1 === state.step);
        el.classList.toggle('is-done', i + 1 < state.step);
      });
      stepNumber.textContent = String(state.step).padStart(2, '0');
      form.scrollTop = 0;
      if (state.step === 1) {
        footer.innerHTML = `<span class="setup-footer__note">约 2 分钟完成设置</span>
          <button type="button" class="btn btn--primary" data-setup-next>继续 <span>${icon('arrow-right', {
            size: 17
          })}</span></button>`;
      } else if (state.step === 2) {
        footer.innerHTML = `<button type="button" class="btn btn--ghost" data-setup-back>${icon('arrow-left', {
          size: 17
        })} 返回</button>
          <button type="button" class="btn btn--primary" data-setup-next>下一步 <span>${icon('arrow-right', {
            size: 17
          })}</span></button>`;
      } else {
        updateSummary();
        footer.innerHTML = `<button type="button" class="btn btn--ghost" data-setup-back>${icon('arrow-left', {
          size: 17
        })} 返回检查</button>
          <button type="button" class="btn btn--primary btn--lg" data-setup-finish>进入我的学习舱 ${icon(
            'arrow-right',
            { size: 18 }
          )}</button>`;
      }
      const next = footer.querySelector('[data-setup-next]');
      if (next) next.addEventListener('click', goNext);
      const back = footer.querySelector('[data-setup-back]');
      if (back) back.addEventListener('click', () => {
        if (state.step > 1) {
          state.step -= 1;
          render();
        }
      });
      const finish = footer.querySelector('[data-setup-finish]');
      if (finish) finish.addEventListener('click', finishSetup);
      requestAnimationFrame(syncKeyboardInset);
    }

    function goNext() {
      if (state.step === 1) {
        if (!validateProfile()) return;
        state.step = 2;
        render();
        setTimeout(() => $('#setup-key').focus(), 50);
      } else if (state.step === 2) {
        if (!validateConfig()) return;
        state.step = 3;
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        render();
        setTimeout(syncKeyboardInset, 80);
      }
    }

    function finishSetup() {
      const cfg = readConfig();
      if (!validateConfig()) {
        state.step = 2;
        render();
        return;
      }
      const finalConfig = Object.assign({}, state.config, cfg, {
        configuredAt: new Date().toISOString(),
        lastTest: state.tested ? 'ok' : state.config.lastTest || null,
        lastTestAt: state.tested ? new Date().toISOString() : state.config.lastTestAt || null
      });
      Store.saveConfig(finalConfig);
      Store.saveProfile(
        Object.assign({}, state.profile, {
          setupComplete: true,
          createdAt: Store.profile().createdAt || new Date().toISOString()
        })
      );
      root.classList.add('is-leaving');
      setTimeout(() => {
        root.remove();
        document.body.classList.remove('is-onboarding');
        if (appShell) appShell.removeAttribute('inert');
        onboardingOpen = false;
        global.location.reload();
      }, 340);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (state.step === 3) finishSetup();
      else goNext();
    });
    form.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.isComposing || event.shiftKey) return;
      if (event.target.tagName !== 'INPUT') return;
      event.preventDefault();
      if (state.step === 3) finishSetup();
      else goNext();
    });

    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize', syncKeyboardInset);
      global.visualViewport.addEventListener('scroll', syncKeyboardInset);
    }
    global.addEventListener('resize', syncKeyboardInset);

    root.querySelectorAll('[data-provider]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const providerId = btn.dataset.provider;
        const preset = SN.PROVIDERS[providerId];
        state.config.provider = providerId;
        root.querySelectorAll('[data-provider]').forEach((b) => b.classList.toggle('is-active', b === btn));
        if (preset.baseUrl) {
          $('#setup-base').value = preset.baseUrl;
          $('#setup-model').value = preset.model;
        } else {
          $('#setup-base').value = '';
          $('#setup-model').value = '';
        }
        state.tested = false;
        $('#setup-test-status').textContent = '建议先测试一次';
        $('#setup-test-status').className = 'setup-test-status';
      });
    });

    $('#setup-key-toggle').addEventListener('click', () => {
      const input = $('#setup-key');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      $('#setup-key-toggle').innerHTML = icon(show ? 'eye-off' : 'eye', { size: 18 });
    });

    $('#setup-key-help').addEventListener('click', () => {
      const provider = state.config.provider;
      const url =
        provider === 'openai'
          ? 'https://platform.openai.com/api-keys'
          : provider === 'deepseek'
          ? 'https://platform.deepseek.com/api_keys'
          : '';
      if (url) global.open(url, '_blank', 'noopener');
      else {
        $('#setup-key-help-text').textContent =
          '请到你所使用的模型服务商控制台创建 Key，并确认接口兼容 OpenAI 的 /chat/completions 协议。';
      }
    });

    $('#setup-test').addEventListener('click', async () => {
      if (!validateConfig()) return;
      const btn = $('#setup-test');
      const status = $('#setup-test-status');
      state.testing = true;
      UI.setButtonLoading(btn, true, '连接中');
      status.className = 'setup-test-status is-pending';
      status.textContent = '正在连接模型...';
      try {
        await SN.AI.testConnection(readConfig());
        state.tested = true;
        status.className = 'setup-test-status is-ok';
        status.innerHTML = `${icon('check-circle', { size: 15 })} 连接成功，模型可用`;
      } catch (err) {
        state.tested = false;
        status.className = 'setup-test-status is-error';
        status.innerHTML = `${icon('alert', { size: 15 })} ${escapeHtml(err.message || '连接失败')}`;
      } finally {
        state.testing = false;
        UI.setButtonLoading(btn, false);
      }
    });

    render();
    if (state.step === 2) setTimeout(() => $('#setup-key').focus(), 250);
    else setTimeout(() => $('#setup-name').focus(), 250);
  }

  /* ------------------------------------------------------------------ */
  /* Task dialog                                                        */
  /* ------------------------------------------------------------------ */

  function openTaskDialog(options) {
    const opts = options || {};
    const task = opts.task || null;
    const date = opts.date || U.todayKey();
    const formId = `task-form-${Date.now()}`;
    const subjects = SN.SUBJECTS.map(
      (s) =>
        `<label class="subject-choice" style="--subject:${s.color};--subject-soft:${s.soft}">
          <input type="radio" name="subject" value="${s.id}" ${(task ? task.subject : 'math') === s.id ? 'checked' : ''}>
          <span><i>${s.short}</i>${s.name}</span>
        </label>`
    ).join('');
    const body = `
      <form id="${formId}" class="study-form" novalidate>
        <label class="field">
          <span class="field__label">要做什么</span>
          <input class="input input--lg" name="title" maxlength="100" placeholder="例如：完成数学二次函数练习 4-7 题" value="${escapeHtml(
            task ? task.title : ''
          )}" autofocus>
        </label>
        <div class="field">
          <span class="field__label">学科</span>
          <div class="subject-choice-grid">${subjects}</div>
        </div>
        <div class="form-grid form-grid--three">
          <label class="field"><span class="field__label">日期</span><input class="input" type="date" name="date" value="${
            task ? task.date : date
          }"></label>
          <label class="field"><span class="field__label">开始时间</span><input class="input" type="time" name="start" value="${
            task ? task.start : '19:00'
          }"></label>
          <label class="field"><span class="field__label">预计时长</span>
            <select class="input" name="duration">
              ${[15, 20, 25, 30, 40, 45, 60, 90]
                .map(
                  (m) =>
                    `<option value="${m}" ${
                      Number(task ? task.duration : 30) === m ? 'selected' : ''
                    }>${m} 分钟</option>`
                )
                .join('')}
            </select>
          </label>
        </div>
        <div class="form-grid form-grid--two">
          <label class="field"><span class="field__label">任务类型</span>
            <select class="input" name="type">${SN.TASK_TYPES.map(
              (t) => `<option ${((task && task.type) || '作业') === t ? 'selected' : ''}>${t}</option>`
            ).join('')}</select>
          </label>
          <div class="field"><span class="field__label">优先级</span>
            <div class="segmented segmented--full">
              ${SN.PRIORITIES.map(
                (p) =>
                  `<label><input type="radio" name="priority" value="${p.id}" ${
                    (task ? task.priority : 'medium') === p.id ? 'checked' : ''
                  }><span>${p.name}</span></label>`
              ).join('')}
            </div>
          </div>
        </div>
        <label class="field">
          <span class="field__label">备注 <small>选填</small></span>
          <input class="input" name="notes" maxlength="300" placeholder="完成标准、页码或提醒" value="${escapeHtml(
            task ? task.notes : ''
          )}">
        </label>
      </form>`;
    const footer = `
      ${task ? `<button type="button" class="btn btn--danger-ghost" data-task-delete>${icon('trash', { size: 16 })} 删除</button>` : ''}
      <span class="dialog-foot-spacer"></span>
      <button type="button" class="btn btn--ghost" data-task-cancel>取消</button>
      <button type="button" class="btn btn--primary" data-task-save>${task ? '保存修改' : '添加到计划'}</button>`;
    const ref = UI.modal({
      title: task ? '编辑任务' : '添加学习任务',
      subtitle: task ? '把任务调整成更合适的节奏。' : '给今天一个清晰、可完成的小目标。',
      eyebrow: '每日计划',
      size: 'md',
      body,
      footer,
      onMount(api) {
        const form = api.root.querySelector(`#${formId}`);
        api.root.querySelector('[data-task-cancel]').addEventListener('click', () => api.close());
        const deleteBtn = api.root.querySelector('[data-task-delete]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            const ok = await UI.confirm({
              title: '删除这个任务？',
              message: `“${task.title}”将从计划中移除，无法恢复。`,
              confirmText: '删除',
              danger: true
            });
            if (!ok) return;
            Store.removeTask(task.id);
            UI.toast('任务已删除', 'success');
            api.close();
            if (typeof opts.onSaved === 'function') opts.onSaved(null);
          });
        }
        api.root.querySelector('[data-task-save]').addEventListener('click', () => {
          const title = form.elements.title.value.trim();
          if (!title) {
            UI.toast('先写下任务名称。', 'error');
            form.elements.title.focus();
            return;
          }
          const payload = {
            title,
            subject: form.querySelector('input[name="subject"]:checked').value,
            date: form.elements.date.value || date,
            start: form.elements.start.value || '19:00',
            duration: Number(form.elements.duration.value),
            type: form.elements.type.value,
            priority: form.querySelector('input[name="priority"]:checked').value,
            notes: form.elements.notes.value.trim()
          };
          let saved;
          if (task) saved = Store.updateTask(task.id, payload);
          else saved = Store.addTask(payload);
          UI.toast(task ? '任务已更新' : '已加入今日计划', 'success');
          api.close();
          if (typeof opts.onSaved === 'function') opts.onSaved(saved);
        });
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* Mistake dialog                                                     */
  /* ------------------------------------------------------------------ */

  function openMistakeDialog(options) {
    const opts = options || {};
    const item = opts.mistake || null;
    const prefill = opts.prefill || {};
    const merged = Object.assign({}, item || {}, prefill);
    const formId = `mistake-form-${Date.now()}`;
    const errorOptions = SN.ERROR_TYPES.map(
      (t) => `<option ${((merged && merged.errorType) || '概念不清') === t ? 'selected' : ''}>${t}</option>`
    ).join('');
    const body = `
      <form id="${formId}" class="study-form mistake-form" novalidate>
        <div class="mistake-form__ai">
          <div>
            <strong>${icon('wand', { size: 17 })} AI 智能解析</strong>
            <p>贴入题目后，让 AI 判断错因、补全答案并生成同类练习。</p>
          </div>
          <button type="button" class="btn btn--soft btn--sm" data-ai-analyze>${icon('sparkles', {
            size: 15
          })} 开始解析</button>
        </div>
        <div class="form-grid form-grid--two">
          <label class="field"><span class="field__label">学科</span>
            <select class="input" name="subject">
              ${SN.SUBJECTS.map(
                (s) =>
                  `<option value="${s.id}" ${
                    ((merged && merged.subject) || 'math') === s.id ? 'selected' : ''
                  }>${s.name}</option>`
              ).join('')}
            </select>
          </label>
          <label class="field"><span class="field__label">来源</span>
            <select class="input" name="source">
              ${['作业', '周测', '月考', '期中期末', '课外练习', '其他']
                .map(
                  (s) =>
                    `<option ${((merged && merged.source) || '作业') === s ? 'selected' : ''}>${s}</option>`
                )
                .join('')}
            </select>
          </label>
        </div>
        <label class="field">
          <span class="field__label">错题标题</span>
          <input class="input" name="title" maxlength="100" placeholder="留空会根据题目自动生成" value="${escapeHtml(
            merged.title || ''
          )}">
        </label>
        <label class="field">
          <span class="field__label">题目内容 <b class="required">*</b></span>
          <textarea class="input textarea" name="question" rows="4" maxlength="6000" placeholder="把题目完整贴进来。几何题可以描述图形和已知条件。">${escapeHtml(
            merged.question || ''
          )}</textarea>
        </label>
        <div class="form-grid form-grid--two">
          <label class="field"><span class="field__label">我的错误答案</span>
            <textarea class="input textarea" name="myAnswer" rows="3" maxlength="3000" placeholder="当时是怎么答的？">${escapeHtml(
              merged.myAnswer || ''
            )}</textarea>
          </label>
          <label class="field"><span class="field__label">正确答案</span>
            <textarea class="input textarea" name="correctAnswer" rows="3" maxlength="4000" placeholder="可留空，让 AI 补全">${escapeHtml(
              merged.correctAnswer || ''
            )}</textarea>
          </label>
        </div>
        <div class="form-grid form-grid--two">
          <label class="field"><span class="field__label">错因类型</span>
            <select class="input" name="errorType">${errorOptions}</select>
          </label>
          <label class="field"><span class="field__label">掌握程度 <span data-mastery-label>${
            merged.mastery == null ? 20 : merged.mastery
          }%</span></span>
            <input class="range" type="range" name="mastery" min="0" max="100" step="5" value="${
              merged.mastery == null ? 20 : merged.mastery
            }">
          </label>
        </div>
        <label class="field"><span class="field__label">我当时为什么错 <small>选填</small></span>
          <input class="input" name="reason" maxlength="500" placeholder="例如：没注意定义域，直接把答案写上了" value="${escapeHtml(
            merged.reason || ''
          )}">
        </label>
        <div class="form-grid form-grid--two">
          <label class="field"><span class="field__label">知识点 <small>用逗号分隔</small></span>
            <input class="input" name="knowledgePoints" maxlength="200" placeholder="二次函数, 顶点式" value="${escapeHtml(
              (merged.knowledgePoints || []).join('，')
            )}">
          </label>
          <label class="field"><span class="field__label">难度</span>
            <div class="difficulty-row">
              <input class="range" type="range" name="difficulty" min="1" max="5" step="1" value="${
                merged.difficulty || 3
              }">
              <span data-difficulty-label>${['', '入门', '基础', '中等', '较难', '挑战'][merged.difficulty || 3]}</span>
            </div>
          </label>
        </div>
        <label class="check-row"><input type="checkbox" name="starred" ${
          merged.starred ? 'checked' : ''
        }><span>标记为重点错题</span></label>
        <div class="ai-result" data-ai-result hidden></div>
      </form>`;
    const footer = `
      <span class="dialog-foot-note">${icon('lock', { size: 14 })} 只保存到本机</span>
      <span class="dialog-foot-spacer"></span>
      <button type="button" class="btn btn--ghost" data-mistake-cancel>取消</button>
      <button type="button" class="btn btn--primary" data-mistake-save>${item ? '保存修改' : '存入错题本'}</button>`;
    let aiResult = merged.ai || null;
    const ref = UI.modal({
      title: item ? '编辑错题' : '记录一道错题',
      subtitle: '不是为了收藏错误，而是为了下次不再犯。',
      eyebrow: '智能错题本',
      size: 'lg',
      body,
      footer,
      onMount(api) {
        const form = api.root.querySelector(`#${formId}`);
        const resultBox = api.root.querySelector('[data-ai-result]');
        const mastery = form.elements.mastery;
        const difficulty = form.elements.difficulty;
        mastery.addEventListener('input', () => {
          form.querySelector('[data-mastery-label]').textContent = `${mastery.value}%`;
        });
        difficulty.addEventListener('input', () => {
          form.querySelector('[data-difficulty-label]').textContent = ['', '入门', '基础', '中等', '较难', '挑战'][
            Number(difficulty.value)
          ];
        });
        api.root.querySelector('[data-mistake-cancel]').addEventListener('click', () => api.close());

        if (aiResult) showAiResult(aiResult);

        function showAiResult(result) {
          if (!result) return;
          const points = (result.knowledgePoints || []).map((p) => `<span>${escapeHtml(p)}</span>`).join('');
          resultBox.hidden = false;
          resultBox.innerHTML = `
            <div class="ai-result__head">${icon('sparkles', { size: 17 })} <strong>AI 解析已生成</strong>
              <span>${escapeHtml(result.errorType || '')}</span></div>
            <p>${escapeHtml(result.reason || '')}</p>
            ${points ? `<div class="ai-result__tags">${points}</div>` : ''}
            ${
              result.similarQuestion
                ? `<details><summary>查看同类变式练习</summary><div class="ai-result__similar"><strong>变式题</strong><p>${escapeHtml(
                    result.similarQuestion.question
                  )}</p><strong>答案</strong><p>${escapeHtml(result.similarQuestion.answer)}</p></div></details>`
                : ''
            }`;
        }

        api.root.querySelector('[data-ai-analyze]').addEventListener('click', async () => {
          const question = form.elements.question.value.trim();
          if (!question) {
            UI.toast('先把题目内容贴进来。', 'error');
            form.elements.question.focus();
            return;
          }
          const btn = api.root.querySelector('[data-ai-analyze]');
          UI.setButtonLoading(btn, true, 'AI 解析中');
          resultBox.hidden = true;
          try {
            const draft = {
              subject: form.elements.subject.value,
              question,
              myAnswer: form.elements.myAnswer.value.trim(),
              correctAnswer: form.elements.correctAnswer.value.trim(),
              reason: form.elements.reason.value.trim(),
              difficulty: Number(difficulty.value)
            };
            const result = await SN.AI.analyzeMistake(draft);
            aiResult = result;
            if (!form.elements.title.value.trim() && result.title) form.elements.title.value = result.title;
            if (result.subject) form.elements.subject.value = result.subject;
            if (!form.elements.correctAnswer.value.trim() && result.correctAnswer) {
              form.elements.correctAnswer.value = result.correctAnswer;
            }
            if (!form.elements.reason.value.trim() && result.reason) form.elements.reason.value = result.reason;
            if (result.errorType) form.elements.errorType.value = result.errorType;
            if (!form.elements.knowledgePoints.value.trim() && result.knowledgePoints) {
              form.elements.knowledgePoints.value = result.knowledgePoints.join('，');
            }
            if (result.difficulty) form.elements.difficulty.value = result.difficulty;
            showAiResult(result);
            UI.toast('AI 已完成解析，请检查后保存。', 'success');
          } catch (err) {
            UI.toast(err.message || 'AI 解析失败，请稍后重试。', 'error');
          } finally {
            UI.setButtonLoading(btn, false);
          }
        });

        api.root.querySelector('[data-mistake-save]').addEventListener('click', () => {
          const question = form.elements.question.value.trim();
          if (!question) {
            UI.toast('题目内容不能为空。', 'error');
            form.elements.question.focus();
            return;
          }
          const title =
            form.elements.title.value.trim() ||
            (aiResult && aiResult.title) ||
            `${U.subject(form.elements.subject.value).name}错题 · ${U.truncate(question, 16)}`;
          const points = form.elements.knowledgePoints.value
            .split(/[,，、;；]/)
            .map((s) => s.trim())
            .filter(Boolean);
          const payload = {
            title,
            subject: form.elements.subject.value,
            source: form.elements.source.value,
            question,
            myAnswer: form.elements.myAnswer.value.trim(),
            correctAnswer: form.elements.correctAnswer.value.trim(),
            reason: form.elements.reason.value.trim(),
            errorType: form.elements.errorType.value,
            knowledgePoints: points,
            difficulty: Number(difficulty.value),
            mastery: Number(mastery.value),
            starred: form.elements.starred.checked,
            ai: aiResult
          };
          let saved;
          if (item) saved = Store.updateMistake(item.id, payload);
          else saved = Store.addMistake(payload);
          UI.toast(item ? '错题已更新' : '已存入错题本', 'success');
          api.close();
          if (typeof opts.onSaved === 'function') opts.onSaved(saved);
        });
      }
    });
    return ref;
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                               */
  /* ------------------------------------------------------------------ */

  async function init(page) {
    const active = activePage(page);
    renderSidebar(active);
    renderTopbar(active);
    renderMobileNav(active);
    SN.bus.on('tasks:changed', refresh);
    SN.bus.on('mistakes:changed', refresh);
    SN.bus.on('sessions:changed', refresh);
    SN.bus.on('profile:changed', refresh);

    const config = Store.config();
    const profile = Store.profile();
    if (!config.apiKey || !config.configuredAt || !profile.setupComplete) {
      setTimeout(() => openOnboarding(), 420);
    }

    UI.hydrateIcons(document);

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      const host = location.hostname;
      if (!['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    }
    return active;
  }

  SN.Shell = {
    init,
    refresh,
    openOnboarding,
    openTaskDialog,
    openMistakeDialog,
    NAV,
    PAGE_META
  };
  SN.openTaskDialog = openTaskDialog;
  SN.openMistakeDialog = openMistakeDialog;
})(window);
