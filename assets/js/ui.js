/* StudyNet — icons, dialogs, toasts, markdown and small visual helpers */
(function (global) {
  'use strict';

  const SN = (global.SN = global.SN || {});
  const U = SN.utils;
  const escapeHtml = U.escapeHtml;

  /* ------------------------------------------------------------------ */
  /* Icons                                                              */
  /* ------------------------------------------------------------------ */

  const ICONS = {
    home: '<path d="M3 10.6 12 3l9 7.6V21a1 1 0 0 1-1 1h-5.4v-6.2H9.4V22H4a1 1 0 0 1-1-1V10.6Z"/>',
    sparkles:
      '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/><path d="m5 2 .7 1.6L7.3 4.3 5.7 5 5 6.6 4.3 5 2.7 4.3l1.6-.7L5 2Z"/>',
    notebook:
      '<path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M8 3v18M11 8h5M11 12h5M11 16h3"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.7a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.7a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.3 9v.09A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.8-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
    edit: '<path d="M12 20H4a1 1 0 0 1-1-1v-8"/><path d="m16.5 3.5 4 4L9 19H5v-4L16.5 3.5Z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.5-2L20 12M4 12l2.4 6a7 7 0 0 0 11.5-2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flame: '<path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.9-5.2-3.4-7.2C14.3 6.5 13 4.7 13 2c-2.6 1.7-4 4-4 6.2 0 1.4.5 2.5 1 3.3-1.7-.5-3-1.8-3.6-3.7C5 9.5 5 11.9 5 14c0 4.3 3.1 8 7 8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.8 12.2 8.7-8.7M16 7l2 2M19 4l2 2"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    'cloud-off': '<path d="M3 3l18 18"/><path d="M8.5 5.4A5 5 0 0 1 17 9h1a4 4 0 0 1 2.5 7.1M6 18h11M5.8 9.8A4 4 0 0 0 6 18"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 21h14"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    'rotate-ccw': '<path d="M3 3v6h6"/><path d="M3.5 9a9 9 0 1 1 1.4 8.5"/>',
    lightbulb:
      '<path d="M9 18h6M10 22h4M8.5 15.7A7 7 0 1 1 15.5 15.7c-.8.7-1.2 1.4-1.3 2.3h-4.4c-.1-.9-.5-1.6-1.3-2.3Z"/>',
    brain:
      '<path d="M9.5 3A3.5 3.5 0 0 0 6 6.5c0 .6.15 1.15.42 1.63A3.5 3.5 0 0 0 5 11.2 3.5 3.5 0 0 0 6.4 14 3.5 3.5 0 0 0 9.5 21c1 0 1.9-.42 2.5-1.1V4.1A3 3 0 0 0 9.5 3Z"/><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c0 .6-.15 1.15-.42 1.63A3.5 3.5 0 0 1 19 11.2 3.5 3.5 0 0 1 17.6 14a3.5 3.5 0 0 1-3.1 7c-1 0-1.9-.42-2.5-1.1"/>',
    wand: '<path d="M15 4V2M15 10V8M11 6H9M21 6h-2"/><path d="m3 21 12-12 3 3L6 24H3v-3Z"/><path d="M18 13l1 1M5 5l1 1"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M3 3l18 18"/><path d="M10.6 6.3A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.6C3.5 8.6 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    history: '<path d="M3 3v6h6"/><path d="M3.5 9a9 9 0 1 1 1.4 8.5"/><path d="M12 8v5l3 2"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    graduation: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    flag: '<path d="M5 22V3M5 4h13l-2 4 2 4H5"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M7 2v2M11 2v2M15 2v2"/>',
    maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
    minimize: '<path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    zap: '<path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    'book-open': '<path d="M2 4h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V4Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V4Z"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
    'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>'
  };

  function icon(name, options) {
    const opts = options || {};
    const content = ICONS[name] || ICONS.sparkles;
    const cls = opts.className ? ` ${escapeHtml(opts.className)}` : '';
    const size = opts.size || 20;
    return `<svg class="sn-icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* Toasts                                                             */
  /* ------------------------------------------------------------------ */

  function toast(message, type, options) {
    const opts = options || {};
    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const tone = type || 'info';
    const iconName = tone === 'success' ? 'check-circle' : tone === 'error' ? 'alert' : 'info';
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.innerHTML = `<span class="toast__icon">${icon(iconName, { size: 18 })}</span><span class="toast__text">${escapeHtml(
      message
    )}</span>${opts.actionLabel ? `<button type="button" class="toast__action">${escapeHtml(opts.actionLabel)}</button>` : ''}`;
    stack.appendChild(el);
    while (stack.children.length > 3) stack.firstElementChild.remove();
    if (opts.actionLabel && typeof opts.onAction === 'function') {
      el.querySelector('.toast__action').addEventListener('click', () => {
        opts.onAction();
        dismiss();
      });
    }
    let timeout = 0;
    function dismiss() {
      clearTimeout(timeout);
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
    }
    el.addEventListener('click', (event) => {
      if (!event.target.closest('.toast__action')) dismiss();
    });
    timeout = setTimeout(dismiss, opts.duration || 3600);
    return dismiss;
  }

  /* ------------------------------------------------------------------ */
  /* Dialog                                                             */
  /* ------------------------------------------------------------------ */

  let dialogSeq = 0;

  function modal(config) {
    const opts = config || {};
    const id = `sn-dialog-${++dialogSeq}`;
    const dialog = document.createElement('dialog');
    dialog.id = id;
    dialog.className = `sn-dialog sn-dialog--${opts.size || 'md'}${opts.className ? ` ${opts.className}` : ''}`;
    if (opts.labelledBy) dialog.setAttribute('aria-labelledby', opts.labelledBy);
    else if (opts.title) dialog.setAttribute('aria-labelledby', `${id}-title`);
    dialog.innerHTML = `
      <div class="sn-dialog__panel">
        ${
          opts.title || opts.header
            ? `<header class="sn-dialog__head">
                <div class="sn-dialog__heading">
                  ${opts.eyebrow ? `<p class="sn-dialog__eyebrow">${escapeHtml(opts.eyebrow)}</p>` : ''}
                  <h2 id="${id}-title">${escapeHtml(opts.title || '')}</h2>
                  ${opts.subtitle ? `<p class="sn-dialog__sub">${escapeHtml(opts.subtitle)}</p>` : ''}
                </div>
                ${
                  opts.dismissible === false
                    ? ''
                    : `<button type="button" class="icon-btn sn-dialog__close" aria-label="关闭">${icon('x', {
                        size: 19
                      })}</button>`
                }
              </header>`
            : ''
        }
        <div class="sn-dialog__body">${opts.body || ''}</div>
        ${opts.footer ? `<footer class="sn-dialog__foot">${opts.footer}</footer>` : ''}
      </div>`;
    document.body.appendChild(dialog);

    let closed = false;
    function close(value) {
      if (closed) return;
      closed = true;
      if (dialog.open) dialog.close(value == null ? '' : String(value));
      setTimeout(() => dialog.remove(), 260);
      if (typeof opts.onClose === 'function') opts.onClose(value);
    }

    if (opts.dismissible !== false) {
      const closeBtn = dialog.querySelector('.sn-dialog__close');
      if (closeBtn) closeBtn.addEventListener('click', () => close('cancel'));
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) close('cancel');
      });
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        close('cancel');
      });
    } else {
      dialog.addEventListener('cancel', (event) => event.preventDefault());
    }

    dialog.showModal();
    document.documentElement.classList.add('has-dialog');
    dialog.addEventListener('close', () => {
      document.documentElement.classList.toggle('has-dialog', Boolean(document.querySelector('dialog[open]')));
    });

    const api = {
      dialog,
      close,
      root: dialog,
      body: dialog.querySelector('.sn-dialog__body'),
      footer: dialog.querySelector('.sn-dialog__foot'),
      setBusy(busy) {
        dialog.classList.toggle('is-busy', Boolean(busy));
        dialog.querySelectorAll('button, input, textarea, select').forEach((el) => {
          if (el.dataset.alwaysActive === 'true') return;
          el.disabled = Boolean(busy);
        });
      }
    };
    if (typeof opts.onMount === 'function') opts.onMount(api);
    requestAnimationFrame(() => dialog.classList.add('is-open'));
    return api;
  }

  function confirm(config) {
    const opts = typeof config === 'string' ? { message: config } : config || {};
    return new Promise((resolve) => {
      let settled = false;
      const ref = modal({
        title: opts.title || '确认操作',
        size: 'sm',
        className: 'dialog-confirm',
        body: `<p class="confirm-message">${escapeHtml(opts.message || '确定要执行此操作吗？')}</p>${
          opts.detail ? `<p class="confirm-detail">${escapeHtml(opts.detail)}</p>` : ''
        }`,
        footer: `<button type="button" class="btn btn--ghost" data-confirm-cancel>取消</button>
                 <button type="button" class="btn ${opts.danger ? 'btn--danger' : 'btn--primary'}" data-confirm-ok>${
                   escapeHtml(opts.confirmText || '确定')
                 }</button>`,
        onMount(api) {
          api.root.querySelector('[data-confirm-cancel]').addEventListener('click', () => {
            settled = true;
            api.close('cancel');
            resolve(false);
          });
          api.root.querySelector('[data-confirm-ok]').addEventListener('click', () => {
            settled = true;
            api.close('confirm');
            resolve(true);
          });
        },
        onClose() {
          if (!settled) resolve(false);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Markdown                                                           */
  /* ------------------------------------------------------------------ */

  function linkLabel(text) {
    return escapeHtml(text);
  }

  function inlineMarkdown(source) {
    let text = String(source == null ? '' : source);
    const stash = [];
    function stashHtml(html) {
      const token = `\u0000${stash.length}\u0000`;
      stash.push(html);
      return token;
    }

    // Fenced/inline code is protected before any other parsing.
    text = text.replace(/`([^`\n]+)`/g, (_, code) => stashHtml(`<code>${escapeHtml(code)}</code>`));

    // Inline math.
    text = text.replace(/\$\$([^$\n]+?)\$\$/g, (_, tex) =>
      stashHtml(
        `<span class="math-inline" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</span>`
      )
    );
    text = text.replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (match, prefix, tex) => {
      return `${prefix}${stashHtml(
        `<span class="math-inline" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</span>`
      )}`;
    });

    text = escapeHtml(text);
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (match, label, url) => {
      const safe = U.safeUrl(url.replace(/&amp;/g, '&'));
      if (!safe) return label;
      return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/\u0000(\d+)\u0000/g, (_, index) => stash[Number(index)] || '');
    return text;
  }

  function isTableDivider(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }

  function parseTableCells(line) {
    let text = line.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|')) text = text.slice(0, -1);
    return text.split('|').map((cell) => cell.trim());
  }

  function renderMarkdown(source) {
    const input = String(source == null ? '' : source).replace(/\r\n?/g, '\n');
    if (!input.trim()) return '';
    const lines = input.split('\n');
    const out = [];
    let paragraph = [];
    let listType = '';
    let listItems = [];
    let codeFence = null;
    let codeLines = [];
    let tableRows = [];
    let quoteLines = [];

    function flushParagraph() {
      if (!paragraph.length) return;
      out.push(`<p>${inlineMarkdown(paragraph.join('\n'))}</p>`);
      paragraph = [];
    }
    function flushList() {
      if (!listItems.length) return;
      const tag = listType === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${tag}>`);
      listItems = [];
      listType = '';
    }
    function flushTable() {
      if (tableRows.length < 2) {
        tableRows.forEach((row) => paragraph.push(row));
        tableRows = [];
        return;
      }
      const head = parseTableCells(tableRows[0]);
      const rows = tableRows.slice(2).map(parseTableCells);
      out.push(
        `<div class="md-table-wrap"><table><thead><tr>${head
          .map((cell) => `<th>${inlineMarkdown(cell)}</th>`)
          .join('')}</tr></thead><tbody>${rows
          .map((row) => `<tr>${head.map((_, i) => `<td>${inlineMarkdown(row[i] || '')}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      tableRows = [];
    }
    function flushQuote() {
      if (!quoteLines.length) return;
      out.push(`<blockquote>${inlineMarkdown(quoteLines.join('\n'))}</blockquote>`);
      quoteLines = [];
    }
    function flushAll() {
      flushParagraph();
      flushList();
      flushTable();
      flushQuote();
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (codeFence) {
        if (line.trim().startsWith('```')) {
          const lang = codeFence === true ? '' : codeFence;
          out.push(
            `<div class="code-block"><div class="code-block__bar"><span>${escapeHtml(
              lang || 'code'
            )}</span><button type="button" class="code-copy" data-copy-code>${icon('copy', {
              size: 14
            })}<span>复制</span></button></div><pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`
          );
          codeFence = null;
          codeLines = [];
        } else {
          codeLines.push(line);
        }
        continue;
      }

      if (line.trim().startsWith('```')) {
        flushAll();
        codeFence = line.trim().slice(3).trim() || true;
        continue;
      }

      const displayMath = line.trim().match(/^\$\$(.+)\$\$$/);
      if (displayMath) {
        flushAll();
        out.push(
          `<div class="math-block" data-tex="${escapeHtml(displayMath[1].trim())}">${escapeHtml(
            displayMath[1].trim()
          )}</div>`
        );
        continue;
      }

      if (!line.trim()) {
        flushAll();
        continue;
      }

      if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
        flushAll();
        out.push('<hr>');
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushAll();
        const level = Math.min(4, heading[1].length + 1);
        out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        flushParagraph();
        flushList();
        flushTable();
        quoteLines.push(line.replace(/^\s*>\s?/, ''));
        continue;
      }

      const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (bullet || ordered) {
        flushParagraph();
        flushTable();
        flushQuote();
        const nextType = ordered ? 'ol' : 'ul';
        if (listType && listType !== nextType) flushList();
        listType = nextType;
        listItems.push((bullet || ordered)[1]);
        continue;
      }

      if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        flushAll();
        tableRows = [line, lines[i + 1]];
        i += 1;
        while (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].trim()) {
          tableRows.push(lines[i + 1]);
          i += 1;
        }
        flushTable();
        continue;
      }

      paragraph.push(line);
    }

    if (codeFence) {
      out.push(
        `<div class="code-block"><div class="code-block__bar"><span>${escapeHtml(
          typeof codeFence === 'string' ? codeFence : 'code'
        )}</span><button type="button" class="code-copy" data-copy-code>${icon('copy', {
          size: 14
        })}<span>复制</span></button></div><pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre></div>`
      );
    }
    flushAll();
    return out.join('');
  }

  function typeset(root) {
    if (!root) return;
    const nodes = root.querySelectorAll('.math-inline, .math-block');
    if (!nodes.length) return;
    if (!global.katex) return;
    nodes.forEach((node) => {
      if (node.dataset.typeset === 'true') return;
      const tex = node.getAttribute('data-tex');
      if (!tex) return;
      try {
        global.katex.render(tex, node, {
          throwOnError: false,
          displayMode: node.classList.contains('math-block'),
          strict: false,
          trust: false
        });
        node.dataset.typeset = 'true';
      } catch (err) {
        node.textContent = tex;
      }
    });
  }

  function bindCopyButtons(root) {
    if (!root || root.dataset.copyBound === '1') return;
    root.dataset.copyBound = '1';
    root.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-copy-code]');
      if (!btn) return;
      const code = btn.closest('.code-block')?.querySelector('code');
      if (!code) return;
      copyText(code.textContent).then(() => {
        btn.classList.add('is-copied');
        btn.querySelector('span').textContent = '已复制';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          const label = btn.querySelector('span');
          if (label) label.textContent = '复制';
        }, 1600);
      });
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(String(text));
      return true;
    } catch (err) {
      const area = document.createElement('textarea');
      area.value = String(text);
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (_) {}
      area.remove();
      return ok;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Visual helpers                                                     */
  /* ------------------------------------------------------------------ */

  function ring(percent, options) {
    const opts = options || {};
    const size = opts.size || 72;
    const stroke = opts.stroke || 7;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const value = U.clamp(percent, 0, 100);
    const offset = circumference - (value / 100) * circumference;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${value}%">
      <circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke-width="${stroke}"></circle>
      <circle class="ring__value" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke-width="${stroke}"
        stroke="${opts.color || 'currentColor'}" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"></circle>
    </svg>`;
  }

  function miniBars(data, options) {
    const opts = options || {};
    const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
    return `<div class="mini-bars" aria-hidden="true">${data
      .map(
        (d) =>
          `<span class="mini-bars__item${d.active ? ' is-active' : ''}"><span style="height:${Math.max(
            8,
            Math.round(((Number(d.value) || 0) / max) * 100)
          )}%"></span></span>`
      )
      .join('')}</div>`;
  }

  function weeklyChart(days, options) {
    const opts = options || {};
    const width = 600;
    const height = opts.height || 190;
    const padX = 18;
    const padTop = 22;
    const padBottom = 38;
    const chartH = height - padTop - padBottom;
    const max = Math.max(60, ...days.map((d) => Number(d.minutes) || 0));
    const hasData = days.some((d) => Number(d.minutes) > 0);
    const slot = (width - padX * 2) / 7;
    const barW = Math.min(38, slot * 0.46);
    const bars = days
      .map((day, i) => {
        const value = Number(day.minutes) || 0;
        const h = Math.max(value ? 8 : 3, (value / max) * chartH);
        const x = padX + slot * i + (slot - barW) / 2;
        const y = padTop + chartH - h;
        const active = day.isToday;
        const fill = active ? 'url(#weekbar-active)' : value ? 'url(#weekbar)' : '#e8e5de';
        return `<g class="week-bar${active ? ' is-today' : ''}">
          <rect x="${x}" y="${hasData ? padTop : padTop + chartH - 4}" width="${barW}" height="${
          hasData ? chartH : 4
        }" rx="${barW / 2}" fill="rgba(23,32,51,.035)"></rect>
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="${barW / 2}" fill="${fill}"></rect>
          ${
            value
              ? `<text x="${x + barW / 2}" y="${Math.max(14, y - 8)}" text-anchor="middle" class="week-bar__value">${value}</text>`
              : ''
          }
          <text x="${x + barW / 2}" y="${height - 14}" text-anchor="middle" class="week-bar__label${
            active ? ' is-today' : ''
          }">${escapeHtml(day.label)}</text>
          ${
            active
              ? `<circle cx="${x + barW / 2}" cy="${height - 5}" r="2.5" fill="#3157f5"></circle>`
              : ''
          }
        </g>`;
      })
      .join('');
    return `<svg class="weekly-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="近七天专注时长">
      <defs>
        <linearGradient id="weekbar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ea3ff"></stop>
          <stop offset="1" stop-color="#dbe2ff"></stop>
        </linearGradient>
        <linearGradient id="weekbar-active" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3157f5"></stop>
          <stop offset="1" stop-color="#7f93ff"></stop>
        </linearGradient>
      </defs>
      <line x1="${padX}" y1="${padTop + chartH}" x2="${width - padX}" y2="${
        padTop + chartH
      }" stroke="#ebe7df" stroke-width="1"></line>
      ${bars}
    </svg>`;
  }

  function avatar(name, options) {
    const opts = options || {};
    const initial = String(name || '同').trim().slice(0, 1).toUpperCase();
    return `<span class="avatar${opts.className ? ` ${opts.className}` : ''}" style="--avatar-size:${
      opts.size || 36
    }px" aria-hidden="true"><span>${escapeHtml(initial)}</span></span>`;
  }

  function subjectTag(id, options) {
    const s = U.subject(id);
    const opts = options || {};
    return `<span class="subject-tag" style="--subject:${s.color};--subject-soft:${s.soft};--subject-ink:${
      s.ink
    }">${opts.dot === false ? '' : `<i></i>`}${escapeHtml(s.name)}</span>`;
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} 天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function empty(options) {
    const opts = options || {};
    return `<div class="empty-state">
      <span class="empty-state__art">${icon(opts.icon || 'sparkles', { size: 26 })}</span>
      <h3>${escapeHtml(opts.title || '这里还是空的')}</h3>
      <p>${escapeHtml(opts.desc || '从添加第一条内容开始吧。')}</p>
      ${opts.action || ''}
    </div>`;
  }

  function debounceInput(el, fn, wait) {
    let timer = 0;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(fn, wait || 160);
    });
  }

  function setButtonLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.classList.add('is-loading');
      button.innerHTML = `<span class="spinner"></span><span>${escapeHtml(label || '处理中')}</span>`;
    } else {
      button.disabled = false;
      button.classList.remove('is-loading');
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function scrollToBottom(el, smooth) {
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }

  function hydrateIcons(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-icon]').forEach((node) => {
      if (node.dataset.iconReady === '1') return;
      const name = node.getAttribute('data-icon');
      const size = Number(node.getAttribute('data-icon-size')) || 18;
      node.innerHTML = icon(name, { size });
      node.dataset.iconReady = '1';
      if (!node.style.display) node.style.display = 'inline-flex';
    });
  }

  const UI = {
    icon,
    hydrateIcons,
    toast,
    modal,
    confirm,
    renderMarkdown,
    typeset,
    bindCopyButtons,
    copyText,
    ring,
    miniBars,
    weeklyChart,
    avatar,
    subjectTag,
    relativeTime,
    empty,
    debounceInput,
    setButtonLoading,
    scrollToBottom,
    escapeHtml
  };
  SN.UI = UI;
})(window);
