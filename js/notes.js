SF.pages.notes = async function (root) {
  root.innerHTML = SF.head('My notes', 'Everything you have generated or saved.') + SF.filterBar() + '<div id="list" class="grid"></div>';
  const list = root.querySelector('#list');
  let all = [];

  const card = (n) =>
    '<div class="card col"><h3>' + SF.esc(n.title) + '</h3><div class="row wrap">' + SF.badges(n.subject, n.level) + '</div>' +
    '<p class="snippet">' + SF.esc((n.content || '').replace(/[#*>\x60-]/g, '').slice(0, 240)) + '</p>' +
    '<div class="row wrap push">' +
    '<button class="btn ghost" data-a="view" data-id="' + n.id + '"><i data-lucide="eye"></i>View</button>' +
    '<button class="btn ghost" data-a="pdf" data-id="' + n.id + '" aria-label="Download PDF"><i data-lucide="file-down"></i></button>' +
    '<button class="btn ghost" data-a="mark" data-id="' + n.id + '" aria-label="Bookmark"><i data-lucide="bookmark"></i></button>' +
    '<button class="btn ghost" data-a="trash" data-id="' + n.id + '" aria-label="Move to Trash"><i data-lucide="trash-2"></i></button></div></div>';

  function draw() {
    const f = SF.readFilters(root);
    const shown = all.filter((n) => (!f.lv || n.level === f.lv) && (!f.sb || n.subject === f.sb) &&
      (n.title + ' ' + n.subject + ' ' + n.content).toLowerCase().includes(f.q));
    list.innerHTML = shown.length ? shown.map(card).join('')
      : '<div style="grid-column:1/-1">' + SF.empty(all.length ? 'No notes match your search.' : 'No notes yet. Generate your first set on the Generate Notes page.') + '</div>';
    SF.icons();
  }
  async function load() {
    try { all = (await SF.db.list('notes')).filter((n) => !n.deleted); } catch (e) { SF.err(e); }
    SF.fillSubjects(root, all);
    draw();
  }
  async function trash(n, modal) {
    try {
      await SF.db.update('notes', n.id, { deleted: true, deleted_at: new Date().toISOString() });
      if (modal) modal.remove();
      SF.toast('Moved to Trash');
      load();
    } catch (e) { SF.err(e); }
  }

  function open(n) {
    const m = SF.modal(n.title,
      '<div class="row wrap" style="margin-bottom:16px">' +
      '<button class="btn ghost" id="e"><i data-lucide="pencil"></i>Edit</button>' +
      '<button class="btn ghost" id="p"><i data-lucide="file-down"></i>Download PDF</button>' +
      '<button class="btn ghost" id="t"><i data-lucide="trash-2"></i>Trash</button></div>' +
      '<div id="body" class="prose">' + SF.md(n.content) + '</div>');
    const body = m.querySelector('#body');
    m.querySelector('#p').onclick = () => SF.exportPdf(n.title, n.content);
    m.querySelector('#t').onclick = () => trash(n, m);
    m.querySelector('#e').onclick = () => {
      body.className = 'stack';
      body.innerHTML = '<input id="t2" value="' + SF.esc(n.title) + '" aria-label="Title">' +
        '<textarea id="c2" rows="16" aria-label="Content">' + SF.esc(n.content) + '</textarea>' +
        '<button class="btn" id="s">Save changes</button>';
      body.querySelector('#s').onclick = async () => {
        try {
          await SF.db.update('notes', n.id, { title: body.querySelector('#t2').value, content: body.querySelector('#c2').value });
          m.remove(); SF.toast('Note updated'); load();
        } catch (e) { SF.err(e); }
      };
    };
  }

  list.onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const n = all.find((x) => x.id === b.dataset.id);
    if (b.dataset.a === 'view') open(n);
    if (b.dataset.a === 'pdf') SF.exportPdf(n.title, n.content);
    if (b.dataset.a === 'trash') trash(n);
    if (b.dataset.a === 'mark') {
      try { await SF.db.insert('saved', { kind: 'note', title: n.title, subject: n.subject, level: n.level, content: n.content }); SF.toast('Saved to Saved PDFs'); }
      catch (x) { SF.err(x); }
    }
  };
  SF.bindFilters(root, draw);
  load();
};