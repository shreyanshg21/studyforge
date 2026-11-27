(function () {
  const LEN = {
    'Short': 'concise (about 250 words), key points only',
    'Brief Description': 'moderately detailed (about 600 words)',
    'Detailed': 'comprehensive and in-depth (1200+ words) with worked examples',
  };
  const cut = (s) => String(s || '').slice(0, 30000);
  const cfg = () => window.SF_CONFIG || {};

  function getKey() {
    const k = cfg().GEMINI_API_KEY;
    if (k && !k.includes('YOUR_')) return k;
    return localStorage.getItem('sf_gemini_key') || '';
  }
  SF.setKey = function () {
    const k = window.prompt('Paste your free Gemini API key (get one at aistudio.google.com/apikey).\nIt is saved only in this browser.');
    if (k && k.trim()) { localStorage.setItem('sf_gemini_key', k.trim()); SF.toast('AI key saved'); return k.trim(); }
    return '';
  };

  async function gemini(text, opts) {
    opts = opts || {};
    let key = getKey();
    if (!key) key = SF.setKey();
    if (!key) throw new Error('Add a Gemini API key to use AI features (key button, top right).');
    const model = cfg().GEMINI_MODEL || 'gemini-2.5-flash';
    const parts = [{ text: text }];
    if (opts.pdf) parts.push({ inline_data: { mime_type: 'application/pdf', data: opts.pdf } });
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: opts.json ? { responseMimeType: 'application/json' } : {} }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini request failed');
    const out = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map((p) => p.text || '').join('');
    if (!out) throw new Error('The AI returned an empty answer. Try again.');
    return out;
  }

  SF.ai = {
    notes(f) {
      return gemini(
        'You are an expert tutor. Write ' + (LEN[f.length] || LEN['Brief Description']) + ' study notes in Markdown for a ' + f.level + ' student.\n' +
        'Subject: ' + (f.subject || 'General') + '\nTopic: ' + f.topic + '\n' +
        (f.syllabus ? 'Make sure these syllabus points are covered: ' + cut(f.syllabus) + '\n' : '') +
        'Use clear headings, bullet points, **bold** key terms, a "Key Formulas & Definitions" section where relevant, and a short "Quick Revision" list at the end. Output Markdown only, no preamble.'
      );
    },
    async cards(o) {
      const n = Math.min(Number(o.count) || 10, 30);
      const txt = await gemini(
        'Create ' + n + ' high-quality study flashcards about: ' + (o.topic || 'the text below') + '.\n' +
        (o.text ? 'Base them on this material:\n' + cut(o.text) + '\n' : '') +
        'Each card: a short question or term on the front, a clear answer or meaning on the back.\n' +
        'Return ONLY valid JSON in this exact shape: {"cards":[{"front":"...","back":"..."}]}',
        { json: true }
      );
      const parsed = JSON.parse(txt.replace(/\x60\x60\x60json|\x60\x60\x60/g, '').trim());
      return (parsed.cards || parsed).filter((c) => c.front && c.back);
    },
    summary(o) {
      return gemini(
        'Summarise the study material ' + (o.pdf ? 'in the attached PDF' : 'below') + ' for exam revision. Output Markdown with exactly these sections:\n' +
        '## Summary (concise bullet points)\n## Key Takeaways\n## Quick Exam Revision Points (short, memorable lines)\n' +
        (o.text ? '\nMaterial:\n' + cut(o.text) : ''),
        { pdf: o.pdf }
      );
    },
  };
})();