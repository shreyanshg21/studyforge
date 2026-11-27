SF.pages.saved = async function (root) {
  root.innerHTML = SF.head('Saved PDFs', 'Your bookmarks from My Notes and the Community Library.') + '<div id="list" class="grid"></div>';
  const list = root.querySelector('#list');
  let rows = [];

  const card = (s) =>
    '<div class="card col"><div class="row between" style="align-items:flex-start"><h3>' + SF.esc(s.title) + '</h3>' +
    '<button class="icon-btn" data-a="rm" data-id="' + s.id + '" aria-label="Remove bookmark"><i data-lucide="x"></i></button></div>' +
    '<div class="row wrap">' + SF.badges(s.kind === 'pdf' ? 'PDF' : 'Note', s.subject, s.level) + '</div>' +
    '<div class="row push"><button class="btn ghost" data-a="open" data-id="' + s.id + '"><i data-lucide="eye"></i>Open</button>' +
    '<button class="btn ghost" data-a="dl" data-id="' + s.id + '" aria-label="Download"><i data-lucide="download"></i></button></div></div>';

  async function load() {
    try { rows = await SF.db.list('saved'); } catch (e) { SF.err(e); }
    list.innerHTML = rows.length ? rows.map(card).join('')
      : '<div style="grid-column:1/-1">' + SF.empty('Nothing saved yet. Use the bookmark button on a note or a library PDF.') + '</div>';
    SF.icons();
  }

  list.onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const s = rows.find((x) => x.id === b.dataset.id);
    try {
      if (b.dataset.a === 'rm') { await SF.db.remove('saved', s.id); load(); }
      if (b.dataset.a === 'dl') s.kind === 'pdf' ? SF.downloadUrl(s.url, s.title + '.pdf') : SF.exportPdf(s.title, s.content);
      if (b.dataset.a === 'open') {
        s.kind === 'pdf'
          ? SF.modal(s.title, '<iframe src="' + SF.esc(s.url) + '" title="' + SF.esc(s.title) + '"></iframe>', true)
          : SF.modal(s.title, '<div class="prose">' + SF.md(s.content) + '</div>');
      }
    } catch (x) { SF.err(x); }
  };
  load();
};