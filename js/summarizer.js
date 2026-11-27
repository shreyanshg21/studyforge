SF.pages.summarizer = function (root) {
  const MAX_MB = 10;
  let pdf = null, text = '';

  root.innerHTML = SF.head('AI summariser', 'Paste long notes or upload a PDF to get a summary, key takeaways and revision points.') +
    '<div class="split" style="grid-template-columns:1fr 1fr">' +
    '<div class="card stack"><textarea id="txt" rows="14" placeholder="Paste your notes or chapter text here..." aria-label="Text to summarise"></textarea>' +
    '<label class="drop" style="padding:12px;flex-direction:row;justify-content:center"><i data-lucide="file-up"></i><span id="fname">Or upload a PDF (max ' + MAX_MB + ' MB)</span>' +
    '<input type="file" id="pdf" accept="application/pdf" hidden></label>' +
    '<button type="button" class="link" id="rm" hidden>Remove PDF</button>' +
    '<button class="btn block" id="go"><i data-lucide="sparkles"></i>Summarise</button></div>' +
    '<div id="out">' + SF.empty('Your summary will appear here.') + '</div></div>';
  SF.icons();

  const out = root.querySelector('#out'), fname = root.querySelector('#fname'), rm = root.querySelector('#rm');

  root.querySelector('#pdf').onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') return SF.toast('Please choose a PDF file.', 'err');
    if (f.size > MAX_MB * 1048576) return SF.toast('PDF is too large (max ' + MAX_MB + ' MB). Paste the text instead.', 'err');
    const r = new FileReader();
    r.onload = () => { pdf = { name: f.name, data: String(r.result).split(',')[1] }; fname.textContent = f.name; rm.hidden = false; };
    r.readAsDataURL(f);
  };
  rm.onclick = () => { pdf = null; fname.textContent = 'Or upload a PDF (max ' + MAX_MB + ' MB)'; rm.hidden = true; root.querySelector('#pdf').value = ''; };

  function show() {
    const title = pdf ? pdf.name.replace(/\.pdf$/i, '') : 'Summary';
    out.innerHTML = '<div class="card"><div class="row wrap" style="margin-bottom:16px">' +
      '<button class="btn ghost" id="copy"><i data-lucide="copy"></i>Copy</button>' +
      '<button class="btn ghost" id="p"><i data-lucide="file-down"></i>PDF</button>' +
      '<button class="btn" id="save"><i data-lucide="save"></i>Save to My Notes</button></div>' +
      '<div class="prose">' + SF.md(text) + '</div></div>';
    SF.icons();
    out.querySelector('#copy').onclick = () => SF.copy(text).catch(SF.err);
    out.querySelector('#p').onclick = () => SF.exportPdf(title, text);
    out.querySelector('#save').onclick = async () => {
      try { await SF.db.insert('notes', { title: 'Summary: ' + title, subject: 'Summaries', level: '', content: text, deleted: false }); SF.toast('Saved to My Notes'); }
      catch (e) { SF.err(e); }
    };
  }

  root.querySelector('#go').onclick = (e) => {
    const t = root.querySelector('#txt').value;
    if (!t.trim() && !pdf) return SF.toast('Paste some text or upload a PDF first.', 'err');
    SF.busy(e.currentTarget, 'Summarising...', async () => {
      text = await SF.ai.summary({ text: t, pdf: pdf && pdf.data });
      show();
    });
  };
};