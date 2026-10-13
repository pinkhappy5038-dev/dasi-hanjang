(async () => {
  const W = 400, H = 500; // 카드 좌표 (4:5)
  const BRAND = '다시, 한 장';
  const all = [];
  MOODS.forEach((m) => m.cards.forEach((text, i) => all.push({ id: `${m.id}-${i + 1}`, mood: m, text })));
  const byId = (id) => all.find((c) => c.id === id);

  const ART_H = 300; // 카드 위쪽 그림 칸 높이 (아래 200은 글 칸)
  const EXTS = ['png', 'jpg', 'jpeg', 'webp'];

  // images/<마음 id>.png(또는 jpg·webp)가 있으면 그 그림을 쓴다. 없으면 색 칸만 둔다
  function findImage(mood) {
    return new Promise((done) => {
      const tryAt = (i) => {
        if (i >= EXTS.length) return done(null);
        const img = new Image();
        img.onload = () => done(img);
        img.onerror = () => tryAt(i + 1);
        img.src = `images/${mood.id}.${EXTS[i]}`;
      };
      tryAt(0);
    });
  }

  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function cardHtml(card) {
    const m = card.mood;
    const art = m.img
      ? `<img src="${m.img.src}" alt="" loading="lazy">`
      : '';
    return `<div class="art" style="background:${m.shapes[0]}33">${art}</div>
      <p class="text">${esc(card.text)}</p><span class="tag">${m.label}</span>`;
  }

  // 저장용: 같은 카드를 1080×1350 이미지로 다시 그린다
  async function cardPng(card) {
    await document.fonts.load('64px Jua');
    const k = 2.7;
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d');
    g.scale(k, k);
    g.fillStyle = card.mood.bg;
    g.fillRect(0, 0, W, H);
    const img = card.mood.img;
    if (img) {
      // object-fit: cover 와 같은 자르기
      const s = Math.max(W / img.naturalWidth, ART_H / img.naturalHeight);
      const sw = W / s, sh = ART_H / s;
      g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, ART_H);
    } else {
      g.fillStyle = `${card.mood.shapes[0]}33`;
      g.fillRect(0, 0, W, ART_H);
    }
    const lines = card.text.split('\n');
    g.fillStyle = '#1E2A5A';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = 22;
    g.font = `${size}px Jua`;
    while (Math.max(...lines.map((l) => g.measureText(l).width)) > W * 0.84) g.font = `${--size}px Jua`;
    const lh = size * 1.45;
    const mid = ART_H + (H - ART_H - 28) / 2;
    lines.forEach((l, i) => g.fillText(l, W / 2, mid + (i - (lines.length - 1) / 2) * lh));
    g.font = '11px "Gowun Dodum", sans-serif';
    g.fillStyle = '#4A5585';
    g.fillText(BRAND, W / 2, H - 16);
    return new Promise((ok) => cv.toBlob(ok, 'image/png'));
  }

  await Promise.all(MOODS.map(async (m) => { m.img = await findImage(m); }));

  // 화면
  const $ = (id) => document.getElementById(id);
  const chips = $('chips'), result = $('result'), cardEl = $('card'), toast = $('toast');
  let current = null;

  const say = (msg) => { toast.textContent = msg; };

  function show(card, scroll = true) {
    current = card;
    cardEl.innerHTML = cardHtml(card);
    result.hidden = false;
    say('');
    chips.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === card.mood.id)));
    history.replaceState(null, '', `?c=${card.id}`);
    if (scroll) result.scrollIntoView({ block: 'center' });
  }

  function pick(moodId) {
    const pool = all.filter((c) => c.mood.id === moodId && c !== current);
    show(pool[Math.floor(Math.random() * pool.length)]);
  }

  MOODS.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.mood = m.id;
    b.style.background = m.bg;
    b.setAttribute('aria-pressed', 'false');
    b.textContent = m.label;
    b.addEventListener('click', () => pick(m.id));
    chips.append(b);
  });

  $('preview').innerHTML = cardHtml(all[0]);

  $('all').innerHTML = MOODS.map((m) => `
    <div class="group"><h3>${m.label}</h3><div class="grid">
      ${all.filter((c) => c.mood === m).map((c) => `
        <button type="button" data-id="${c.id}" aria-label="${esc(c.text.replace(/\n/g, ' '))}">
          <div class="card card-mini">${cardHtml(c)}</div></button>`).join('')}
    </div></div>`).join('');
  $('all').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-id]');
    if (b) show(byId(b.dataset.id));
  });

  $('next').addEventListener('click', () => pick(current.mood.id));

  $('save').addEventListener('click', async () => {
    const blob = await cardPng(current);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `응원카드-${current.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say('카드를 이미지로 저장했어요.');
  });

  $('share').addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?c=${current.id}`;
    const text = `${current.text.replace(/\n/g, ' ')}\n— ${BRAND}`;
    try {
      const file = new File([await cardPng(current)], `응원카드-${current.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, url });
        return;
      }
      if (navigator.share) { await navigator.share({ title: BRAND, text, url }); return; }
      await navigator.clipboard.writeText(url);
      say('카드 링크를 복사했어요. 보내고 싶은 곳에 붙여 넣어 주세요.');
    } catch (e) {
      if (e.name !== 'AbortError') say('보내지 못했어요. 저장하기로 이미지를 받아 직접 보내 주세요.');
    }
  });

  // 받은 링크로 들어오면 그 카드를 바로 보여 준다
  const shared = byId(new URLSearchParams(location.search).get('c'));
  if (shared) show(shared);
})();
