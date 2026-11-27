SF.pages.flashcards = async function (root) {
  let cards = [], notes = [], deck = '', i = 0, flip = false, order = null;

  root.innerHTML = SF.head('Flashcards', 'Tap a card to flip it.') +
    '<div class="split rev"><div id="study"></div><div class="stack">' +
    '<form class="card stack" id="gf"><h2><i data-lucide="sparkles"></i>Auto-generate with AI</h2>' +
    '<label class="field">Deck name<input name="deck" required></label>' +
    '<label class="field">Topic<input name="topic" placeholder="e.g. Photosynthesis"></label>' +
    '<label class="field">Or use one of your notes<select name="noteId" id="notesel"><option value="">None</option></select></label>' +
    '<label class="field">Number of cards<input name="count" type="number" min="3" max="30" value="10"></label>' +
    '<button class="btn block" id="gbtn"><i data-lucide="sparkles"></i>Generate cards</button></form>' +
    '<form class="card stack" id="mf"><h2><i data-lucide="plus"></i>Add a card</h2>' +
    '<label class="field">Deck<input name="deck" required list="decks"></label><datalist id="decks"></datalist>' +
    '<label class="field">Front (question or word)<textarea name="front" rows="2" required></textarea></label>' +
    '<label class="field">Image URL (optional)<input name="front_image" type="url"></label>' +
    '<label class="field">Back (answer or meaning)<textarea name="back" rows="2" required></textarea></label>' +
    '<button class="btn block">Add card</button></form></div></div>';
  SF.icons();

  const study = root.querySelector('#study');
  const decks = () => [...new Set(cards.map((c) => c.deck))];
  const list = () => cards.filter((c) => c.deck === deck);
  const seq = () => { const l = list(); return order && order.length === l.length ? order.map((k) => l[k]) : l; };

  function draw() {
    root.querySelector('#decks').innerHTML = decks().map((d) => '<option value="' + SF.esc(d) + '">').join('');
    root.querySelector('#notesel').innerHTML = '<option value="">None</option>' + notes.map((n) => '<option value="' + n.id + '">' + SF.esc(n.title) + '</option>').join('');
    if (!decks().length) { study.innerHTML = SF.empty('No flashcards yet. Add one by hand or let AI make a deck.'); return; }
    const s = seq(), idx = Math.min(i, Math.max(s.length - 1, 0)), cur = s[idx];
    const img = cur && /^https?:\/\//.test(cur.front_image || '') ? '<img src="' + SF.esc(cur.front_image) + '" alt="">' : '';
    study.innerHTML =
      '<div class="row wrap" style="margin-bottom:16px"><select id="deck" style="max-width:260px" aria-label="Deck">' + SF.opts(decks(), deck) + '</select>' +
      '<span class="muted">Card ' + (idx + 1) + ' of ' + s.length + '</span>' +
      '<button class="btn ghost" id="shuf"><i data-lucide="shuffle"></i>Shuffle</button></div>' +
      '<div class="scene" id="scene" role="button" tabindex="0" aria-label="Flip card"><div class="flip ' + (flip ? 'on' : '') + '">' +
      '<div class="face front">' + img + '<div>' + SF.esc(cur.front) + '</div></div><div class="face back">' + SF.esc(cur.back) + '</div></div></div>' +
      '<div class="row center" style="margin-top:16px"><button class="btn ghost" id="prev" aria-label="Previous"><i data-lucide="chevron-left"></i></button>' +
      '<button class="btn ghost" id="del"><i data-lucide="trash-2"></i>Delete card</button>' +
      '<button class="btn ghost" id="next" aria-label="Next"><i data-lucide="chevron-right"></i></button></div>';
    SF.icons();

    const scene = study.querySelector('#scene');
    const toggle = () => { flip = !flip; scene.firstChild.classList.toggle('on', flip); };
    scene.onclick = toggle;
    scene.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } };
    const go = (d) => { flip = false; i = (idx + d + s.length) % s.length; draw(); };
    study.querySelector('#prev').onclick = () => go(-1);
    study.querySelector('#next').onclick = () => go(1);
    study.querySelector('#shuf').onclick = () => { order = [...list().keys()].sort(() => Math.random() - 0.5); i = 0; flip = false; draw(); };
    study.querySelector('#deck').onchange = (e) => { deck = e.target.value; i = 0; order = null; flip = false; draw(); };
    study.querySelector('#del').onclick = async () => {
      try { await SF.db.update('flashcards', cur.id, { deleted: true, deleted_at: new Date().toISOString() }); i = 0; order = null; flip = false; load(); }
      catch (e) { SF.err(e); }
    };
  }

  async function load() {
    try {
      cards = (await SF.db.list('flashcards')).filter((c) => !c.deleted);
      notes = (await SF.db.list('notes')).filter((n) => !n.deleted);
    } catch (e) { SF.err(e); }
    if (!decks().includes(deck)) deck = decks()[0] || '';
    draw();
  }

  root.querySelector('#mf').onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      await SF.db.insert('flashcards', Object.assign({}, fd, { deleted: false }));
      deck = fd.deck; order = null; i = 0;
      e.target.front.value = ''; e.target.back.value = ''; e.target.front_image.value = '';
      SF.toast('Card added'); load();
    } catch (x) { SF.err(x); }
  };

  root.querySelector('#gf').onsubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const note = notes.find((n) => n.id === fd.noteId);
    if (!fd.topic && !note) return SF.toast('Enter a topic or pick a note.', 'err');
    SF.busy(root.querySelector('#gbtn'), 'Generating...', async () => {
      const out = await SF.ai.cards({ topic: fd.topic || (note && note.title), text: note && note.content, count: fd.count });
      for (const c of out) await SF.db.insert('flashcards', { deck: fd.deck, front: c.front, back: c.back, front_image: '', deleted: false });
      deck = fd.deck; i = 0; order = null; flip = false;
      SF.toast(out.length + ' cards created in "' + fd.deck + '"');
      await load();
    });
  };
  load();
};