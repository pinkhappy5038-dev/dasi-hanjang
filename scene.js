// 그림 파일(images/<id>.png)이 없을 때 카드 위쪽에 들어가는 풍경 그림.
// 마음마다 하루 중 다른 시간: 넘어졌을 때=아침, 버티기 힘들 때=밤, 조급할 때=바람 부는 오후, 나를 잃었을 때=해 질 녘
window.sceneSvg = (() => {
  const SCENES = {
    fall: {
      sky: ['#BAE6FD', '#F0F9FF'], hills: ['#BAE6FD', '#7DD3FC', '#FDA4AF'],
      sun: { x: 90, y: 92, r: 30, c: '#FB7185' }, clouds: [[250, 60, 1], [330, 110, 0.7]],
      extra: sprout(205, 238),
    },
    endure: {
      sky: ['#0C4A6E', '#1E5A8A'], hills: ['#155E8A', '#0E7490', '#1F2433'],
      sun: { x: 320, y: 70, r: 24, c: '#FDF9F3', moon: true }, clouds: [],
      extra: stars() + house(110, 214) + sprout(300, 250, '#34D399'),
    },
    rush: {
      sky: ['#7DD3FC', '#E0F2FE'], hills: ['#BAE6FD', '#7DD3FC', '#86EFAC'],
      sun: { x: 330, y: 70, r: 26, c: '#FB7185' }, clouds: [[90, 70, 1], [200, 50, 0.6], [160, 120, 0.5]],
      extra: tree(110, 236, -8) + tree(300, 228, -6) + flower(205, 250),
    },
    lost: {
      sky: ['#FDA4AF', '#FED7AA'], hills: ['#FBCFE8', '#FB7185', '#F43F5E'],
      sun: { x: 200, y: 200, r: 46, c: '#FDF9F3' }, clouds: [[80, 70, 0.8]],
      extra: path() + birds(),
    },
  };

  function cloud(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff">
      <ellipse cx="0" cy="0" rx="34" ry="16"/><circle cx="-12" cy="-10" r="14"/><circle cx="10" cy="-14" r="18"/></g>`;
  }
  function sprout(x, y, c = '#10B981') {
    return `<g transform="translate(${x} ${y})"><path d="M0 0 V-18" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
      <path d="M0 -14 C-12 -20 -16 -10 -14 -6 C-8 -6 -2 -9 0 -14Z M0 -18 C10 -26 16 -18 14 -13 C8 -12 2 -14 0 -18Z" fill="${c}"/></g>`;
  }
  function tree(x, y, lean) {
    return `<g transform="translate(${x} ${y}) rotate(${lean})"><rect x="-3" y="-6" width="6" height="16" rx="3" fill="#92400E"/>
      <path d="M0 -44 L18 -6 H-18Z" fill="#34D399"/><path d="M0 -58 L14 -28 H-14Z" fill="#10B981"/></g>`;
  }
  function flower(x, y) {
    return `<g transform="translate(${x} ${y})"><path d="M0 0 V-16" stroke="#10B981" stroke-width="3"/>
      <circle cx="0" cy="-20" r="7" fill="#FB7185"/><circle cx="0" cy="-20" r="3" fill="#FDE68A"/></g>`;
  }
  function house(x, y) {
    return `<g transform="translate(${x} ${y})"><rect x="-16" y="-20" width="32" height="24" rx="4" fill="#FDF9F3"/>
      <path d="M-20 -18 L0 -34 L20 -18Z" fill="#FB7185"/><rect x="-6" y="-14" width="12" height="10" rx="2" fill="#FDE68A"/></g>`;
  }
  function stars() {
    return [[60, 40], [140, 70], [220, 30], [260, 110], [90, 120], [370, 130]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#FDF9F3" opacity=".85"/>`).join('');
  }
  function path() {
    return '<path d="M200 300 C170 280 240 262 205 246 C190 240 200 232 200 228" stroke="#FDF9F3" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>';
  }
  function birds() {
    return [[120, 110], [140, 98], [290, 90]]
      .map(([x, y]) => `<path d="M${x - 7} ${y} q7 -7 7 0 q0 -7 7 0" stroke="#1F2433" stroke-width="2" fill="none" stroke-linecap="round"/>`).join('');
  }

  return (id) => {
    const s = SCENES[id];
    const sun = s.sun.moon
      ? `<circle cx="${s.sun.x}" cy="${s.sun.y}" r="${s.sun.r}" fill="${s.sun.c}"/><circle cx="${s.sun.x + 10}" cy="${s.sun.y - 6}" r="${s.sun.r}" fill="${s.sky[0]}"/>`
      : `<circle cx="${s.sun.x}" cy="${s.sun.y}" r="${s.sun.r}" fill="${s.sun.c}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#g-${id})"/>${sun}${s.clouds.map((c) => cloud(...c)).join('')}
      <path d="M0 210 C80 170 160 200 230 182 C300 165 350 190 400 178 V300 H0Z" fill="${s.hills[0]}"/>
      <path d="M0 236 C90 210 170 240 250 222 C320 206 370 226 400 220 V300 H0Z" fill="${s.hills[1]}"/>
      ${s.extra}
      <path d="M0 262 C100 244 190 270 280 254 C340 244 380 256 400 252 V300 H0Z" fill="${s.hills[2]}"/></svg>`;
  };
})();
