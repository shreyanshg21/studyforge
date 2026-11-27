SF.pages.generate = function (root) {
  root.innerHTML = SF.head('Generate notes', 'Tell the AI what you are studying and get exam-ready notes in seconds.') +
    '<div class="split">' +
    '<form class="card stack" id="f">' +
    '<label class="field">Academic level<select name="level">' + SF.opts(SF.LEVELS) + '</select></label>' +
    '<label class="field">Subject<input name="subject" placeholder="e.g. Physics"></label>' +
    '<label class="field">Topic<input name="topic" required placeholder="e.g. Newton\'s laws of motion"></label>' +
    '<label class="field">Length<select name="length"><option>Short</option><option selected>Brief Description</option><option>Detailed</option></select></label>' +
    '<label class="field">Syllabus points (optional)<textarea name="syllabus" rows="4" placeholder="One per line"></textarea></label>' +
    '<button class="btn block" id="go"><i data-lucide="sparkles"></i>Generate notes</button></form>' +
    '<div id="out">' + SF.empty('Your notes will appear here.') + '</div></div>';
  SF.icons();

  const out = root.querySelector('#out');
  let text = '', meta = {};

  function show() {
    out.innerHTML = '<div class="card"><div class="row wrap" style="margin-bottom:16px">' +
      '<button class="btn ghost" id="copy"><i data-lucide="copy"></i>Copy</button>' +
      '<button class="btn ghost" id="pdf"><i data-lucide="file-down"></i>Export PDF</button>' +
      '<button class="btn" id="save"><i data-lucide="save"></i>Save to My Notes</button></div>' +
      '<div class="prose">' + SF.md(text) + '</div></div>';
    SF.icons();
    out.querySelector('#copy').onclick = () => SF.copy(text).catch(SF.err);
    out.querySelector('#pdf').onclick = () => SF.exportPdf(meta.topic, text);
    out.querySelector('#save').onclick = async () => {
      try {
        await SF.db.insert('notes', { title: meta.topic, subject: meta.subject || 'General', level: meta.level, content: text, deleted: false });
        SF.toast('Saved to My Notes');
      } catch (e) { SF.err(e); }
    };
  }

  root.querySelector('#f').onsubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    SF.busy(root.querySelector('#go'), 'Writing notes...', async () => {
      text = await SF.ai.notes(fd);
      meta = fd;
      show();
    });
  };
};