SF.pages.library = async function (root) {
  root.innerHTML = SF.head('Community library', 'PDF notes shared by students.') + SF.filterBar() + '<div id="list" class="grid"></div>';
  const list = root.querySelector('#list');
  let all = [];

  const card = (p) =>
    '<div class="card col"><h3>' + SF.esc(p.title) + '</h3><div class="row wrap">' + SF.badges(p.subject, p.level) + '</div>' +
    '<p class="snippet">' + SF.esc(p.description) + '</p>' +
    '<div class="row wrap push"><button class="btn ghost" data-a="view" data-id="' + p.id + '"><i data-lucide="eye"></i>Preview</button>' +
    '<button class="btn ghost" data-a="dl" data-id="' + p.id + '" aria-label="Download"><i data-lucide="download"></i></button>' +
    '<button class="btn ghost" data-a="save" data-id="' + p.id + '" aria-label="Save to Saved PDFs"><i data-lucide="bookmark"></i></button></div></div>';

  function draw() {
    const f = SF.readFilters(root);
    const shown = all.filter((p) => (!f.lv || p.level === f.lv) && (!f.sb || p.subject === f.sb) &&
      (p.title + ' ' + p.subject + ' ' + p.description).toLowerCase().includes(f.q));
    list.innerHTML = shown.length ? shown.map(card).join('')
      : '<div style="grid-column:1/-1">' + SF.empty(all.length ? 'Nothing matches your search.' : 'No PDFs yet. Be the first to upload one.') + '</div>';
    SF.icons();
  }
  async function load() {
    try { all = (await SF.db.list('pdfs')).filter((p) => !p.deleted); } catch (e) { SF.err(e); }
    SF.fillSubjects(root, all);
    draw();
  }
  async function save(p) {
    try {
      const have = (await SF.db.list('saved')).some((s) => s.url === p.file_url);
      if (have) return SF.toast('Already in Saved PDFs');
      await SF.db.insert('saved', { kind: 'pdf', title: p.title, subject: p.subject, level: p.level, url: p.file_url });
      SF.toast('Saved to Saved PDFs');
    } catch (e) { SF.err(e); }
  }

  list.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const p = all.find((x) => x.id === b.dataset.id);
    if (b.dataset.a === 'dl') SF.downloadUrl(p.file_url, p.file_name);
    if (b.dataset.a === 'save') save(p);
    if (b.dataset.a === 'view') {
      const m = SF.modal(p.title,
        '<div class="row" style="margin-bottom:12px"><button class="btn" id="d"><i data-lucide="download"></i>Download</button>' +
        '<button class="btn ghost" id="s"><i data-lucide="bookmark"></i>Save to Saved PDFs</button></div>' +
        '<iframe src="' + SF.esc(p.file_url) + '" title="' + SF.esc(p.title) + '"></iframe>', true);
      m.querySelector('#d').onclick = () => SF.downloadUrl(p.file_url, p.file_name);
      m.querySelector('#s').onclick = () => save(p);
    }
  };
  SF.bindFilters(root, draw);
  load();
};