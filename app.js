(() => {
  const W = 400, H = 500; // 카드 그림 좌표 (4:5)
  const BRAND = '다시, 한 장';
  const all = [];
  MOODS.forEach((m) => m.cards.forEach((text, i) => all.push({ id: `${m.id}-${i + 1}`, mood: m, text })));
  const byId = (id) => all.find((c) => c.id === id);

  // 카드마다 늘 같은 그림이 나오도록 id로 정해지는 난수
  function rand(seedText) {
    let s = 0;
    for (const ch of seedText) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 글자를 가리지 않게 위·아래 띠에만 도형을 둔다
  function shapesFor(card) {
    const r = rand(card.id);
    const kinds = ['circle', 'pebble', 'star', 'ring'];
    const out = [];
    for (let i = 0; i < 7; i++) {
      const top = i % 2 === 0;
      out.push({
        kind: kinds[Math.floor(r() * kinds.length)],
        color: card.mood.shapes[i % card.mood.shapes.length],
        x: 20 + r() * (W - 40),
        y: top ? 15 + r() * 75 : H - 15 - r() * 75,
        size: 10 + r() * 30,
        rot: r() * 360,
      });
    }
    return out;
  }

  function starPoints(cx, cy, R) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? R * 0.45 : R;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return pts;
  }

  function shapeSvg(s) {
    const t = `rotate(${s.rot.toFixed(1)} ${s.x.toFixed(1)} ${s.y.toFixed(1)})`;
    if (s.kind === 'circle') return `<circle cx="${s.x}" cy="${s.y}" r="${s.size * 0.6}" fill="${s.color}"/>`;
    if (s.kind === 'ring') return `<circle cx="${s.x}" cy="${s.y}" r="${s.size * 0.6}" fill="none" stroke="${s.color}" stroke-width="${s.size * 0.25}"/>`;
    if (s.kind === 'pebble') return `<ellipse cx="${s.x}" cy="${s.y}" rx="${s.size}" ry="${s.size * 0.65}" fill="${s.color}" transform="${t}"/>`;
    const pts = starPoints(s.x, s.y, s.size * 0.8).map((p) => p.join(',')).join(' ');
    return `<polygon points="${pts}" fill="${s.color}" stroke="${s.color}" stroke-width="3" stroke-linejoin="round" transform="${t}"/>`;
  }

  function cardHtml(card) {
    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="${W}" height="${H}" fill="${card.mood.bg}"/>${shapesFor(card).map(shapeSvg).join('')}</svg>`;
    const safe = card.text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return `${svg}<p class="text">${safe}</p><span class="tag">${card.mood.label}</span>`;
  }

  // 저장용: 같은 그림을 1080×1350 이미지로 다시 그린다
  async function cardPng(card) {
    await document.fonts.load('64px Jua');
    const k = 2.7;
    const cv = document.createElement('canvas');
    cv.width = W * k; cv.height = H * k;
    const g = cv.getContext('2d');
    g.scale(k, k);
    g.fillStyle = card.mood.bg;
    g.fillRect(0, 0, W, H);
    for (const s of shapesFor(card)) {
      g.save();
      g.fillStyle = s.color; g.strokeStyle = s.color;
      g.translate(s.x, s.y); g.rotate((s.rot * Math.PI) / 180);
      g.beginPath();
      if (s.kind === 'circle') { g.arc(0, 0, s.size * 0.6, 0, Math.PI * 2); g.fill(); }
      else if (s.kind === 'ring') { g.lineWidth = s.size * 0.25; g.arc(0, 0, s.size * 0.6, 0, Math.PI * 2); g.stroke(); }
      else if (s.kind === 'pebble') { g.ellipse(0, 0, s.size, s.size * 0.65, 0, 0, Math.PI * 2); g.fill(); }
      else {
        starPoints(0, 0, s.size * 0.8).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath(); g.lineJoin = 'round'; g.lineWidth = 3; g.fill(); g.stroke();
      }
      g.restore();
    }
    const lines = card.text.split('\n');
    g.fillStyle = '#1E2A5A';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = 27;
    g.font = `${size}px Jua`;
    while (Math.max(...lines.map((l) => g.measureText(l).width)) > W * 0.8) g.font = `${--size}px Jua`;
    const lh = size * 1.5;
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * lh));
    g.font = '12px "Gowun Dodum", sans-serif';
    g.fillStyle = '#4A5585';
    g.fillText(BRAND, W / 2, H - 22);
    return new Promise((ok) => cv.toBlob(ok, 'image/png'));
  }

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
        <button type="button" data-id="${c.id}" aria-label="${c.text.replace(/\n/g, ' ')}">
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
