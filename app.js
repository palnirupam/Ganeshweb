(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const stage = $('art-stage');
  const canvas = $('light-canvas');
  const ctx = canvas.getContext('2d');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 760px)');
  const TOTAL_TIME = 12500;
  const captureMode = new URLSearchParams(location.search).get('capture') === '1';
  const TRACK = 'Yun Toh Mushak Sawari Teri - Deva Shree Ganesha _ Ajay Atul _ Ganesh Chaturthi.mp3';
  const TAU = Math.PI * 2;
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (x) => x * x * (3 - 2 * x);
  const svgNS = 'http://www.w3.org/2000/svg';

  let randomSeed = 108;
  function random() {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  }
  function addSvg(parent, name, attributes) {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    parent.append(element);
    return element;
  }

  // Fine botanical geometry stays behind the figure, never across its face.
  const mandala = $('mandala');
  const orbitRing = $('orbit-ring');
  const mandalaPetals = [];
  for (let index = 0; index < 24; index++) {
    const petal = addSvg(mandala, 'g', { transform: `rotate(${index * 15})`, opacity: 0 });
    mandalaPetals.push({ element: petal, angle: index * 15, start: 7300 + index * 28 });
    addSvg(petal, 'path', {
      d: 'M0 -177 C-17 -193 -27 -218 0 -247 C27 -218 17 -193 0 -177Z',
      opacity: index % 2 ? '.7' : '1',
    });
    addSvg(petal, 'path', {
      d: 'M0 -185 Q-8 -214 0 -231 Q8 -214 0 -185',
      opacity: '.5',
    });
  }
  for (let index = 0; index < 16; index++) {
    const petal = addSvg(mandala, 'g', { transform: `rotate(${index * 22.5 + 11.25})`, opacity: 0 });
    addSvg(petal, 'path', { d: 'M0 -184C-23 -209 -29 -235 0 -263C29 -235 23 -209 0 -184Z', opacity: '.45' });
    mandalaPetals.push({ element: petal, angle: index * 22.5 + 11.25, start: 7900 + index * 43 });
  }
  const markings = $('orbit-markings');
  for (let index = 0; index < 72; index++) {
    const angle = (index / 72) * TAU;
    const inner = index % 6 === 0 ? 272 : 275;
    addSvg(markings, 'line', {
      x1: 320 + Math.sin(angle) * inner, y1: 340 + Math.cos(angle) * inner,
      x2: 320 + Math.sin(angle) * 278, y2: 340 + Math.cos(angle) * 278,
      opacity: index % 6 === 0 ? '.5' : '.16',
    });
  }

  const paths = [];
  const timings = [[2300,1700],[2700,1950],[3200,2600],[4800,2000],[5000,1800],[6200,1700],[7300,1700]];
  document.querySelectorAll('#ganesha g[data-start]').forEach((group, groupIndex) => {
    [...group.querySelectorAll('path')].forEach((element, index) => {
      const length = element.getTotalLength();
      element.classList.add('draw-path');
      element.style.setProperty('--path-length', length.toFixed(2));
      const timing = timings[groupIndex] || [Number(group.dataset.start) * 1000, Number(group.dataset.duration) * 1000];
      const start = timing[0] + index * 46;
      const duration = timing[1] * (.7 + Math.min(length / 200, 1) * .3);
      paths.push({ element, length, start, duration, groupIndex, progress: -1 });
    });
  });

  const lightParticles = [];
  for (const path of paths) {
    const count = Math.max(3, Math.ceil(path.length / (narrowScreen.matches ? 6.5 : 4.7)));
    for (let index = 0; index < count; index++) {
      const fraction = index / Math.max(1, count - 1);
      const point = path.element.getPointAtLength(path.length * fraction);
      const angle = random() * TAU;
      const radius = 245 + random() * 170;
      const travel = 850 + random() * 1000;
      lightParticles.push({
        x: point.x + 20, y: point.y + 5,
        sourceX: 320 + Math.cos(angle) * radius,
        sourceY: 340 + Math.sin(angle) * radius,
        controlX: 320 + Math.cos(angle + 1.0) * radius * .75,
        controlY: 340 + Math.sin(angle + 1.0) * radius * .75,
        arrival: path.start + path.duration * fraction,
        travel, size: .4 + random() * .9, phase: random() * TAU,
        brightness: .2 + random() * .65,
      });
    }
  }

  const dust = Array.from({ length: narrowScreen.matches ? 65 : 105 }, () => ({
    x: 30 + random() * 580, y: 35 + random() * 590,
    radius: .35 + random() * .9, phase: random() * TAU,
    speed: .08 + random() * .16, opacity: .1 + random() * .35,
  }));
  const orbitLights = Array.from({ length: 28 }, () => ({
    angle: random() * TAU, radius: 190 + random() * 80,
    speed: (.017 + random() * .017) * (random() > .25 ? 1 : -1),
    size: .45 + random() * .75, phase: random() * TAU,
  }));
  const petals = Array.from({ length: 22 }, () => ({
    x: 95 + random() * 450, y: -100 - random() * 400,
    speed: 20 + random() * 22, phase: random() * TAU, size: 1 + random() * 1.4,
  }));

  let state = 'idle';
  let startedAt = 0;
  let elapsed = 0;
  let frameId = 0;
  let lastFrame = 0;
  let hiddenAt = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dpr = 1;
  let sceneIndex = -1;
  let audioEngine = null;
  let soundEnabled = true;
  let soundChanging = false;
  let paused = false;
  let sceneTime = 0;
  let seeking = false;
  const attraction = { x: 320, y: 340, active: false, strength: 0 };
  let tapWave = null;

  const phases = [
    { at: 0, number: '02', label: 'AWAKENING', note: 'Alo tar poth khuje nichhe…' },
    { at: 2400, number: '03', label: 'A CROWN OF LIGHT', note: 'Prothom aloy mukut er abhash…' },
    { at: 4400, number: '04', label: 'FINDING FORM', note: 'Ektu ektu kore, chena sei rup…' },
    { at: 7300, number: '05', label: 'IN FULL BLOOM', note: 'Aar ektu. Aloy bhore uthuk mon.' },
  ];

  class DevotionalSound {
    constructor() {
      this.audio = new Audio(encodeURI(TRACK));
      this.audio.id = 'background-music';
      this.audio.preload = 'metadata';
      this.audio.loop = true;
      this.audio.volume = .78;
      document.body.append(this.audio);
    }
    async start(restart = false) {
      if (captureMode || seeking || paused || document.hidden) return;
      if (restart) this.audio.currentTime = 0;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!this.context && AudioContextClass) {
        this.context = new AudioContextClass();
        const source = this.context.createMediaElementSource(this.audio);
        const warmth = this.context.createBiquadFilter();
        warmth.type = 'lowshelf'; warmth.frequency.value = 150; warmth.gain.value = 2;
        this.master = this.context.createGain(); this.master.gain.value = .82;
        source.connect(warmth).connect(this.master).connect(this.context.destination);
      }
      // Both calls originate in the initiating gesture, including Safari.
      await Promise.all([this.context?.resume(), this.audio.play()]);
      if (!soundEnabled || paused || document.hidden) this.stop();
    }
    stop() { this.audio.pause(); }
  }
  audioEngine = new DevotionalSound();

  function updateSound() {
    $('sound-button').setAttribute('aria-pressed', String(soundEnabled));
    $('sound-button').setAttribute('aria-label', soundEnabled ? 'Turn music off' : 'Turn music on');
    $('sound-label').textContent = soundEnabled ? 'Music on' : 'Music off';
  }
  function playMusic(restart = false) {
    if (!soundEnabled || captureMode || seeking) return;
    audioEngine.start(restart).catch(() => {
      if (!soundEnabled) return;
      soundEnabled = false; updateSound();
      $('experience-announcement').textContent = 'Gaan chalu hoyni. Sound button e abar tap koro.';
    });
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = Math.min(rect.width / 640, rect.height / 700);
    offsetX = (rect.width - 640 * scale) / 2;
    offsetY = (rect.height - 700 * scale) / 2;
    render(state === 'idle' ? (captureMode ? 0 : performance.now()) : startedAt + sceneTime);
  }

  function glowDot(x, y, radius, alpha, warm = true) {
    ctx.fillStyle = warm ? `rgba(239,195,122,${clamp(alpha)})` : `rgba(255,235,190,${clamp(alpha)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }

  function paintAtmosphere(time) {
    const seconds = motionPreference.matches ? 0 : time / 1000;
    if (!captureMode && !paused && !motionPreference.matches) attraction.strength = lerp(attraction.strength, attraction.active ? 1 : 0, .09);
    for (const mote of dust) {
      let x = mote.x + Math.sin(seconds * mote.speed + mote.phase) * 6;
      let y = mote.y - Math.sin(seconds * mote.speed * .8 + mote.phase) * 12;
      if (!captureMode && !motionPreference.matches && attraction.strength > .001) {
        const pull = smooth(clamp(1 - Math.hypot(x - attraction.x, y - attraction.y) / 100)) * .32 * attraction.strength;
        x = lerp(x, attraction.x, pull); y = lerp(y, attraction.y, pull);
      }
      const alpha = mote.opacity * (.55 + Math.sin(seconds * .65 + mote.phase) * .3);
      glowDot(x, y, mote.radius, alpha);
    }
    for (const point of orbitLights) {
      const angle = point.angle + seconds * point.speed;
      const x = 320 + Math.cos(angle) * point.radius;
      const y = 340 + Math.sin(angle) * point.radius;
      glowDot(x, y, point.size, .15 + (Math.sin(seconds + point.phase) + 1) * .13);
    }
    if (state === 'idle') {
      const glow = ctx.createRadialGradient(320, 328, 0, 320, 328, 52);
      glow.addColorStop(0, 'rgba(238,189,111,.14)');
      glow.addColorStop(.25, 'rgba(218,155,69,.035)');
      glow.addColorStop(1, 'rgba(218,155,69,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(268, 276, 104, 104);
    }
  }

  function drawPaths(time) {
    for (const path of paths) {
      const progress = clamp((time - path.start) / path.duration);
      if (progress !== path.progress) {
        path.element.style.strokeDashoffset = ((1 - progress) * path.length).toFixed(2);
        if (path.element.classList.contains('palm-shape')) path.element.style.fillOpacity = String(smooth(progress));
        path.progress = progress;
      }
      if (ctx && progress > 0 && progress < 1 && !motionPreference.matches) {
        const point = path.element.getPointAtLength(path.length * progress);
        const x = point.x + 20, y = point.y + 5;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        glow.addColorStop(0, 'rgba(255,224,166,.65)');
        glow.addColorStop(.15, 'rgba(255,210,136,.3)');
        glow.addColorStop(1, 'rgba(239,179,87,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 10, y - 10, 20, 20);
        glowDot(x, y, 1.4, .95, false);
      }
    }
  }

  function paintFormation(time, now) {
    for (const particle of lightParticles) {
      const progress = clamp((time - particle.arrival + particle.travel) / particle.travel);
      if (progress <= 0) continue;
      let x = particle.x, y = particle.y, alpha;
      if (progress < 1) {
        const p = smooth(progress), inverse = 1 - p;
        x = inverse * inverse * particle.sourceX + 2 * inverse * p * particle.controlX + p * p * particle.x;
        y = inverse * inverse * particle.sourceY + 2 * inverse * p * particle.controlY + p * p * particle.y;
        const drift = Math.sin(progress * 11 + particle.phase) * Math.sin(progress * Math.PI) * inverse * 21;
        x += drift;
        y += drift * Math.cos(particle.phase + progress * 7);
        alpha = Math.sin(progress * Math.PI) * particle.brightness * 1.15;
        if (progress > .15 && progress < .94) {
          const previous = Math.max(0, p - .022);
          const inv = 1 - previous;
          const previousX = inv * inv * particle.sourceX + 2 * inv * previous * particle.controlX + previous * previous * particle.x;
          const previousY = inv * inv * particle.sourceY + 2 * inv * previous * particle.controlY + previous * previous * particle.y;
          ctx.beginPath();
          ctx.moveTo(previousX + drift, previousY + drift * Math.cos(particle.phase + progress * 7));
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(225,165,81,${alpha * .48})`;
          ctx.lineWidth = .55;
          ctx.stroke();
          glowDot(x, y, particle.size * 3, alpha * .06);
        }
      } else {
        alpha = particle.brightness * (1 - smooth(clamp((time - particle.arrival) / 1800))) * .55;
      }
      glowDot(x, y, particle.size * (progress < 1 ? 1 : .65), alpha);
    }
  }

  function paintRipple(time) {
    if (time > 2600 || motionPreference.matches) return;
    for (let index = 0; index < 2; index++) {
      const progress = clamp((time - index * 280) / 2200);
      if (progress <= 0 || progress >= 1) continue;
      ctx.beginPath();
      ctx.arc(320, 328, 6 + progress * 330, 0, TAU);
      ctx.lineWidth = .75;
      ctx.strokeStyle = `rgba(217,174,102,${(1 - progress) * .29})`;
      ctx.stroke();
    }
  }

  function paintTouchWave(time) {
    if (captureMode || motionPreference.matches || !tapWave) return;
    const progress = clamp((time - tapWave.at) / 850);
    if (progress >= 1) { tapWave = null; return; }
    ctx.beginPath(); ctx.arc(tapWave.x, tapWave.y, 5 + smooth(progress) * 44, 0, TAU);
    ctx.lineWidth = .7;
    ctx.strokeStyle = `rgba(217,174,102,${(1 - progress) * .34})`;
    ctx.stroke();
  }

  function paintPetals(now) {
    const seconds = (now - TOTAL_TIME) / 1000;
    if (seconds > 18 || motionPreference.matches) return;
    for (const petal of petals) {
      const y = petal.y + seconds * petal.speed;
      if (y < 30 || y > 615) continue;
      const x = petal.x + Math.sin(seconds * .8 + petal.phase) * 27;
      const opacity = Math.min(clamp((615 - y) / 120), clamp((18 - seconds) / 4)) * .5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(seconds * .5 + petal.phase);
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * .5, petal.size * 1.7, 0, 0, TAU);
      ctx.fillStyle = `rgba(193,107,53,${opacity})`;
      ctx.fill();
      ctx.restore();
    }
  }

  const heroPaths = [paths.find(path => path.groupIndex === 0 && path.length > 100), paths.find(path => path.groupIndex === 1), paths.filter(path => path.groupIndex === 2)[1]].filter(Boolean);
  function filamentPoint(path, index, progress) {
    const first = path.element.getPointAtLength(0);
    if (progress >= .48) {
      const point = path.element.getPointAtLength(path.length * clamp((progress - .48) / .52));
      return { x: point.x + 20, y: point.y + 5 };
    }
    const p = smooth(clamp(progress / .48)), inv = 1 - p;
    const side = index % 2 ? 1 : -1, endX = first.x + 20, endY = first.y + 5;
    return {
      x: inv ** 3 * (320 + side * 290) + 3 * inv * inv * p * (320 - side * 20) + 3 * inv * p * p * (endX - side * 115) + p ** 3 * endX + Math.sin(p * 11 + index) * inv * p * 22,
      y: inv ** 3 * (420 + index * 38) + 3 * inv * inv * p * (580 - index * 60) + 3 * inv * p * p * (endY - 130) + p ** 3 * endY,
    };
  }
  function paintFilaments(time) {
    if (motionPreference.matches) return;
    heroPaths.forEach((path, index) => {
      const head = (time - 600 - index * 300) / (3400 + index * 450);
      if (head <= 0 || head >= 1.25) return;
      const fade = 1 - smooth(clamp((head - .95) / .3));
      const tail = Math.max(0, head - .24);
      ctx.save(); ctx.lineCap = 'round';
      for (let layer = 0; layer < 2; layer++) {
        ctx.lineWidth = layer ? 1.1 : 4.5;
        for (let step = 1; step <= 32; step++) {
          const previous = filamentPoint(path, index, lerp(tail, Math.min(head, 1), (step - 1) / 32));
          const point = filamentPoint(path, index, lerp(tail, Math.min(head, 1), step / 32));
          ctx.strokeStyle = `rgba(${layer ? '255,223,163' : '222,145,55'},${(step / 32) ** 1.7 * fade * (layer ? .9 : .1)})`;
          ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(point.x, point.y); ctx.stroke();
        }
      }
      const point = filamentPoint(path, index, Math.min(head, 1));
      softGlow(point.x, point.y, 16, fade * .65); glowDot(point.x, point.y, 1.5, fade, false);
      ctx.restore();
    });
  }
  function softGlow(x, y, radius, alpha) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(249,199,116,${alpha})`);
    gradient.addColorStop(.2, `rgba(229,151,59,${alpha * .25})`);
    gradient.addColorStop(1, 'rgba(229,151,59,0)');
    ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const volumeParticles = [];
  if (ctx) {
    const volume = new Path2D('M217 427C207 457 230 485 266 492Q302 507 355 487C378 477 388 450 382 426L351 450Q322 474 286 459L258 449Z M160 263C161 292 171 323 208 336L225 314Q193 308 189 278Z M440 263C439 292 429 323 392 336L375 314Q407 308 411 278Z');
    for (let attempt = 0; attempt < 6000 && volumeParticles.length < 160; attempt++) {
      const x = 155 + random() * 290, y = 260 + random() * 240;
      if (ctx.isPointInPath(volume, x, y)) volumeParticles.push({ x: x + 20, y: y + 5, size: .3 + random() * .6, alpha: .08 + random() * .18, start: (y < 350 ? 4400 : 6000) + random() * 1000 });
    }
  }
  function paintVolume(time) {
    for (const point of volumeParticles) glowDot(point.x, point.y, point.size, smooth(clamp((time - point.start) / 1100)) * point.alpha);
  }
  function paintHighlight(time) {
    if (time < 9600 || motionPreference.matches) return;
    const sweep = clamp((time - 9600) / 1600);
    if (sweep > 0 && sweep < 1) {
      const y = lerp(120, 570, sweep);
      softGlow(320 + Math.sin(sweep * 7) * 22, y, 24, Math.sin(sweep * Math.PI) * .23);
      for (const path of paths) {
        if (![0, 2, 3].includes(path.groupIndex)) continue;
        for (let index = 0; index < 10; index++) {
          const point = path.element.getPointAtLength(path.length * index / 9);
          const distance = Math.abs(point.y + 5 - y);
          if (distance < 22) glowDot(point.x + 20, point.y + 5, .75, (1 - distance / 22) * .8, false);
        }
      }
    }
    if (time > 11200 && time < 13100) {
      const progress = (time - 11200) / 1900;
      ctx.beginPath(); ctx.ellipse(320, 340, 155 + progress * 90, 165 + progress * 95, 0, 0, TAU);
      ctx.strokeStyle = `rgba(234,187,113,${Math.sin(progress * Math.PI) * .13})`; ctx.lineWidth = .65; ctx.stroke();
    }
  }
  function applyTimeline(time) {
    const active = state !== 'idle';
    const ease = (start, duration) => smooth(clamp((time - start) / duration));
    $('ganesha').style.opacity = active ? String(ease(1600, 650)) : '0';
    $('ganesha').style.animation = 'none';
    $('seed').style.opacity = active ? String(1 - ease(0, 700)) : '1';
    $('seed-caption').style.opacity = active ? String(1 - ease(0, 350)) : '1';
    mandala.style.opacity = active ? '.34' : '0';
    // Start as the mandala unfolds, ease in for three seconds, then turn every 80 seconds.
    // The shared clock keeps pause, replay and exported frames in sync.
    const orbitSeconds = active && !motionPreference.matches ? Math.max(0, (time - 7500) / 1000) : 0;
    const ramp = Math.min(orbitSeconds / 3, 1);
    const travel = orbitSeconds < 3 ? 3 * (ramp ** 3 - ramp ** 4 / 2) : orbitSeconds - 1.5;
    const orbitAngle = (travel * 360 / 80).toFixed(4);
    orbitRing.setAttribute('transform', `rotate(${orbitAngle} 320 340)`);
    mandala.setAttribute('transform', `translate(320 330) rotate(${orbitAngle})`);
    for (const petal of mandalaPetals) {
      const progress = ease(petal.start, 1150);
      petal.element.setAttribute('transform', `rotate(${petal.angle + (1 - progress) * 9}) scale(${.79 + progress * .21})`);
      petal.element.setAttribute('opacity', String(progress));
    }
    document.querySelectorAll('.deity-wash').forEach(element => { element.style.opacity = String(ease(4800, 3800)); });
    $('blessing').style.opacity = String(ease(11200, 1300));
    $('blessing').style.transform = `translateY(${(1 - ease(11200, 1300)) * 7}px)`;
    stage.style.setProperty('--scene-scale', String(.975 + ease(0, 9600) * .025));
    document.body.dataset.experience = state;
  }

  function syncPause() {
    document.body.classList.toggle('is-paused', paused);
    if (!$('pause-button')) return;
    $('pause-button').hidden = false;
    $('pause-button').setAttribute('aria-pressed', String(paused));
    $('pause-button').setAttribute('aria-label', paused ? 'Resume animation and music' : 'Pause animation and music');
    $('pause-label').textContent = paused ? 'Resume' : 'Pause';
  }
  function pause() {
    if (paused) return;
    render(performance.now());
    paused = true; syncPause();
    cancelAnimationFrame(frameId); frameId = 0;
    audioEngine.stop();
  }
  function play() {
    if (state === 'idle') {
      if (!paused) { begin(); return; }
      paused = false; syncPause(); ensureAnimation(); return;
    }
    paused = false;
    startedAt = performance.now() - sceneTime;
    syncPause(); playMusic(); ensureAnimation();
  }
  function seek(milliseconds) {
    if (!Number.isFinite(milliseconds)) throw new TypeError('Timeline position must be finite milliseconds');
    seeking = true; paused = true; cancelAnimationFrame(frameId); frameId = 0; audioEngine.stop();
    elapsed = Math.min(TOTAL_TIME, Math.max(0, milliseconds));
    sceneTime = Math.max(0, milliseconds); startedAt = 0; sceneIndex = -1;
    state = sceneTime >= TOTAL_TIME ? 'revealed' : 'revealing';
    stage.dataset.state = state;
    $('awaken-button').disabled = state === 'revealing';
    $('seed-button').hidden = true;
    $('skip-button').hidden = state === 'revealed';
    $('replay-button').hidden = state !== 'revealed';
    $('progress-fill').style.transform = `scaleX(${elapsed / TOTAL_TIME})`;
    if (state === 'revealed') { $('scene-number').textContent = '06'; $('scene-label').textContent = 'PRESENCE'; }
    syncPause(); render(sceneTime); seeking = false;
    return sceneTime;
  }
  window.aarambh = Object.freeze({ seek, play, pause, get state() { return state; }, get duration() { return TOTAL_TIME; }, get elapsed() { return sceneTime; }, get paused() { return paused; } });

  function updatePhase() {
    let next = 0;
    for (let index = 0; index < phases.length; index++) {
      if (elapsed >= phases[index].at) next = index;
    }
    if (sceneIndex === next) return;
    sceneIndex = next;
    const phase = phases[next];
    $('scene-number').textContent = phase.number;
    $('scene-label').textContent = phase.label;
    $('button-note').textContent = phase.note;
  }

  function render(now) {
    if (state !== 'idle') sceneTime = Math.max(0, now - startedAt);
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
      paintAtmosphere(state === 'idle' ? (captureMode ? 0 : now) : sceneTime);
    }
    if (state === 'revealing') {
      elapsed = Math.min(TOTAL_TIME, sceneTime);
      drawPaths(elapsed);
      if (ctx) { paintFormation(sceneTime, sceneTime); paintRipple(elapsed); paintFilaments(elapsed); }
      updatePhase();
      $('progress-fill').style.transform = `scaleX(${elapsed / TOTAL_TIME})`;
      if (elapsed >= TOTAL_TIME) finish(now);
    } else if (state === 'revealed') {
      drawPaths(TOTAL_TIME);
      if (ctx) { paintFormation(sceneTime, sceneTime); paintPetals(sceneTime); }
    }
    applyTimeline(state === 'idle' ? 0 : sceneTime);
    if (ctx && state !== 'idle') { paintVolume(sceneTime); paintHighlight(sceneTime); paintTouchWave(sceneTime); }
  }

  function frame(now) {
    if (document.hidden || paused || captureMode) { frameId = 0; return; }
    const interval = state === 'revealing' ? 16 : 33;
    if (now - lastFrame >= interval) { render(now); lastFrame = now; }
    if (!motionPreference.matches) frameId = requestAnimationFrame(frame);
    else frameId = 0;
  }

  function ensureAnimation() {
    if (!frameId && !document.hidden && !paused && !captureMode) frameId = requestAnimationFrame(frame);
  }

  function begin() {
    if (state === 'revealing') return;
    state = 'revealing';
    elapsed = 0;
    sceneTime = 0;
    tapWave = null;
    paused = false;
    document.body.classList.remove('is-paused');
    sceneIndex = -1;
    startedAt = performance.now();
    stage.dataset.state = state;
    $('awaken-button').disabled = true;
    $('awaken-button').setAttribute('aria-busy', 'true');
    $('awaken-label').textContent = 'Aloy ashchhen Bappa';
    $('seed-button').hidden = true;
    $('skip-button').hidden = false;
    $('replay-button').hidden = true;
    $('experience-announcement').textContent = 'Alor rekha diye Ganesh er rup toiri hochhe.';
    mandala.style.opacity = '0';
    for (const path of paths) {
      path.progress = -1;
      path.element.style.strokeDashoffset = path.length;
      if (path.element.classList.contains('palm-shape')) path.element.style.fillOpacity = '0';
    }
    $('progress-fill').style.transform = 'scaleX(0)';
    updatePhase();
    syncPause();
    playMusic(true);
    if (narrowScreen.matches && !document.fullscreenElement && !captureMode && !seeking) {
      stage.closest('.art-section').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'center' });
    }
    if (motionPreference.matches) {
      startedAt -= TOTAL_TIME;
      finish(performance.now());
      render(performance.now());
    } else {
      ensureAnimation();
    }
  }

  function finish(now = performance.now()) {
    const skipHadFocus = document.activeElement === $('skip-button');
    state = 'revealed';
    elapsed = TOTAL_TIME;
    stage.dataset.state = state;
    $('awaken-button').disabled = false;
    $('awaken-button').removeAttribute('aria-busy');
    $('awaken-label').textContent = 'Abar onubhob koro';
    $('button-note').textContent = 'Shubho hok protita notun shuru.';
    $('skip-button').hidden = true;
    $('replay-button').hidden = false;
    $('scene-number').textContent = '06';
    $('scene-label').textContent = 'PRESENCE';
    $('progress-fill').style.transform = 'scaleX(1)';
    mandala.style.opacity = '.3';
    $('experience-announcement').textContent = 'Ganpati Bappa Morya. Ganesh er alor rup sampurno. Abar dekhte replay button e click koro.';
    syncPause();
    if (skipHadFocus) (document.fullscreenElement ? $('replay-button') : $('awaken-button')).focus({ preventScroll: true });
  }

  $('awaken-button').addEventListener('click', begin);
  $('replay-button').addEventListener('click', () => {
    begin();
    (motionPreference.matches ? $('replay-button') : $('skip-button')).focus({ preventScroll: true });
  });
  $('seed-button').addEventListener('click', () => {
    begin();
    if (!motionPreference.matches) $('skip-button').focus({ preventScroll: true });
    else $('awaken-button').focus({ preventScroll: true });
  });
  $('skip-button').addEventListener('click', () => {
    const now = performance.now();
    startedAt = now - TOTAL_TIME;
    sceneTime = TOTAL_TIME;
    finish(now); render(now);
  });

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width / (rect.width * dpr) - offsetX) / scale,
      y: ((event.clientY - rect.top) * canvas.height / (rect.height * dpr) - offsetY) / scale,
    };
  }
  stage.addEventListener('pointermove', (event) => {
    if (motionPreference.matches || event.pointerType === 'touch' || paused || captureMode) return;
    Object.assign(attraction, pointerPoint(event), { active: true });
  });
  stage.addEventListener('pointerleave', () => {
    attraction.active = false;
  });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || state === 'idle' || paused || captureMode || motionPreference.matches) return;
    tapWave = { ...pointerPoint(event), at: sceneTime };
  }, { passive: true });

  $('sound-button').addEventListener('click', async () => {
    if (soundChanging) return;
    soundChanging = true;
    try {
      if (!soundEnabled) {
        soundEnabled = true;
        if (state !== 'idle') await audioEngine.start();
      } else {
        soundEnabled = false;
        audioEngine.stop();
      }
      updateSound();
    } catch {
      soundEnabled = false; updateSound();
      $('experience-announcement').textContent = 'Ei browser e sound chalu kora jachhe na. Alor experience cholbe.';
      $('sound-label').textContent = 'Music unavailable';
    } finally { soundChanging = false; }
  });

  const fullscreen = $('fullscreen-button');
  const soundHome = $('sound-button').parentElement;
  if (!document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.closest('.art-section').requestFullscreen();
    } catch { $('experience-announcement').textContent = 'Ei browser e fullscreen available nei.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label;
    if (document.fullscreenElement) document.querySelector('.scene-controls').prepend($('sound-button'));
    else soundHome.append($('sound-button'));
  });

  const intention = $('intention-dialog');
  $('intention-button').addEventListener('click', () => intention.showModal());
  $('dialog-close').addEventListener('click', () => intention.close());
  intention.addEventListener('click', (event) => {
    if (event.target !== intention) return;
    const rect = intention.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) intention.close();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      cancelAnimationFrame(frameId);
      frameId = 0;
      audioEngine.stop();
      document.body.classList.add('is-backgrounded');
    } else {
      const hiddenDuration = performance.now() - hiddenAt;
      startedAt += hiddenDuration;
      document.body.classList.remove('is-backgrounded');
      if (soundEnabled && state !== 'idle' && !paused) playMusic();
      ensureAnimation();
    }
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches && state === 'revealing') {
      startedAt = performance.now() - TOTAL_TIME; sceneTime = TOTAL_TIME; finish();
    }
    render(paused || captureMode ? startedAt + sceneTime : performance.now());
    ensureAnimation();
  });
  new ResizeObserver(resize).observe(stage);
  $('pause-button')?.addEventListener('click', () => paused ? play() : pause());
  updateSound();
  syncPause();
  resize();
  render(performance.now());
  ensureAnimation();
})();
