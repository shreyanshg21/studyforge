SF.pages.upload = function (root) {
  const MAX = SF.hasSupabase ? 20 : 3; // MB (local mode stores the file inside the browser)
  let file = null;

  root.innerHTML = SF.head('Upload notes', 'Share a PDF with other students through the Community Library.') +
    '<form class="card stack" id="f" style="max-width:680px;margin:0 auto">' +
    '<div class="drop" id="drop" role="button" tabindex="0"><i data-lucide="upload-cloud"></i><span id="dtext">Drag a PDF here, or click to browse (max ' + MAX + ' MB)</span>' +
    '<input type="file" id="file" accept="application/pdf" hidden></div>' +
    '<label class="field">Title<input name="title" required></label>' +
    '<div class="two"><label class="field">Subject<input name="subject" required placeholder="e.g. Chemistry"></label>' +
    '<label class="field">Academic level<select name="level">' + SF.opts(SF.LEVELS) + '</select></label></div>' +
    '<label class="field">Description<textarea name="description" rows="3"></textarea></label>' +
    '<button class="btn block" id="go">Upload PDF</button></form>';
  SF.icons();

  const form = root.querySelector('#f'), drop = root.querySelector('#drop'), input = root.querySelector('#file');

  function pick(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') return SF.toast('Only PDF files are allowed.', 'err');
    if (f.size > MAX * 1048576) return SF.toast('File is too large. Maximum is ' + MAX + ' MB.', 'err');
    file = f;
    root.querySelector('#dtext').textContent = f.name + ' (' + (f.size / 1048576).toFixed(1) + ' MB)';
    if (!form.title.value) form.title.value = f.name.replace(/\.pdf$/i, '');
  }
  drop.onclick = () => input.click();
  drop.onkeydown = (e) => { if (e.key === 'Enter') input.click(); };
  input.onchange = () => pick(input.files[0]);
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]); };

  form.onsubmit = (e) => {
    e.preventDefault();
    if (!file) return SF.toast('Choose a PDF first.', 'err');
    const fd = Object.fromEntries(new FormData(form));
    SF.busy(root.querySelector('#go'), 'Uploading...', async () => {
      const up = await SF.db.uploadFile(file);
      await SF.db.insert('pdfs', Object.assign({}, fd, { file_url: up.url, file_path: up.path, file_name: file.name, deleted: false }));
      SF.toast('Uploaded. Your PDF is now in the Community Library.');
      file = null; form.reset();
      root.querySelector('#dtext').textContent = 'Drag a PDF here, or click to browse (max ' + MAX + ' MB)';
    });
  };
};