/* StudyNet — AI tutor chat */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const state = {
    current: null,
    generating: false,
    controller: null,
    stickToBottom: true,
    lastRequest: null,
    paintFrame: 0,
    lastPaint: 0
  };

  const els = {};

  function nowISO() {
    return new Date().toISOString();
  }

  function formatTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function chatGroup(iso) {
    const key = U.dateKey(iso);
    if (key === U.todayKey()) return '今天';
    if (key === U.addDays(U.todayKey(), -1)) return '昨天';
    return '更早';
  }

  function isNearBottom() {
    if (!els.scroll) return true;
    return els.scroll.scrollHeight - els.scroll.scrollTop - els.scroll.clientHeight < 140;
  }

  function updateJump() {
    if (!els.jump) return;
    els.jump.classList.toggle('is-visible', !isNearBottom());
  }

  function scrollBottom(force) {
    if (!els.scroll) return;
    if (force || state.stickToBottom) {
      els.scroll.scrollTop = els.scroll.scrollHeight;
    }
    updateJump();
  }

  /* ------------------------------------------------------------------ */
  /* History                                                            */
  /* ------------------------------------------------------------------ */

  function renderHistory() {
    const chats = Store.chats();
    if (els.historyCount) {
      els.historyCount.textContent = `${chats.length} 个对话`;
    }
    if (!chats.length) {
      els.historyList.innerHTML = `<div class="chat-history__empty">还没有对话。<br>问出第一个问题，就会留在这里。</div>`;
      return;
    }
    const groups = new Map();
    chats.forEach((chat) => {
      const group = chatGroup(chat.updatedAt || chat.createdAt);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(chat);
    });
    let html = '';
    groups.forEach((list, group) => {
      html += `<div class="chat-history__group">${group}</div>`;
      list.forEach((chat) => {
        const active = state.current && state.current.id === chat.id;
        const count = (chat.messages || []).filter((m) => m.role === 'user').length;
        const preview =
          chat.title || U.truncate((chat.messages || []).find((m) => m.role === 'user')?.content || '新对话', 24);
        html += `<div class="chat-history-item${active ? ' is-active' : ''}" data-chat-id="${chat.id}">
          <span class="chat-history-item__icon">${icon('message', { size: 14 })}</span>
          <div class="chat-history-item__body">
            <p class="chat-history-item__title">${escapeHtml(preview)}</p>
            <p class="chat-history-item__meta">${count} 个问题 · ${UI.relativeTime(
          chat.updatedAt || chat.createdAt
        )}</p>
          </div>
          <button type="button" class="chat-history-item__delete" data-delete-chat="${chat.id}" aria-label="删除对话">${icon(
          'trash',
          { size: 13 }
        )}</button>
        </div>`;
      });
    });
    els.historyList.innerHTML = html;
    UI.hydrateIcons(els.historyList);
  }

  function closeHistory() {
    els.history.classList.remove('is-open');
    els.historyBackdrop.classList.remove('is-open');
  }

  function openHistory() {
    els.history.classList.add('is-open');
    els.historyBackdrop.classList.add('is-open');
  }

  /* ------------------------------------------------------------------ */
  /* Messages                                                           */
  /* ------------------------------------------------------------------ */

  function messageHTML(message, index) {
    const isUser = message.role === 'user';
    const profile = Store.profile();
    const content = UI.renderMarkdown(message.content || '');
    return `<article class="message message--${isUser ? 'user' : 'assistant'}" data-message-index="${index}">
      <div class="message__avatar">${
        isUser ? escapeHtml((profile.name || '我').slice(0, 1)) : icon('sparkles', { size: 16 })
      }</div>
      <div class="message__body">
        <div class="message__meta">
          <strong>${isUser ? escapeHtml(profile.name || '我') : 'StudyNet AI'}</strong>
          <span>${formatTime(message.ts)}</span>
          ${!isUser && message.stopped ? '<span>· 已停止</span>' : ''}
        </div>
        <div class="message__bubble">
          <div class="markdown">${content || '<p class="muted">（没有内容）</p>'}</div>
        </div>
        <div class="message__actions">
          <button type="button" class="message-action" data-copy-message="${index}">${icon('copy', {
      size: 13
    })}复制</button>
          ${
            isUser
              ? ''
              : `<button type="button" class="message-action message-action--accent" data-to-mistake="${index}">${icon(
                  'notebook',
                  { size: 13 }
                )}存入错题本</button>
                <button type="button" class="message-action" data-regenerate="${index}">${icon('refresh', {
                  size: 13
                })}重新生成</button>`
          }
        </div>
      </div>
    </article>`;
  }

  function renderMessages(options) {
    const opts = options || {};
    if (!state.current || !state.current.messages.length) {
      els.messages.innerHTML = '';
      els.welcome.hidden = false;
      updateContextHint();
      return;
    }
    els.welcome.hidden = true;
    els.messages.innerHTML = state.current.messages
      .map((m, index) => messageHTML(m, index))
      .join('');
    UI.bindCopyButtons(els.messages);
    UI.typeset(els.messages);
    UI.hydrateIcons(els.messages);
    if (opts.scroll !== false) scrollBottom(Boolean(opts.force));
  }

  function updateContextHint() {
    if (!els.contextHint) return;
    const due = Store.dueMistakes().length;
    els.contextHint.innerHTML = due
      ? `${icon('notebook', { size: 13 })} 错题本里有 <strong>${due}</strong> 道题到期，也可以直接贴给我复盘`
      : `${icon('shield', { size: 13 })} 对话保存在这台设备上，你可以随时删除`;
  }

  function appendStreamingMessage() {
    const article = document.createElement('article');
    article.className = 'message message--assistant is-streaming';
    article.innerHTML = `<div class="message__avatar">${icon('sparkles', { size: 16 })}</div>
      <div class="message__body">
        <div class="message__meta"><strong>StudyNet AI</strong><span>${formatTime(nowISO())}</span><span data-live-label>正在思考</span></div>
        <div class="message__bubble"><div class="markdown"><span class="typing"><i></i><i></i><i></i></span><span class="stream-cursor"></span></div></div>
      </div>`;
    els.messages.appendChild(article);
    scrollBottom(true);
    return article;
  }

  function updateStreaming(article, content) {
    if (!article) return;
    const bubble = article.querySelector('.message__bubble');
    if (!bubble) return;
    bubble.innerHTML = `<div class="markdown">${UI.renderMarkdown(
      content
    )}<span class="stream-cursor"></span></div>`;
    const label = article.querySelector('[data-live-label]');
    if (label) label.textContent = '正在回答';
    if (state.stickToBottom) scrollBottom(false);
  }

  function showError(message, retryText) {
    const wrap = document.createElement('article');
    wrap.className = 'message message--assistant message--error';
    wrap.innerHTML = `<div class="message__avatar">${icon('alert', { size: 16 })}</div>
      <div class="message__body">
        <div class="message__meta"><strong>连接中断</strong><span>${formatTime(nowISO())}</span></div>
        <div class="message__bubble"><div class="chat-error">${icon('alert', {
          size: 16
        })}<span>${escapeHtml(message)}${
      /Key|设置/.test(message) ? ' <a href="settings.html">去检查设置</a>' : ''
    }${retryText ? ' <button type="button" class="message-action" data-retry-last>重试</button>' : ''}</span></div></div>
      </div>`;
    els.messages.appendChild(wrap);
    scrollBottom(true);
  }

  /* ------------------------------------------------------------------ */
  /* Sending                                                            */
  /* ------------------------------------------------------------------ */

  function setGenerating(value) {
    state.generating = value;
    if (!els.send) return;
    els.send.classList.toggle('is-stop', value);
    els.send.disabled = value ? false : !els.input.value.trim();
    els.send.setAttribute('aria-label', value ? '停止生成' : '发送消息');
    els.send.innerHTML = icon(value ? 'stop' : 'send', { size: 17 });
  }

  function ensureChat(firstText) {
    if (state.current) return;
    state.current = {
      id: U.uid('chat'),
      title: U.truncate(firstText, 26),
      messages: [],
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    els.currentTitle.innerHTML = `${escapeHtml(state.current.title)} <span>${escapeHtml(
      currentSubjectName()
    )}</span>`;
  }

  function persist() {
    if (!state.current) return;
    state.current.updatedAt = nowISO();
    Store.saveChat(state.current);
  }

  function currentSubjectName() {
    const value = els.subject.value;
    return value === 'all' ? '初中全科' : U.subject(value).name;
  }

  async function runAssistant(options) {
    const opts = options || {};
    if (!state.current || state.generating) return;
    const config = Store.config();
    if (!config.apiKey) {
      showError('还没有配置 API Key，请先完成 AI 设置。', false);
      return;
    }
    const previous = state.current.messages.filter((m) => m.content && !m.pending);
    if (!previous.length) return;
    const context = previous.slice(-14).map((m) => ({ role: m.role, content: m.content }));
    const subjectValue = els.subject.value;
    if (subjectValue !== 'all') {
      context.unshift({
        role: 'system',
        content: `这一轮请优先从初中${U.subject(subjectValue).name}学科的角度回答；如果问题明显属于其他学科，可以指出并继续。`
      });
    }

    state.stickToBottom = isNearBottom();
    setGenerating(true);
    state.controller = new AbortController();
    const article = appendStreamingMessage();
    let content = '';
    let renderQueued = false;
    let lastPaint = 0;

    function paint(force) {
      const now = performance.now();
      if (!force && now - lastPaint < 80) return;
      lastPaint = now;
      updateStreaming(article, content);
    }

    try {
      const result = await SN.AI.chat(context, {
        stream: true,
        signal: state.controller.signal,
        onToken: (token, full) => {
          content = full;
          if (!renderQueued) {
            renderQueued = true;
            requestAnimationFrame(() => {
              renderQueued = false;
              paint(false);
            });
          }
        }
      });
      content = result.content || content;
      article.remove();
      state.current.messages.push({
        role: 'assistant',
        content,
        ts: nowISO(),
        model: config.model
      });
      persist();
      renderMessages({ scroll: state.stickToBottom });
      renderHistory();
      state.lastRequest = null;
    } catch (err) {
      article.remove();
      if (err.code === 'aborted') {
        if (content) {
          state.current.messages.push({
            role: 'assistant',
            content,
            ts: nowISO(),
            model: config.model,
            stopped: true
          });
          persist();
          renderMessages();
          renderHistory();
        }
        UI.toast('已停止生成', 'info');
      } else {
        showError(err.message || 'AI 暂时没有回应，请稍后再试。', true);
        state.lastRequest = { subject: subjectValue };
        if (err.status === 401 || err.status === 403) {
          UI.toast('API Key 可能已失效', 'error', {
            actionLabel: '去设置',
            onAction: () => (location.href = 'settings.html')
          });
        }
      }
    } finally {
      state.controller = null;
      setGenerating(false);
      if (els.input) {
        els.input.focus();
        autoResize();
      }
    }
  }

  function sendMessage(textInput) {
    const text = String(textInput || '').trim();
    if (!text || state.generating) return;
    if (!Store.config().apiKey) {
      UI.toast('请先在设置中填写 API Key。', 'error', {
        actionLabel: '去设置',
        onAction: () => (location.href = 'settings.html')
      });
      return;
    }
    ensureChat(text);
    state.current.messages.push({ role: 'user', content: text, ts: nowISO() });
    persist();
    els.input.value = '';
    autoResize();
    els.send.disabled = true;
    renderMessages();
    renderHistory();
    scrollBottom(true);
    runAssistant();
  }

  function stopGeneration() {
    if (state.controller) state.controller.abort();
  }

  function retry() {
    if (state.generating) return;
    const errorNode = els.messages.querySelector('.message--error');
    if (errorNode) errorNode.remove();
    runAssistant();
  }

  function regenerate(index) {
    if (state.generating || !state.current) return;
    const last = state.current.messages[state.current.messages.length - 1];
    if (!last || last.role !== 'assistant' || Number(index) !== state.current.messages.length - 1) {
      UI.toast('只能重新生成最后一条回答。', 'info');
      return;
    }
    state.current.messages.pop();
    persist();
    renderMessages();
    runAssistant();
  }

  function toMistake(index) {
    if (!state.current) return;
    const assistant = state.current.messages[index];
    if (!assistant || assistant.role !== 'assistant') return;
    let user = null;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (state.current.messages[i].role === 'user') {
        user = state.current.messages[i];
        break;
      }
    }
    const subjectValue = els.subject.value === 'all' ? 'other' : els.subject.value;
    SN.openMistakeDialog({
      prefill: {
        subject: subjectValue,
        question: user ? user.content : assistant.content,
        correctAnswer: assistant.content,
        title: U.truncate(user ? user.content : assistant.content, 30),
        source: 'AI 答疑'
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Chat lifecycle                                                     */
  /* ------------------------------------------------------------------ */

  function resetChat(updateUrl) {
    if (state.generating) stopGeneration();
    state.current = null;
    els.messages.innerHTML = '';
    els.welcome.hidden = false;
    els.currentTitle.innerHTML = '新的对话 <span>初中全科</span>';
    updateContextHint();
    closeHistory();
    if (updateUrl !== false) {
      try {
        global.history.replaceState(null, '', 'chat.html');
      } catch (_) {}
    }
    setTimeout(() => els.input.focus(), 60);
    autoResize();
    setGenerating(false);
    els.send.disabled = true;
  }

  function loadChat(id) {
    if (state.generating) stopGeneration();
    const chat = Store.getChat(id);
    if (!chat) {
      UI.toast('这个对话已经不存在了', 'error');
      return;
    }
    state.current = chat;
    els.currentTitle.innerHTML = `${escapeHtml(chat.title || '对话')} <span>${escapeHtml(
      (chat.messages || []).find((m) => m.role === 'user') ? '继续讨论' : '空对话'
    )}</span>`;
    renderMessages({ scroll: true, force: true });
    renderHistory();
    closeHistory();
    setGenerating(false);
    els.send.disabled = !els.input.value.trim();
    try {
      global.history.replaceState(null, '', `chat.html?chat=${encodeURIComponent(chat.id)}`);
    } catch (_) {}
  }

  async function deleteChat(id, event) {
    if (event) event.stopPropagation();
    const chat = Store.getChat(id);
    if (!chat) return;
    const ok = await UI.confirm({
      title: '删除这段对话？',
      message: `“${chat.title || '新对话'}”及其中的问答将被删除。`,
      confirmText: '删除',
      danger: true
    });
    if (!ok) return;
    Store.removeChat(id);
    if (state.current && state.current.id === id) resetChat();
    renderHistory();
    UI.toast('对话已删除', 'success');
  }

  function autoResize() {
    if (!els.input) return;
    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(150, Math.max(45, els.input.scrollHeight))}px`;
  }

  function bind() {
    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (state.generating) {
        stopGeneration();
        return;
      }
      sendMessage(els.input.value);
    });
    els.input.addEventListener('input', () => {
      autoResize();
      if (!state.generating) els.send.disabled = !els.input.value.trim();
    });
    els.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!state.generating) sendMessage(els.input.value);
      }
    });
    els.subject.addEventListener('change', () => {
      if (state.current && !state.generating) {
        persist();
        const label = els.currentTitle.querySelector('span');
        if (label) label.textContent = currentSubjectName();
      }
    });

    document.querySelectorAll('[data-prompt]').forEach((card) => {
      card.addEventListener('click', () => {
        els.input.value = card.dataset.prompt || '';
        autoResize();
        els.send.disabled = false;
        els.input.focus();
        const len = els.input.value.length;
        els.input.setSelectionRange(len, len);
      });
    });

    document.getElementById('chat-new-top').addEventListener('click', () => resetChat());
    document.getElementById('chat-new-side').addEventListener('click', () => resetChat());
    document.getElementById('chat-history-toggle').addEventListener('click', openHistory);
    document.getElementById('chat-history-open').addEventListener('click', openHistory);
    document.getElementById('chat-history-close').addEventListener('click', closeHistory);
    els.historyBackdrop.addEventListener('click', closeHistory);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeHistory();
    });

    els.historyList.addEventListener('click', (event) => {
      const del = event.target.closest('[data-delete-chat]');
      if (del) {
        deleteChat(del.dataset.deleteChat, event);
        return;
      }
      const item = event.target.closest('[data-chat-id]');
      if (item) loadChat(item.dataset.chatId);
    });

    els.messages.addEventListener('click', async (event) => {
      const copyBtn = event.target.closest('[data-copy-message]');
      if (copyBtn) {
        const index = Number(copyBtn.dataset.copyMessage);
        const message = state.current && state.current.messages[index];
        if (message) {
          await UI.copyText(message.content);
          UI.toast('已复制回答', 'success');
        }
        return;
      }
      const mistakeBtn = event.target.closest('[data-to-mistake]');
      if (mistakeBtn) {
        toMistake(Number(mistakeBtn.dataset.toMistake));
        return;
      }
      const regenBtn = event.target.closest('[data-regenerate]');
      if (regenBtn) {
        regenerate(Number(regenBtn.dataset.regenerate));
        return;
      }
      if (event.target.closest('[data-retry-last]')) retry();
    });

    els.scroll.addEventListener('scroll', () => {
      state.stickToBottom = isNearBottom();
      updateJump();
    });
    els.jump.addEventListener('click', () => {
      state.stickToBottom = true;
      scrollBottom(true);
    });

    SN.bus.on('profile:changed', () => {
      if (state.current) renderMessages({ scroll: false });
    });
  }

  function init() {
    els.scroll = document.getElementById('chat-scroll');
    els.welcome = document.getElementById('chat-welcome');
    els.messages = document.getElementById('chat-messages');
    els.form = document.getElementById('chat-form');
    els.input = document.getElementById('chat-input');
    els.send = document.getElementById('chat-send');
    els.subject = document.getElementById('chat-subject');
    els.history = document.getElementById('chat-history');
    els.historyList = document.getElementById('chat-history-list');
    els.historyCount = document.getElementById('chat-history-count');
    els.historyBackdrop = document.getElementById('chat-history-backdrop');
    els.currentTitle = document.getElementById('chat-current-title');
    els.jump = document.getElementById('chat-jump');
    els.contextHint = document.getElementById('chat-context-hint');

    els.subject.innerHTML =
      '<option value="all">全科</option>' +
      SN.SUBJECTS.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
    const config = Store.config();
    document.getElementById('chat-model-name').textContent = config.apiKey
      ? config.model || 'AI 已连接'
      : '未配置 API';

    UI.hydrateIcons(document);
    bind();
    renderHistory();
    updateContextHint();

    const params = new URLSearchParams(location.search);
    const chatId = params.get('chat');
    if (chatId && Store.getChat(chatId)) {
      loadChat(chatId);
    } else {
      resetChat(false);
    }
    autoResize();

    if (!Store.hasApiKey()) {
      els.input.placeholder = '请先在设置中配置自己的 API Key…';
      els.send.disabled = true;
    }
  }

  SN.Chat = { init };
  SN.ready(() => {
    SN.Shell.init('chat').then(init);
  });
})(window);
