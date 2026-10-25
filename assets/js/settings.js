/* StudyNet — settings, profile and local data */
(function (global) {
  'use strict';

  const SN = global.SN;
  const U = SN.utils;
  const Store = SN.Store;
  const UI = SN.UI;
  const icon = UI.icon;
  const escapeHtml = U.escapeHtml;

  const els = {};
  let testedOk = false;

  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '—';
    }
  }

  function providerLabel(id) {
    return (SN.PROVIDERS[id] && SN.PROVIDERS[id].name) || '自定义接口';
  }

  function routeLabel(route) {
    return route === 'direct' ? '浏览器直连' : route === 'proxy' ? 'Cloudflare 中转' : '自动选择';
  }

  function renderProfileBanner() {
    const profile = Store.profile();
    const name = profile.name || '同学';
    document.getElementById('profile-avatar').textContent = name.slice(0, 1);
    document.getElementById('profile-display-name').textContent = name;
    document.getElementById('profile-display-grade').textContent = profile.grade || '八年级';
    document.getElementById('profile-display-minutes').textContent = `每日 ${profile.dailyMinutes || 90} 分钟`;
    document.getElementById('profile-display-sub').textContent = profile.goal
      ? `当前目标：${profile.goal}`
      : '让学习舱更了解你，AI 的建议会更贴近你的节奏。';
  }

  function renderApiStatus() {
    const config = Store.config();
    const hasKey = Boolean(config.apiKey);
    const status = document.getElementById('api-status');
    status.classList.toggle('is-off', !hasKey);
    document.getElementById('api-status-title').textContent = hasKey
      ? `已连接 ${config.model || 'AI 模型'}`
      : '还没有配置 AI';
    document.getElementById('api-status-desc').textContent = hasKey
      ? `${providerLabel(config.provider)} · ${routeLabel(config.route)} · Key ••••${String(
          config.apiKey
        ).slice(-4)}`
      : '填写自己的 API Key 后，AI 答疑和智能解析才会工作。';
    const badge = document.getElementById('api-status-badge');
    badge.textContent = hasKey ? (config.lastTest === 'ok' ? '连接正常' : '已配置') : '未配置';
    document.getElementById('api-save-hint').textContent = config.configuredAt
      ? `上次保存：${formatDateTime(config.configuredAt)}`
      : '还没有保存配置';
  }

  function updateProviderPreset(useDefaults) {
    const provider = SN.PROVIDERS[els.provider.value];
    els.modelDatalist.innerHTML = (provider.models || [])
      .map((model) => `<option value="${escapeHtml(model)}"></option>`)
      .join('');
    if (useDefaults && provider && provider.baseUrl) {
      els.base.value = provider.baseUrl;
      els.model.value = provider.model;
    }
    const link = document.getElementById('api-key-link');
    if (provider.id === 'deepseek') {
      link.style.display = '';
      link.href = 'https://platform.deepseek.com/api_keys';
      link.textContent = '去 DeepSeek 获取';
    } else if (provider.id === 'openai') {
      link.style.display = '';
      link.href = 'https://platform.openai.com/api-keys';
      link.textContent = '去 OpenAI 获取';
    } else {
      link.style.display = 'none';
    }
  }

  function populateForms() {
    const profile = Store.profile();
    const config = Store.config();
    els.name.value = profile.name || '';
    els.grade.value = profile.grade || '八年级';
    els.minutes.value = String(profile.dailyMinutes || 90);
    els.goal.value = profile.goal || '';

    els.provider.value = config.provider || 'deepseek';
    els.model.value = config.model || '';
    els.base.value = config.baseUrl || '';
    els.key.value = config.apiKey || '';
    els.route.value = config.route || 'auto';
    els.temperature.value = String(config.temperature == null ? 0.5 : config.temperature);
    els.maxTokens.value = String(config.maxTokens || 1800);
    els.streaming.checked = config.streaming !== false;
    document.getElementById('temperature-value').textContent = Number(els.temperature.value).toFixed(1);
    updateProviderPreset(false);
    renderProfileBanner();
    renderApiStatus();
    renderStorage();
  }

  function markDirty() {
    testedOk = false;
    document.getElementById('api-save-status').textContent = '有未保存修改';
    document.getElementById('api-save-status').className = 'chip chip--coral';
  }

  function readApiForm() {
    return {
      provider: els.provider.value,
      baseUrl: els.base.value.trim(),
      model: els.model.value.trim(),
      apiKey: els.key.value.trim(),
      route: els.route.value,
      temperature: Number(els.temperature.value),
      maxTokens: Number(els.maxTokens.value),
      streaming: els.streaming.checked
    };
  }

  async function testConnection() {
    const config = readApiForm();
    if (!config.apiKey) {
      UI.toast('请先填写 API Key。', 'error');
      els.key.focus();
      return;
    }
    if (!/^https?:\/\//i.test(config.baseUrl) || !config.model) {
      UI.toast('请检查接口地址和模型名称。', 'error');
      return;
    }
    const button = document.getElementById('api-test');
    const status = document.getElementById('api-test-status');
    UI.setButtonLoading(button, true, '连接中');
    status.className = 'setup-test-status is-pending';
    status.textContent = '正在向模型发送一条极短消息...';
    try {
      await SN.AI.testConnection(config);
      testedOk = true;
      status.className = 'setup-test-status is-ok';
      status.innerHTML = `${icon('check-circle', { size: 15 })} 连接成功，模型可以正常回答`;
      document.getElementById('api-save-status').textContent = '测试通过，待保存';
      document.getElementById('api-save-status').className = 'chip chip--mint';
    } catch (err) {
      testedOk = false;
      status.className = 'setup-test-status is-error';
      status.innerHTML = `${icon('alert', { size: 15 })} ${escapeHtml(err.message || '连接失败')}`;
    } finally {
      UI.setButtonLoading(button, false);
    }
  }

  function saveApi(event) {
    event.preventDefault();
    const config = readApiForm();
    if (!config.apiKey) {
      UI.toast('API Key 不能为空。', 'error');
      els.key.focus();
      return;
    }
    if (!/^https?:\/\//i.test(config.baseUrl)) {
      UI.toast('接口地址需要以 https:// 开头。', 'error');
      els.base.focus();
      return;
    }
    if (!config.model) {
      UI.toast('请填写模型名称。', 'error');
      els.model.focus();
      return;
    }
    const previous = Store.config();
    const sameConnection =
      previous.apiKey === config.apiKey &&
      previous.baseUrl === config.baseUrl &&
      previous.model === config.model &&
      previous.provider === config.provider;
    const now = new Date().toISOString();
    Store.saveConfig(
      Object.assign({}, config, {
        configuredAt: previous.configuredAt || now,
        lastTest: testedOk ? 'ok' : sameConnection ? previous.lastTest : null,
        lastTestAt: testedOk ? now : sameConnection ? previous.lastTestAt : null
      })
    );
    testedOk = false;
    document.getElementById('api-save-status').textContent = '已保存';
    document.getElementById('api-save-status').className = 'chip chip--mint';
    document.getElementById('api-test-status').className = 'setup-test-status';
    document.getElementById('api-test-status').textContent = '配置已保存，可以随时重新测试';
    renderApiStatus();
    SN.Shell.refresh();
    UI.toast('AI 配置已保存', 'success');
  }

  function saveProfile(event) {
    event.preventDefault();
    const name = els.name.value.trim();
    if (!name) {
      UI.toast('先写下怎么称呼你。', 'error');
      els.name.focus();
      return;
    }
    Store.saveProfile({
      name,
      grade: els.grade.value,
      dailyMinutes: Number(els.minutes.value),
      goal: els.goal.value.trim()
    });
    renderProfileBanner();
    renderStorage();
    SN.Shell.refresh();
    UI.toast('学习档案已更新', 'success');
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportJson() {
    const payload = Store.exportAll({ includeKey: false });
    download(
      `StudyNet-backup-${U.todayKey()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    UI.toast('备份已导出（不含 API Key）', 'success');
  }

  function csvCell(value) {
    let text = String(value == null ? '' : value).replace(/\r?\n/g, ' ');
    // Prevent spreadsheet formula injection when a question begins with = + - @.
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const mistakes = Store.mistakes();
    if (!mistakes.length) {
      UI.toast('错题本还是空的，暂时没有可导出的内容。', 'info');
      return;
    }
    const header = [
      '学科',
      '标题',
      '来源',
      '题目',
      '我的答案',
      '正确答案',
      '错因类型',
      '知识点',
      '难度',
      '掌握度',
      '下次复习',
      '录入时间'
    ];
    const rows = mistakes.map((m) => [
      U.subject(m.subject).name,
      m.title,
      m.source,
      m.question,
      m.myAnswer,
      m.correctAnswer,
      m.errorType,
      (m.knowledgePoints || []).join('、'),
      m.difficulty,
      `${m.mastery}%`,
      m.review.next,
      U.formatDateCN(m.createdAt)
    ]);
    const csv =
      '\ufeff' +
      [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\r\n');
    download(`StudyNet-错题本-${U.todayKey()}.csv`, csv, 'text/csv;charset=utf-8');
    UI.toast(`已导出 ${mistakes.length} 道错题`, 'success');
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || payload.app !== 'StudyNet') throw new Error('这不是 StudyNet 的备份文件');
      const counts = payload.data || {};
      const ok = await UI.confirm({
        title: '导入备份并覆盖当前数据？',
        message: `备份包含 ${(counts.tasks || []).length} 个任务、${
          (counts.mistakes || []).length
        } 道错题、${(counts.chats || []).length} 个对话。当前学习数据会被替换。`,
        detail: 'API Key 不会被备份覆盖；如果当前没有 Key，导入后仍需要重新填写。',
        confirmText: '导入并覆盖'
      });
      if (!ok) return;
      Store.importAll(payload);
      UI.toast('备份已导入，正在刷新…', 'success');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      UI.toast(err.message || '备份文件无法读取', 'error');
    } finally {
      els.importFile.value = '';
    }
  }

  function renderStorage() {
    let bytes = 0;
    Object.values(SN.KEYS).forEach((key) => {
      try {
        const value = localStorage.getItem(key) || '';
        bytes += new Blob([value]).size;
      } catch (_) {}
    });
    const limit = 5 * 1024 * 1024;
    const percent = U.clamp((bytes / limit) * 100, 0, 100);
    const label = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    document.getElementById('storage-size').textContent = label;
    document.getElementById('storage-bar').style.width = `${Math.max(percent, bytes ? 1.5 : 0)}%`;
    document.getElementById('storage-hint').textContent =
      bytes > limit * 0.7
        ? '空间接近上限，建议导出备份后清理旧对话。'
        : '浏览器通常提供约 5MB 本地空间。';
  }

  async function clearChats() {
    const count = Store.chats().length;
    if (!count) {
      UI.toast('还没有对话记录。', 'info');
      return;
    }
    const ok = await UI.confirm({
      title: '清空 AI 对话？',
      message: `将删除 ${count} 个对话，计划、错题和专注记录不受影响。`,
      confirmText: '清空对话',
      danger: true
    });
    if (!ok) return;
    Store.saveChats([]);
    renderStorage();
    UI.toast('对话记录已清空', 'success');
  }

  async function clearAll() {
    const ok = await UI.confirm({
      title: '清空全部学习数据？',
      message: '档案、计划、错题、专注记录和对话都会被删除，且无法恢复。',
      detail: 'API 配置会保留。建议先导出 JSON 备份。',
      confirmText: '清空并重置',
      danger: true
    });
    if (!ok) return;
    Store.clearAll({ keepConfig: true });
    UI.toast('学习数据已清空，正在重置…', 'success');
    setTimeout(() => location.reload(), 700);
  }

  function bind() {
    document.getElementById('profile-form').addEventListener('submit', saveProfile);
    document.getElementById('api-form').addEventListener('submit', saveApi);
    document.getElementById('api-test').addEventListener('click', testConnection);
    document.getElementById('api-key-toggle').addEventListener('click', () => {
      const show = els.key.type === 'password';
      els.key.type = show ? 'text' : 'password';
      document.getElementById('api-key-toggle').innerHTML = icon(show ? 'eye-off' : 'eye', { size: 17 });
    });
    els.provider.addEventListener('change', () => {
      updateProviderPreset(true);
      markDirty();
    });
    els.temperature.addEventListener('input', () => {
      document.getElementById('temperature-value').textContent = Number(els.temperature.value).toFixed(1);
      markDirty();
    });
    [els.model, els.base, els.key, els.route, els.maxTokens, els.streaming].forEach((el) => {
      el.addEventListener('input', markDirty);
      el.addEventListener('change', markDirty);
    });
    document.getElementById('settings-export').addEventListener('click', exportJson);
    document.getElementById('data-export').addEventListener('click', exportJson);
    document.getElementById('data-csv').addEventListener('click', exportCsv);
    document.getElementById('data-import').addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', () => importJson(els.importFile.files[0]));
    document.getElementById('clear-chats').addEventListener('click', clearChats);
    document.getElementById('clear-all').addEventListener('click', clearAll);
  }

  function init() {
    els.name = document.getElementById('settings-name');
    els.grade = document.getElementById('settings-grade');
    els.minutes = document.getElementById('settings-minutes');
    els.goal = document.getElementById('settings-goal');
    els.provider = document.getElementById('api-provider');
    els.model = document.getElementById('api-model');
    els.modelDatalist = document.getElementById('model-presets');
    els.base = document.getElementById('api-base');
    els.key = document.getElementById('api-key');
    els.route = document.getElementById('api-route');
    els.temperature = document.getElementById('api-temperature');
    els.maxTokens = document.getElementById('api-max-tokens');
    els.streaming = document.getElementById('api-streaming');
    els.importFile = document.getElementById('import-file');

    UI.hydrateIcons(document);
    populateForms();
    bind();
  }

  SN.Settings = { init };
  SN.ready(() => {
    SN.Shell.init('settings').then(init);
  });
})(window);
