(function () {
  const c = window.SF_CONFIG || {};
  SF.hasSupabase = !!(c.SUPABASE_URL && c.SUPABASE_URL.startsWith('http') && !c.SUPABASE_URL.includes('YOUR_') &&
    c.SUPABASE_ANON_KEY && c.SUPABASE_ANON_KEY.length > 20 && !c.SUPABASE_ANON_KEY.includes('YOUR_'));
  SF.sb = SF.hasSupabase ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null;

  const key = (t) => 'sf_' + t;
  const lget = (t) => { try { return JSON.parse(localStorage.getItem(key(t)) || '[]'); } catch (e) { return []; } };
  const lset = (t, v) => {
    try { localStorage.setItem(key(t), JSON.stringify(v)); }
    catch (e) { throw new Error('Browser storage is full. Delete some items or connect Supabase.'); }
  };
  const byNew = (a, b) => String(b.created_at).localeCompare(String(a.created_at));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  // Supabase when configured, otherwise localStorage. Same API either way.
  SF.db = {
    async list(t) {
      if (SF.hasSupabase) {
        const { data, error } = await SF.sb.from(t).select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      }
      return lget(t).sort(byNew);
    },
    async insert(t, row) {
      if (SF.hasSupabase) {
        const { data, error } = await SF.sb.from(t).insert(row).select().single();
        if (error) throw error;
        return data;
      }
      const r = Object.assign({ id: uuid(), created_at: new Date().toISOString() }, row);
      lset(t, [r].concat(lget(t)));
      return r;
    },
    async update(t, id, patch) {
      if (SF.hasSupabase) {
        const { error } = await SF.sb.from(t).update(patch).eq('id', id);
        if (error) throw error;
        return;
      }
      lset(t, lget(t).map((r) => (r.id === id ? Object.assign({}, r, patch) : r)));
    },
    async remove(t, id) {
      if (SF.hasSupabase) {
        const { error } = await SF.sb.from(t).delete().eq('id', id);
        if (error) throw error;
        return;
      }
      lset(t, lget(t).filter((r) => r.id !== id));
    },
    async uploadFile(file) {
      if (SF.hasSupabase) {
        const { data: s } = await SF.sb.auth.getSession();
        const path = s.session.user.id + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
        const { error } = await SF.sb.storage.from('pdfs').upload(path, file, { contentType: 'application/pdf' });
        if (error) throw error;
        return { url: SF.sb.storage.from('pdfs').getPublicUrl(path).data.publicUrl, path: path };
      }
      const url = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
      });
      return { url: url, path: '' };
    },
    async removeFile(path) {
      if (SF.hasSupabase && path) await SF.sb.storage.from('pdfs').remove([path]);
    },
  };
})();