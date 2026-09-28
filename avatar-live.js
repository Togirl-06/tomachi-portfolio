/**
 * Live virtual avatar — animates your real photo on canvas.
 * Optional: add videos/tomachi-idle.mp4 + videos/tomachi-talk.mp4
 * (from HeyGen, D-ID, etc.) for full lip-sync and hand gestures.
 */
const AvatarLive = (() => {
  const IMG_SRC = 'images/tomachi.png';
  const VIDEO_PATHS = {
    talk: ['videos/tomachi-talk.mp4', 'videos/tomachi.mp4', 'videos/tomachi-talk.webm'],
    idle: ['videos/tomachi-idle.mp4', 'videos/tomachi-idle.webm'],
  };

  let canvas, ctx, video, stage;
  let img = null;
  let useVideo = false;
  let talkSrc = null;
  let idleSrc = null;
  let raf = null;
  let talking = false;
  let reducedMotion = false;

  const state = {
    jaw: 0,
    targetJaw: 0,
    blink: 0,
    eyeX: 0,
    targetEyeX: 0,
    headRot: 0,
    targetHeadRot: 0,
    headY: 0,
    nod: 0,
    smile: 0,
    breath: 0,
    t: 0,
  };

  let blinkTimer = null;
  let eyeTimer = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function coverRect(iw, ih, cw, ch, posY = 0.15) {
    const scale = Math.max(cw / iw, ch / ih);
    const sw = cw / scale;
    const sh = ch / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) * posY;
    return { sx, sy, sw, sh, dw: cw, dh: ch };
  }

  function drawFrame() {
    if (!ctx || !img) return;
    const w = canvas.width;
    const h = canvas.height;
    const { sx, sy, sw, sh } = coverRect(img.width, img.height, w, h, 0.15);

    state.t += 1;
    state.breath = Math.sin(state.t * 0.018) * 0.004;
    state.jaw = lerp(state.jaw, state.targetJaw, 0.35);
    state.eyeX = lerp(state.eyeX, state.targetEyeX, 0.06);
    state.headRot = lerp(state.headRot, state.targetHeadRot, 0.05);
    state.nod = lerp(state.nod, 0, 0.08);
    state.smile = lerp(state.smile, talking ? 0.12 : 0.04, 0.04);
    state.blink = lerp(state.blink, 0, 0.25);

    const breathScale = 1 + state.breath + (talking ? 0.003 : 0);
    const rot = state.headRot + state.nod + Math.sin(state.t * 0.007) * 0.006;
    const ty = state.headY + state.nod * 6;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h * 0.44 + ty);
    ctx.rotate(rot);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-w / 2, -h * 0.44);

    // Soft edge mask
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.4, w * 0.42, h * 0.44, 0, 0, Math.PI * 2);
    ctx.clip();

    // Base portrait
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    // Mouth / jaw — stretch lower lip region from real pixels
    if (state.jaw > 0.04) {
      const mouthY = h * 0.515;
      const mouthH = h * 0.09;
      const srcMY = sy + (mouthY / h) * sh;
      const srcMH = (mouthH / h) * sh;
      const stretch = 1 + state.jaw * 0.14;
      const smileW = 1 + state.smile;

      ctx.drawImage(
        img,
        sx + (sw * (1 - smileW) / 2), srcMY,
        sw * smileW, srcMH,
        w * (1 - smileW) / 2, mouthY,
        w * smileW, mouthH * stretch
      );
    }

    // Eye blink — squash real eye pixels
    if (state.blink > 0.05) {
      const blinkH = 1 - state.blink * 0.92;
      [[0.32, 0.36], [0.58, 0.36]].forEach(([ex, ey]) => {
        const rx = w * ex;
        const ry = h * ey;
        const rw = w * 0.14;
        const rh = h * 0.055;
        const srcX = sx + (rx / w) * sw;
        const srcY = sy + (ry / h) * sh;
        const srcW = (rw / w) * sw;
        const srcH = (rh / h) * sh;
        ctx.drawImage(
          img, srcX, srcY, srcW, srcH,
          rx, ry + (rh * (1 - blinkH)) / 2,
          rw, rh * blinkH
        );
      });
    }

    // Subtle eye drift
    if (Math.abs(state.eyeX) > 0.5) {
      const ex = state.eyeX;
      const ry = h * 0.355;
      const rh = h * 0.06;
      const rw = w * 0.32;
      const rx = w * 0.34 + ex;
      const srcX = sx + (rx / w) * sw;
      const srcY = sy + (ry / h) * sh;
      ctx.drawImage(
        img, srcX, srcY, (rw / w) * sw, (rh / h) * sh,
        rx, ry, rw, rh
      );
    }

    ctx.restore();
    ctx.restore();

    // Warm live glow while speaking
    if (talking) {
      const g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.5);
      g.addColorStop(0, `rgba(242,184,75,${0.04 + state.jaw * 0.03})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function loop() {
    if (useVideo) return;
    drawFrame();
    raf = requestAnimationFrame(loop);
  }

  function blink() {
    if (reducedMotion) return;
    state.blink = 1;
  }

  function scheduleBlink() {
    if (blinkTimer) clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      blink();
      scheduleBlink();
    }, 2800 + Math.random() * 2200);
  }

  function scheduleEyeMove() {
    if (eyeTimer) clearTimeout(eyeTimer);
    eyeTimer = setTimeout(() => {
      state.targetEyeX = (Math.random() - 0.5) * 4;
      scheduleEyeMove();
    }, 2000 + Math.random() * 3000);
  }

  function setJaw(v) {
    state.targetJaw = Math.max(0, Math.min(1, v));
  }

  function gesture(type) {
    switch (type) {
      case 'nod':
        state.nod = 0.018;
        state.headY = -2;
        setTimeout(() => { state.headY = 0; }, 400);
        break;
      case 'tilt':
        state.targetHeadRot = 0.025;
        setTimeout(() => { state.targetHeadRot = 0; }, 600);
        break;
      case 'smile':
        state.smile = 0.2;
        break;
      case 'emphasis':
        state.targetHeadRot = -0.015;
        setJaw(0.7);
        setTimeout(() => { state.targetHeadRot = 0; }, 500);
        break;
      default:
        break;
    }
  }

  function onWord(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (['gradeglow', 'projects', 'apps', 'tomachi'].includes(w)) gesture('nod');
    if (['build', 'ship', 'practice'].includes(w)) gesture('emphasis');
    if (['hey', 'hi', 'hello'].includes(w)) gesture('smile');
    setJaw(0.35 + Math.random() * 0.55);
  }

  function canPlay(src) {
    return new Promise((resolve) => {
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadeddata = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = src;
      setTimeout(() => resolve(false), 3000);
    });
  }

  async function findVideos() {
    for (const src of VIDEO_PATHS.talk) {
      if (await canPlay(src)) { talkSrc = src; break; }
    }
    for (const src of VIDEO_PATHS.idle) {
      if (await canPlay(src)) { idleSrc = src; break; }
    }
    return Boolean(talkSrc || idleSrc);
  }

  function showVideo(mode) {
    if (!video) return;
    useVideo = true;
    canvas.classList.add('is-hidden');
    video.classList.remove('is-hidden');

    if (mode === 'talk' && talkSrc) {
      video.src = talkSrc;
      video.loop = false;
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(() => {});
    } else if (idleSrc) {
      video.src = idleSrc;
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      // single talk video — show poster when idle
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  function showCanvas() {
    useVideo = false;
    if (video) video.classList.add('is-hidden');
    canvas.classList.remove('is-hidden');
    if (!raf) loop();
  }

  async function init() {
    canvas = document.getElementById('avatarCanvas');
    stage = document.getElementById('avatarStage');
    if (!canvas) return;

    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctx = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    img = new Image();
    img.src = IMG_SRC;
    await img.decode();

    video = document.getElementById('avatarVideo');
    const hasVideo = await findVideos();
    if (hasVideo && video) {
      useVideo = true;
      canvas.classList.add('is-hidden');
      video.classList.remove('is-hidden');
      video.poster = IMG_SRC;
      if (idleSrc) {
        showVideo('idle');
      } else {
        video.pause();
      }
    } else {
      showCanvas();
      if (!reducedMotion) {
        scheduleBlink();
        scheduleEyeMove();
      }
    }
  }

  function hasVideo() {
    return useVideo && Boolean(talkSrc || idleSrc);
  }

  function playTalkVideo() {
    return new Promise((resolve) => {
      if (!video || !talkSrc) { resolve(false); return; }
      showVideo('talk');
      video.onended = () => {
        if (idleSrc) showVideo('idle');
        else { video.pause(); video.poster = IMG_SRC; }
        resolve(true);
      };
      video.onerror = () => resolve(false);
    });
  }

  function startTalking() {
    talking = true;
    if (useVideo && talkSrc) showVideo('talk');
  }

  function stopTalking() {
    talking = false;
    setJaw(0);
    state.targetHeadRot = 0;
    if (useVideo) {
      if (idleSrc) showVideo('idle');
      else if (video) { video.pause(); video.currentTime = 0; }
    }
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    if (blinkTimer) clearTimeout(blinkTimer);
    if (eyeTimer) clearTimeout(eyeTimer);
  }

  return { init, startTalking, stopTalking, setJaw, onWord, gesture, destroy, hasVideo, playTalkVideo };
})();
