/* StudyNet — OpenAI-compatible AI client with streaming and study helpers */
(function (global) {
  'use strict';

  const SN = (global.SN = global.SN || {});
  const U = SN.utils;
  const Store = SN.Store;

  const SYSTEM_BASE =
    '你是 StudyNet 学习舱里的 AI 学习教练，面向中国初中生。你的表达要清楚、温和、具体，不空泛鼓励，也不居高临下。' +
    '讲解时先给结论，再拆步骤；优先用初中生已经学过的知识解释。数学公式使用 LaTeX：行内用 $...$，独立公式用 $$...$$。' +
    '如果学生只是要抄作业，不直接代写，而是给出思路、关键步骤和自检方法；如果题目信息不足，先指出缺少的条件。' +
    '除非学生要求，否则不要长篇大论，控制在能在一屏内读完的范围内。使用简体中文。';

  class AIError extends Error {
    constructor(message, options) {
      super(message);
      this.name = 'AIError';
      this.status = (options && options.status) || 0;
      this.code = (options && options.code) || '';
      this.raw = (options && options.raw) || '';
    }
  }

  function normalizeBase(baseUrl) {
    return String(baseUrl || '')
      .trim()
      .replace(/\/+$/, '');
  }

  function endpointFor(baseUrl) {
    const base = normalizeBase(baseUrl);
    if (!base) return '';
    if (/\/chat\/completions$/i.test(base)) return base;
    return `${base}/chat/completions`;
  }

  function isLocalHost() {
    const host = global.location.hostname;
    return (
      global.location.protocol === 'file:' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]'
    );
  }

  function shouldProxy(config) {
    const cfg = config || Store.config();
    if (cfg.route === 'direct') return false;
    if (cfg.route === 'proxy') return true;
    if (isLocalHost()) return false;
    return ['deepseek', 'openai'].includes(cfg.provider);
  }

  function cleanErrorText(text, apiKey) {
    let value = String(text || '').slice(0, 500);
    if (apiKey) value = value.split(apiKey).join('***');
    return value.replace(/\s+/g, ' ').trim();
  }

  async function responseError(response, apiKey) {
    let detail = '';
    let raw = '';
    try {
      raw = await response.text();
      const parsed = JSON.parse(raw);
      detail =
        (parsed.error && (parsed.error.message || parsed.error.code)) ||
        parsed.message ||
        (typeof parsed === 'string' ? parsed : '');
    } catch (_) {
      detail = raw;
    }
    detail = cleanErrorText(detail, apiKey);
    let message = '';
    if (response.status === 401 || response.status === 403) message = 'API Key 无效或没有访问权限，请到设置中检查。';
    else if (response.status === 402) message = 'AI 账户余额不足，请先充值后再试。';
    else if (response.status === 404) message = '接口地址不存在，请检查 Base URL 是否填写正确。';
    else if (response.status === 429) message = '请求太频繁了，等几十秒再试。';
    else if (response.status >= 500) message = 'AI 服务暂时不可用，请稍后重试。';
    else message = `AI 请求失败（${response.status}）`;
    if (detail) message += ` ${detail}`;
    return new AIError(message, { status: response.status, raw: detail });
  }

  function normalizeContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part.text === 'string') return part.text;
          return '';
        })
        .join('');
    }
    return content == null ? '' : String(content);
  }

  function extractJson(text) {
    let source = String(text || '').trim();
    source = source.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      return JSON.parse(source);
    } catch (_) {}
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = source.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch (_) {}
    }
    const arrStart = source.indexOf('[');
    const arrEnd = source.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(source.slice(arrStart, arrEnd + 1));
      } catch (_) {}
    }
    throw new AIError('AI 返回的内容不是有效 JSON，请重试一次。', { code: 'bad_json', raw: source.slice(0, 500) });
  }

  async function readStream(response, onToken, signal) {
    if (!response.body) {
      const text = await response.text();
      return { content: text, usage: null };
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let content = '';
    let usage = null;
    let finished = false;

    function handleEvent(event) {
      const dataLines = [];
      event.split(/\r?\n/).forEach((line) => {
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      });
      if (!dataLines.length) return;
      const payload = dataLines.join('\n').trim();
      if (!payload || payload === '[DONE]') {
        finished = true;
        return;
      }
      let data;
      try {
        data = JSON.parse(payload);
      } catch (_) {
        return;
      }
      if (data.usage) usage = data.usage;
      if (data.error) {
        throw new AIError(data.error.message || 'AI 服务返回错误', { code: data.error.code || '' });
      }
      const choice = data.choices && data.choices[0];
      if (!choice) return;
      const delta = choice.delta || choice.message || {};
      const token = normalizeContent(delta.content);
      if (token) {
        content += token;
        if (typeof onToken === 'function') onToken(token, content);
      }
      if (choice.finish_reason) finished = true;
    }

    try {
      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';
        for (const event of events) handleEvent(event);
        if (signal && signal.aborted) {
          try {
            await reader.cancel();
          } catch (_) {}
          throw new DOMException('Aborted', 'AbortError');
        }
      }
      if (buffer.trim()) handleEvent(buffer);
      return { content: content.trim(), usage };
    } finally {
      try {
        reader.releaseLock();
      } catch (_) {}
    }
  }

  async function doFetch(url, init, config, allowFallback) {
    let response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      throw new AIError(
        '无法连接 AI 服务。可能是网络不通或接口不允许浏览器跨域访问；部署到 Cloudflare Pages 后会自动使用同源中转。',
        { code: 'network' }
      );
    }
    if (response.status === 404 && allowFallback) {
      return null;
    }
    return response;
  }

  async function request(config, messages, options) {
    const opts = options || {};
    const cfg = config || Store.config();
    const apiKey = String(cfg.apiKey || '').trim();
    if (!apiKey) throw new AIError('还没有配置 API Key，请先完成 AI 设置。', { code: 'no_key' });
    if (!cfg.baseUrl || !cfg.model) throw new AIError('API 配置不完整，请检查接口地址和模型名称。', { code: 'bad_config' });

    const stream = opts.stream == null ? cfg.streaming !== false : Boolean(opts.stream);
    const useProxy = shouldProxy(cfg);
    const proxyUrl = '/api/chat';
    const directUrl = endpointFor(cfg.baseUrl);
    const body = {
      model: cfg.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature == null ? Number(cfg.temperature) || 0.5 : opts.temperature,
      max_tokens: opts.maxTokens || Number(cfg.maxTokens) || 1800,
      stream
    };
    if (opts.topP != null) body.top_p = opts.topP;
    if (opts.stop) body.stop = opts.stop;

    let url = directUrl;
    let payload = body;
    if (useProxy) {
      url = proxyUrl;
      payload = Object.assign({ baseUrl: cfg.baseUrl }, body);
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    };
    if (stream) headers.Accept = 'text/event-stream';

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeout || 180000);
    const external = opts.signal;
    const onAbort = () => controller.abort();
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener('abort', onAbort, { once: true });
    }

    try {
      let response = await doFetch(
        url,
        { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' },
        cfg,
        useProxy && cfg.route !== 'proxy'
      );

      if (!response && useProxy) {
        // A static preview server has no Pages Function: fall back to direct.
        url = directUrl;
        payload = body;
        response = await doFetch(
          url,
          { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal, cache: 'no-store' },
          cfg,
          false
        );
      }

      if (!response.ok) throw await responseError(response, apiKey);

      const type = response.headers.get('content-type') || '';
      if (stream && /text\/event-stream/i.test(type)) {
        const result = await readStream(response, opts.onToken, controller.signal);
        if (!result.content) {
          throw new AIError('AI 没有返回内容，请重新发送一次。', { code: 'empty' });
        }
        return result;
      }

      const data = await response.json();
      if (data.error) throw new AIError(data.error.message || 'AI 服务返回错误');
      const choice = data.choices && data.choices[0];
      const content = normalizeContent(choice && choice.message && choice.message.content);
      if (!content) throw new AIError('AI 没有返回内容，请重新发送一次。', { code: 'empty' });
      if (typeof opts.onToken === 'function') opts.onToken(content, content);
      return { content: content.trim(), usage: data.usage || null };
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (timedOut) throw new AIError('AI 响应超时，请缩小问题范围后重试。', { code: 'timeout' });
        throw new AIError('已停止生成。', { code: 'aborted' });
      }
      if (err instanceof AIError) throw err;
      throw new AIError(err && err.message ? err.message : 'AI 请求失败，请稍后重试。');
    } finally {
      clearTimeout(timeout);
      if (external) external.removeEventListener('abort', onAbort);
    }
  }

  function learnerContext() {
    const profile = Store.profile();
    const today = Store.dayStats();
    const parts = [];
    if (profile.name) parts.push(`学生称呼：${profile.name}`);
    if (profile.grade) parts.push(`年级：${profile.grade}`);
    if (profile.goal) parts.push(`学习目标：${profile.goal}`);
    if (today.taskTotal) parts.push(`今日计划 ${today.taskDone}/${today.taskTotal} 项已完成`);
    if (today.dueCount) parts.push(`有 ${today.dueCount} 道错题待复习`);
    return parts.length ? `当前学习背景：${parts.join('；')}。` : '';
  }

  function chat(messages, options) {
    const opts = options || {};
    const system = `${SYSTEM_BASE}${learnerContext()}`;
    const all = system ? [{ role: 'system', content: system }, ...messages] : messages;
    return request(Store.config(), all, opts);
  }

  async function askJson(prompt, options) {
    const opts = options || {};
    const system =
      '你是严谨的初中学习数据助手。只输出合法 JSON，不输出 Markdown 代码围栏、解释或前后缀。' +
      '所有内容使用简体中文。JSON 必须严格符合用户给出的字段结构。';
    const result = await request(
      Store.config(),
      [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      Object.assign({}, opts, { stream: false, temperature: opts.temperature == null ? 0.25 : opts.temperature })
    );
    return extractJson(result.content);
  }

  function validSubject(value) {
    const s = U.subjectByName(String(value || '').trim());
    return s ? s.id : 'other';
  }

  async function analyzeMistake(mistake) {
    const prompt = `请分析下面这道初中错题，并给出能帮助学生真正弄懂它的解析。

学科：${U.subject(mistake.subject).name}
题目：${String(mistake.question || '').slice(0, 5000)}
学生的错误答案：${String(mistake.myAnswer || '未填写').slice(0, 1500)}
参考答案：${String(mistake.correctAnswer || '未填写').slice(0, 2000)}
学生自述错因：${String(mistake.reason || '未填写').slice(0, 800)}

返回 JSON，字段如下：
{
  "title": "不超过18字的错题标题",
  "subject": "chinese|math|english|physics|chemistry|politics|history|geography|biology|other 之一",
  "errorType": "概念不清|审题失误|计算错误|方法不会|记忆不牢|粗心大意|时间不足|其他 之一",
  "knowledgePoints": ["知识点1", "知识点2"],
  "difficulty": 1到5的整数,
  "reason": "用初中生能懂的话解释为什么会错，2-3句",
  "correctAnswer": "完整、规范的正确答案，包含关键步骤；如果原题条件不足要指出",
  "solutionSteps": ["步骤1", "步骤2", "步骤3"],
  "tips": ["可执行的避坑提醒1", "提醒2"],
  "similarQuestion": { "question": "一道同类型变式题", "answer": "变式题的答案和简要解析" },
  "encouragement": "一句具体、不空泛的鼓励"
}
不要编造题目中不存在的条件。`;
    const data = await askJson(prompt, { maxTokens: 1900 });
    return Object.assign({}, data, {
      subject: validSubject(data.subject || mistake.subject),
      difficulty: U.clamp(data.difficulty || mistake.difficulty || 3, 1, 5),
      knowledgePoints: Array.isArray(data.knowledgePoints)
        ? data.knowledgePoints.map(String).slice(0, 10)
        : [],
      solutionSteps: Array.isArray(data.solutionSteps) ? data.solutionSteps.map(String).slice(0, 8) : [],
      tips: Array.isArray(data.tips) ? data.tips.map(String).slice(0, 6) : [],
      similarQuestion:
        data.similarQuestion && data.similarQuestion.question
          ? {
              question: String(data.similarQuestion.question).slice(0, 1200),
              answer: String(data.similarQuestion.answer || '').slice(0, 1600)
            }
          : null
    });
  }

  async function generatePlan(context) {
    const ctx = context || {};
    const date = ctx.date || U.todayKey();
    const existing = (ctx.existingTasks || [])
      .map((t) => `${t.start || ''} ${t.title}`)
      .slice(0, 20)
      .join('\n');
    const prompt = `为一名${Store.profile().grade || '初中'}学生生成 ${date} 的学习计划。

可用信息：
- 可投入总时长：${ctx.minutes || 120} 分钟
- 希望开始时间：${ctx.start || '18:30'}
- 重点学科：${(ctx.subjects || []).map((id) => U.subject(id).name).join('、') || '不限'}
- 计划侧重：${ctx.focus || '完成作业与复习'}
- 补充说明：${ctx.note || '无'}
- 当天已有任务（不要重复，时间也不要冲突）：
${existing || '无'}

要求：
1. 生成 3-6 个任务，每个任务 20-60 分钟，总时长不超过可用时长。
2. 时间必须从开始时间起顺序排列，任务之间留 5-10 分钟休息，不要安排到 22:30 之后。
3. 任务要具体，例如“数学：二次函数作业第 4-7 题”，不要只写“写作业”。
4. 学科必须使用：chinese、math、english、physics、chemistry、politics、history、geography、biology、other 之一。
5. type 必须是：作业、复习、预习、练习、背诵、整理 之一。
6. priority 必须是：high、medium、low 之一。

只返回如下 JSON：
{"tasks":[{"title":"任务名称","subject":"math","start":"18:30","duration":30,"type":"作业","priority":"high","notes":"完成标准或提示"}]}`;
    const data = await askJson(prompt, { maxTokens: 1800, temperature: 0.45 });
    const list = Array.isArray(data) ? data : data.tasks;
    if (!Array.isArray(list) || !list.length) throw new AIError('AI 没有生成可用任务，请再试一次。');
    return list
      .map((task, index) => {
        const start = /^\d{2}:\d{2}$/.test(String(task.start || '')) ? String(task.start) : '19:00';
        return {
          id: `ai_${Date.now()}_${index}`,
          title: String(task.title || '学习任务').slice(0, 80),
          subject: validSubject(task.subject),
          date,
          start,
          duration: U.clamp(task.duration || 30, 10, 120),
          type: SN.TASK_TYPES.includes(task.type) ? task.type : '作业',
          priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
          notes: String(task.notes || '').slice(0, 300),
          done: false,
          source: 'ai',
          createdAt: new Date().toISOString()
        };
      })
      .slice(0, 7);
  }

  async function summarizeMistakes(mistakes) {
    const list = (mistakes || []).slice(0, 25);
    if (!list.length) throw new AIError('暂时没有错题可以分析。');
    const compact = list.map((m, i) => ({
      n: i + 1,
      subject: U.subject(m.subject).name,
      title: m.title,
      errorType: m.errorType,
      knowledgePoints: m.knowledgePoints,
      reason: String(m.reason || '').slice(0, 160),
      difficulty: m.difficulty,
      mastery: m.mastery
    }));
    const prompt = `下面是一名初中生最近的错题记录（JSON）。请做一次真正有诊断价值的错因归纳，而不是复述题目。

${JSON.stringify(compact)}

请用 Markdown 输出，结构如下：
## 一句话诊断
一句具体判断，指出最该优先解决的问题。
## 错因分布
用 3-5 条短句归纳，说明哪类错误反复出现、可能反映了什么学习漏洞。
## 高频薄弱点
用表格列出「学科 / 知识点 / 出现次数 / 建议动作」，最多 6 行。
## 未来 7 天行动清单
给出 4-5 条每天可执行的小动作，每条包含时长或数量，不要笼统。
## 给学生的提醒
2-3 句，具体、温和，不说空话。

总字数控制在 650 字以内。`;
    const result = await request(
      Store.config(),
      [
        { role: 'system', content: SYSTEM_BASE },
        { role: 'user', content: prompt }
      ],
      { stream: false, temperature: 0.45, maxTokens: 1800 }
    );
    return result.content;
  }

  async function dashboardBrief() {
    const profile = Store.profile();
    const today = Store.dayStats();
    const week = Store.weekStats();
    const mistakes = Store.mistakes().slice(0, 12);
    const context = {
      profile: { grade: profile.grade, goal: profile.goal, dailyMinutes: profile.dailyMinutes },
      today: {
        date: today.date,
        focusMinutes: today.focusMinutes,
        taskDone: today.taskDone,
        taskTotal: today.taskTotal,
        dueMistakes: today.dueCount
      },
      week: week.map((d) => ({ date: d.date, minutes: d.minutes, tasks: d.tasks })),
      recentMistakes: mistakes.map((m) => ({
        subject: U.subject(m.subject).name,
        title: m.title,
        errorType: m.errorType
      })),
      streak: Store.streak()
    };
    const prompt = `根据下面这名初中生的学习数据，写一张今天的“学习调度简报”。

${JSON.stringify(context)}

要求：
- 用 Markdown，不要标题层级过深。
- 开头用一句有判断力的话概括今天的状态，不要空泛夸奖。
- 给出「现在先做」「今晚收尾」「如果只剩 15 分钟」三个小标题，每个下面 1-2 条具体建议。
- 建议要引用真实任务或错题，如果数据为空就给出启动建议。
- 总字数 220-320 字。`;
    const result = await request(
      Store.config(),
      [
        { role: 'system', content: SYSTEM_BASE },
        { role: 'user', content: prompt }
      ],
      { stream: false, temperature: 0.6, maxTokens: 900 }
    );
    return result.content;
  }

  async function testConnection(config) {
    const cfg = Object.assign({}, Store.config(), config || {});
    if (!String(cfg.apiKey || '').trim()) throw new AIError('请先填写 API Key。');
    const result = await request(
      cfg,
      [
        { role: 'system', content: '你是连接测试助手。' },
        { role: 'user', content: '只回复两个字：你好' }
      ],
      { stream: false, maxTokens: 20, temperature: 0, timeout: 45000 }
    );
    return result.content;
  }

  SN.AI = {
    AIError,
    endpointFor,
    shouldProxy,
    request,
    chat,
    askJson,
    analyzeMistake,
    generatePlan,
    summarizeMistakes,
    dashboardBrief,
    testConnection,
    extractJson,
    learnerContext
  };
})(window);
