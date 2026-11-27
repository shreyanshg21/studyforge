window.SF = { pages: {}, LEVELS: ['School', 'College', 'Competitive Exam'] };

SF.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
SF.md = (t) => DOMPurify.sanitize(marked.parse(t || ''));
SF.opts = (arr, sel) => arr.map((v) => '<option ' + (v === sel ? 'selected' : '') + '>' + SF.esc(v) + '</option>').join('');
SF.badges = (...a) => a.filter(Boolean).map((x) => '<span class="badge">' + SF.esc(x) + '</span>').join('');
SF.icons = () => { if (window.lucide) lucide.createIcons(); };
SF.head = (title, sub) => '<div class="page-h"><h1>' + SF.esc(title) + '</h1>' + (sub ? '<p>' + SF.esc(sub) + '</p>' : '') + '</div>';
SF.empty = (t) => '<div class="empty">' + SF.esc(t) + '</div>';

SF.toast = (msg, type) => {
  const d = document.createElement('div');
  d.className = 'toast ' + (type || 'ok');
  d.textContent = msg;
  document.getElementById('toasts').append(d);
  setTimeout(() => d.remove(), 3800);
};
SF.err = (e) => SF.toast((e && e.message) || String(e), 'err');

SF.modal = (title, html, wide) => {
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = '<div class="modal ' + (wide ? 'wide' : '') + '" role="dialog" aria-label="' + SF.esc(title) + '">' +
    '<div class="modal-h"><h2>' + SF.esc(title) + '</h2><button class="icon-btn" data-close aria-label="Close"><i data-lucide="x"></i></button></div>' +
    '<div class="modal-b">' + html + '</div></div>';
  o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) o.remove(); });
  document.body.append(o);
  SF.icons();
  return o;
};

// Disable a button and show a spinner while an async job runs
SF.busy = async (btn, label, fn) => {
  const old = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>' + SF.esc(label);
  SF.icons();
  try { return await fn(); }
  catch (e) { SF.err(e); }
  finally { btn.disabled = false; btn.innerHTML = old; SF.icons(); }
};

SF.copy = async (t) => { await navigator.clipboard.writeText(t); SF.toast('Copied to clipboard'); };

SF.exportPdf = (title, md) => {
  const d = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  const W = d.internal.pageSize.getWidth() - 80;
  let y = 56;
  const clean = (s) => s.replace(/\*\*|__|`/g, '').replace(/^\s*[-*+]\s+/, '\u2022 ').replace(/[^\x00-\xFF]/g, '');
  const add = (text, size, bold) => {
    d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size);
    d.splitTextToSize(text, W).forEach((line) => {
      if (y > 790) { d.addPage(); y = 56; }
      d.text(line, 40, y); y += size + 5;
    });
  };
  add(clean(title || 'Notes'), 22, true); y += 8;
  (md || '').split('\n').forEach((raw) => {
    if (!raw.trim()) { y += 6; return; }
    const h = raw.match(/^(#{1,6})\s+(.*)/);
    if (h) { y += 6; add(clean(h[2]), 19 - h[1].length * 2, true); }
    else add(clean(raw), 11, false);
  });
  d.save((title || 'notes').replace(/[^\w]+/g, '_') + '.pdf');
  SF.toast('PDF downloaded');
};

SF.downloadUrl = async (url, name) => {
  try {
    const b = await (await fetch(url)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name || 'file.pdf'; a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { window.open(url, '_blank'); }
};

SF.iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
SF.today = () => SF.iso(new Date());
SF.addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return SF.iso(d); };

// Shared search + filter bar (My Notes, Community Library)
SF.filterBar = () =>
  '<div class="filters"><input id="f-q" placeholder="Search..." aria-label="Search">' +
  '<select id="f-lv" aria-label="Academic level"><option value="">All levels</option>' + SF.opts(SF.LEVELS) + '</select>' +
  '<select id="f-sb" aria-label="Subject"><option value="">All subjects</option></select></div>';
SF.fillSubjects = (root, rows) => {
  const s = [...new Set(rows.map((r) => r.subject).filter(Boolean))];
  root.querySelector('#f-sb').innerHTML = '<option value="">All subjects</option>' + SF.opts(s);
};
SF.readFilters = (root) => ({
  q: root.querySelector('#f-q').value.toLowerCase(),
  lv: root.querySelector('#f-lv').value,
  sb: root.querySelector('#f-sb').value,
});
SF.bindFilters = (root, fn) => root.querySelectorAll('.filters input, .filters select').forEach((el) => el.addEventListener('input', fn));