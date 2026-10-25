/**
 * StudyNet — Cloudflare Pages Function
 *
 * A tiny, stateless same-origin relay for OpenAI-compatible chat APIs.
 * It exists to avoid browser CORS problems on Cloudflare Pages. The user's
 * API key is forwarded for one request only and is never stored or logged.
 */

const DEFAULT_ALLOWED_HOSTS = ['api.deepseek.com', 'api.openai.com'];

function json(data, status, extraHeaders) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([key, value]) => headers.set(key, value));
  }
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

function fail(message, status, code) {
  return json({ error: { message, code: code || 'proxy_error' } }, status || 400);
}

function allowedHosts(env) {
  const configured = String((env && env.AI_ALLOWED_HOSTS) || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_HOSTS, ...configured]);
}

function buildTarget(baseUrl, env) {
  if (!baseUrl || typeof baseUrl !== 'string') throw new Error('缺少接口地址');
  let url;
  try {
    url = new URL(baseUrl);
  } catch (_) {
    throw new Error('接口地址格式不正确');
  }
  if (url.protocol !== 'https:') throw new Error('接口地址必须使用 HTTPS');
  if (url.username || url.password) throw new Error('接口地址不能包含账号密码');
  const hosts = allowedHosts(env);
  if (!hosts.has(url.hostname.toLowerCase())) {
    throw new Error(`该接口域名未加入中转白名单：${url.hostname}`);
  }
  let path = url.pathname.replace(/\/+$/, '');
  if (!/\/chat\/completions$/i.test(path)) path = `${path}/chat/completions`;
  path = path.replace(/\/{2,}/g, '/');
  if (!/\/chat\/completions$/i.test(path)) throw new Error('接口路径不受支持');
  url.pathname = path;
  url.search = '';
  url.hash = '';
  return url;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw new Error('消息列表不能为空');
  if (messages.length > 80) throw new Error('消息数量过多');
  let total = 0;
  const clean = messages.map((message) => {
    if (!message || typeof message !== 'object') throw new Error('消息格式不正确');
    const role = String(message.role || '');
    if (!['system', 'user', 'assistant'].includes(role)) throw new Error('消息角色不正确');
    let content = message.content;
    if (Array.isArray(content)) {
      content = content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part.text === 'string') return part.text;
          return '';
        })
        .join('');
    }
    if (typeof content !== 'string') throw new Error('消息内容格式不正确');
    total += content.length;
    if (total > 180000) throw new Error('消息内容过长');
    return { role, content };
  });
  return clean;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestPost(context) {
  const request = context.request;
  const env = context.env || {};
  let payload;
  try {
    payload = await request.json();
  } catch (_) {
    return fail('请求体不是合法 JSON', 400, 'bad_json');
  }

  const auth = String(request.headers.get('Authorization') || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1].trim().length < 6) {
    return fail('缺少有效的 API Key', 401, 'missing_key');
  }
  const apiKey = match[1].trim();

  let target;
  try {
    target = buildTarget(payload.baseUrl, env);
  } catch (err) {
    return fail(err.message, 400, 'bad_target');
  }

  let messages;
  try {
    messages = validateMessages(payload.messages);
  } catch (err) {
    return fail(err.message, 400, 'bad_messages');
  }

  const model = String(payload.model || '').slice(0, 120);
  if (!model) return fail('缺少模型名称', 400, 'missing_model');

  const stream = Boolean(payload.stream);
  const upstreamBody = {
    model,
    messages,
    stream
  };
  if (typeof payload.temperature === 'number' && Number.isFinite(payload.temperature)) {
    upstreamBody.temperature = Math.min(1.5, Math.max(0, payload.temperature));
  }
  if (typeof payload.max_tokens === 'number' && Number.isFinite(payload.max_tokens)) {
    upstreamBody.max_tokens = Math.min(8000, Math.max(1, Math.round(payload.max_tokens)));
  }
  if (typeof payload.top_p === 'number') {
    upstreamBody.top_p = Math.min(1, Math.max(0, payload.top_p));
  }
  if (payload.stop != null) {
    upstreamBody.stop = payload.stop;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150000);
  let upstream;
  try {
    upstream = await fetch(target.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: stream ? 'text/event-stream' : 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'StudyNet/1.0 (Cloudflare Pages)'
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
      redirect: 'error'
    });
  } catch (err) {
    clearTimeout(timer);
    const message =
      err && err.name === 'AbortError'
        ? 'AI 服务响应超时'
        : '无法连接 AI 服务，请检查接口地址和账户状态';
    return fail(message, 502, 'upstream_unreachable');
  }

  if (!upstream.ok) {
    clearTimeout(timer);
    let text = '';
    try {
      text = await upstream.text();
    } catch (_) {}
    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-StudyNet-Proxy': '1'
    });
    return new Response(text || JSON.stringify({ error: { message: 'AI 服务返回错误' } }), {
      status: upstream.status,
      headers
    });
  }

  const contentType = upstream.headers.get('Content-Type') || '';
  if (!stream || !/text\/event-stream/i.test(contentType)) {
    try {
      const data = await upstream.text();
      clearTimeout(timer);
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType || 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-StudyNet-Proxy': '1',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (_) {
      clearTimeout(timer);
      return fail('读取 AI 响应失败', 502, 'upstream_read_failed');
    }
  }

  // Stream through without buffering. The timer is cleared by the runtime
  // after the response body is consumed; Cloudflare enforces a hard cap too.
  clearTimeout(timer);
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-StudyNet-Proxy': '1',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequest() {
  return fail('只支持 POST 请求', 405, 'method_not_allowed');
}
