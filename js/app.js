(function () {
  const NAV = [
    ['generate', 'Generate Notes', 'sparkles'], ['notes', 'My Notes', 'notebook-text'], ['upload', 'Upload Notes', 'upload'],
    ['saved', 'Saved PDFs', 'bookmark'], ['library', 'Community Library', 'library'], ['planner', 'Study Planner', 'calendar-check'],
    ['flashcards', 'Flashcards', 'layers'], ['summarizer', 'AI Summariser', 'file-text'], ['trash', 'Trash', 'trash-2'],
  ];
  const $ = (id) => document.getElementById(id);

  // ---------- Sidebar + router ----------
  $('nav').innerHTML = NAV.map((n) =>
    '<a class="nav-item" href="#/' + n[0] + '" data-p="' + n[0] + '" title="' + n[1] + '"><i data-lucide="' + n[2] + '"></i><span class="lbl">' + n[1] + '</span></a>'
  ).join('');

  function route() {
    const name = location.hash.replace('#/', '') || 'generate';
    const found = NAV.find((n) => n[0] === name) || NAV[0];
    document.querySelectorAll('#nav .nav-item').forEach((a) => a.classList.toggle('active', a.dataset.p === found[0]));
    $('title').textContent = found[1];
    document.body.classList.remove('menu-open');
    const v = $('view');
    v.innerHTML = '';
    const page = SF.pages[found[0]];
    Promise.resolve(page(v)).catch(SF.err);
    window.scrollTo(0, 0);
  }

  // ---------- Theme, menu, collapse ----------
  const setThemeIcon = () => {
    $('theme').innerHTML = '<i data-lucide="' + (document.documentElement.classList.contains('dark') ? 'sun' : 'moon') + '"></i>';
    SF.icons();
  };
  $('theme').onclick = () => {
    const d = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', d ? 'dark' : 'light');
    setThemeIcon();
  };
  $('open-menu').onclick = () => document.body.classList.add('menu-open');
  $('close-menu').onclick = $('backdrop').onclick = () => document.body.classList.remove('menu-open');
  $('collapse').onclick = () => document.body.classList.toggle('collapsed');
  $('key-btn').onclick = () => SF.setKey();

  // ---------- Auth ----------
  let mode = 'in';
  $('a-toggle').onclick = () => {
    mode = mode === 'in' ? 'up' : 'in';
    $('auth-title').textContent = mode === 'in' ? 'Sign in to your notes' : 'Create your account';
    $('a-btn').textContent = mode === 'in' ? 'Sign in' : 'Create account';
    $('a-toggle').textContent = mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in';
  };
  $('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const msg = $('a-msg');
    msg.hidden = true;
    const email = $('a-email').value, password = $('a-pw').value;
    const res = mode === 'in' ? await SF.sb.auth.signInWithPassword({ email, password }) : await SF.sb.auth.signUp({ email, password });
    if (res.error) { msg.className = 'alert err'; msg.textContent = res.error.message; msg.hidden = false; return; }
    if (mode === 'up' && !res.data.session) {
      msg.className = 'alert ok'; msg.textContent = 'Account created. Check your email to confirm, then sign in.'; msg.hidden = false; return;
    }
    location.reload();
  };
  $('logout').onclick = async () => { await SF.sb.auth.signOut(); location.reload(); };

  // ---------- Start ----------
  async function boot() {
    SF.icons();
    if (SF.hasSupabase) {
      const { data } = await SF.sb.auth.getSession();
      if (!data.session) { $('auth').hidden = false; return; }
      $('logout').hidden = false;
    } else {
      $('banner').hidden = false;
    }
    $('app').hidden = false;
    setThemeIcon();
    window.addEventListener('hashchange', route);
    route();
  }
  boot();
})();