SF.pages.trash = async function (root) {
  root.innerHTML = SF.head('Trash', 'Restore items or delete them for good.') + '<div id="list" class="stack" style="gap:8px"></div>';
  const list = root.querySelector('#list');
  let items = [];

  async function load() {
    items = [];
    try {
      const sets = [['notes', 'Note', 'title'], ['flashcards', 'Flashcard', 'front'], ['pdfs', 'Uploaded PDF', 'title']];
      for (const s of sets) {
        const rows = (await SF.db.list(s[0])).filter((r) => r.deleted);
        rows.forEach((r) => items.push(Object.assign({}, r, { _t: s[0], _label: s[1], _name: r[s[2]] })));
      }
    } catch (e) { SF.err(e); }
    items.sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at)));
    list.innerHTML = items.length ? items.map((it, n) =>
      '<div class="card row between"><div style="min-width:0"><div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + SF.esc(it._name) + '</div>' +
      '<div style="margin-top:4px">' + SF.badges(it._label) + '</div></div>' +
      '<div class="row"><button class="btn ghost" data-a="restore" data-n="' + n + '"><i data-lucide="rotate-ccw"></i>Restore</button>' +
      '<button class="btn danger" data-a="wipe" data-n="' + n + '"><i data-lucide="trash-2"></i>Delete forever</button></div></div>'
    ).join('') : SF.empty('Trash is empty.');
    SF.icons();
  }

  list.onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const it = items[Number(b.dataset.n)];
    try {
      if (b.dataset.a === 'restore') await SF.db.update(it._t, it.id, { deleted: false, deleted_at: null });
      if (b.dataset.a === 'wipe') {
        if (!confirm('Delete permanently? This cannot be undone.')) return;
        if (it._t === 'pdfs') await SF.db.removeFile(it.file_path);
        await SF.db.remove(it._t, it.id);
      }
      load();
    } catch (x) { SF.err(x); }
  };
  load();
};