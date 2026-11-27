SF.pages.planner = async function (root) {
  let tasks = [], exams = [], view = 'week';
  const VIEWS = [['today', 'Today'], ['week', 'Next 7 days'], ['month', 'Next 30 days'], ['all', 'All']];

  root.innerHTML = SF.head('Study planner', 'Plan sessions, track assignments and count down to exams.') +
    '<div class="split rev"><div class="stack">' +
    '<form class="card task-form" id="tf">' +
    '<input name="title" required placeholder="What will you study or submit?" aria-label="Task">' +
    '<input name="subject" placeholder="Subject" aria-label="Subject">' +
    '<input name="due" type="date" required value="' + SF.today() + '" aria-label="Due date">' +
    '<select name="kind" aria-label="Type"><option>Study session</option><option>Assignment</option></select>' +
    '<button class="btn"><i data-lucide="plus"></i>Add</button></form>' +
    '<div class="tabs" id="tabs"></div><div id="prog"></div><div id="tasks" class="stack" style="gap:8px"></div></div>' +
    '<div class="card"><h2><i data-lucide="timer"></i>Exam countdown</h2>' +
    '<form id="ef" class="stack" style="gap:8px;margin-bottom:12px"><input name="name" required placeholder="Exam name" aria-label="Exam name">' +
    '<div class="row"><input name="date" type="date" required value="' + SF.addDays(14) + '" aria-label="Exam date"><button class="btn" aria-label="Add exam"><i data-lucide="plus"></i></button></div></form>' +
    '<div id="exams" class="stack" style="gap:8px"></div></div></div>';
  SF.icons();

  const td = SF.today();

  function drawTabs() {
    root.querySelector('#tabs').innerHTML = VIEWS.map((v) => '<button class="tab ' + (view === v[0] ? 'on' : '') + '" data-v="' + v[0] + '">' + v[1] + '</button>').join('');
  }
  function drawTasks() {
    const end = { today: td, week: SF.addDays(7), month: SF.addDays(30), all: '9999' }[view];
    const shown = tasks.filter((x) => view === 'all' || (x.due <= end && (x.due >= td || !x.done))).sort((a, b) => String(a.due).localeCompare(String(b.due)));
    const done = shown.filter((x) => x.done).length;
    const pct = shown.length ? Math.round((done / shown.length) * 100) : 0;
    root.querySelector('#prog').innerHTML = '<div class="row between muted" style="margin-bottom:4px"><span>' + done + ' of ' + shown.length + ' done</span><span>' + pct + '%</span></div>' +
      '<div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>';
    root.querySelector('#tasks').innerHTML = shown.length ? shown.map((x) => {
      const late = x.due < td && !x.done;
      return '<div class="task ' + (x.done ? 'done' : '') + '"><input type="checkbox" data-a="tg" data-id="' + x.id + '" ' + (x.done ? 'checked' : '') + ' aria-label="Mark ' + SF.esc(x.title) + ' done">' +
        '<div class="grow"><div class="name">' + SF.esc(x.title) + '</div><div class="row wrap muted" style="font-size:12px">' + SF.badges(x.kind) +
        (x.subject ? '<span>' + SF.esc(x.subject) + '</span>' : '') + '<span class="' + (late ? 'late' : '') + '">' + (late ? 'Overdue: ' : '') + x.due + '</span></div></div>' +
        '<button class="icon-btn" data-a="del" data-id="' + x.id + '" aria-label="Delete task"><i data-lucide="trash-2"></i></button></div>';
    }).join('') : SF.empty('Nothing planned for this range. Add a study session above.');
    SF.icons();
  }
  function drawExams() {
    const days = (d) => Math.round((Date.parse(d) - Date.parse(td)) / 864e5);
    const sorted = exams.slice().sort((a, b) => a.date.localeCompare(b.date));
    root.querySelector('#exams').innerHTML = sorted.length ? sorted.map((x) => {
      const d = days(x.date);
      return '<div class="exam"><div><div style="font-weight:500">' + SF.esc(x.name) + '</div><div class="muted" style="font-size:12px">' + x.date + '</div></div>' +
        '<div class="row"><b>' + (d < 0 ? 'Done' : d === 0 ? 'Today' : d + 'd') + '</b><button class="icon-btn" data-a="delx" data-id="' + x.id + '" aria-label="Delete exam"><i data-lucide="trash-2"></i></button></div></div>';
    }).join('') : '<p class="muted">No exams added.</p>';
    SF.icons();
  }
  async function load() {
    try { tasks = await SF.db.list('tasks'); exams = await SF.db.list('exams'); } catch (e) { SF.err(e); }
    drawTabs(); drawTasks(); drawExams();
  }

  root.querySelector('#tf').onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try { await SF.db.insert('tasks', Object.assign({}, fd, { done: false })); e.target.title.value = ''; load(); } catch (x) { SF.err(x); }
  };
  root.querySelector('#ef').onsubmit = async (e) => {
    e.preventDefault();
    try { await SF.db.insert('exams', Object.fromEntries(new FormData(e.target))); e.target.name.value = ''; load(); } catch (x) { SF.err(x); }
  };
  root.querySelector('#tabs').onclick = (e) => {
    const b = e.target.closest('[data-v]');
    if (b) { view = b.dataset.v; drawTabs(); drawTasks(); }
  };
  root.onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || b.dataset.a === 'tg') return;
    try {
      if (b.dataset.a === 'del') await SF.db.remove('tasks', b.dataset.id);
      if (b.dataset.a === 'delx') await SF.db.remove('exams', b.dataset.id);
      load();
    } catch (x) { SF.err(x); }
  };
  root.onchange = async (e) => {
    const b = e.target.closest('[data-a="tg"]');
    if (!b) return;
    try { await SF.db.update('tasks', b.dataset.id, { done: b.checked }); load(); } catch (x) { SF.err(x); }
  };
  load();
};