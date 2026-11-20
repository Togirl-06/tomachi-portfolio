(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- name letter flip ---------- */
  document.querySelectorAll('.name-line').forEach(function (line) {
    var word = line.getAttribute('data-word') || '';
    line.textContent = '';
    word.split('').forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      span.style.animationDelay = (0.05 + i * 0.05) + 's';
      line.appendChild(span);
    });
  });

  /* ---------- role typewriter ---------- */
  var roles = ['Software Engineer', 'Full-Stack Developer', 'AI Engineer', 'Flutter Builder'];
  var roleEl = document.getElementById('typeRole');
  var roleIdx = 0;
  var charIdx = 0;
  var deleting = false;

  function typeRole() {
    if (!roleEl || reduced) {
      if (roleEl) roleEl.textContent = roles[0];
      return;
    }
    var current = roles[roleIdx];
    if (!deleting) {
      charIdx++;
      roleEl.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(typeRole, 1400);
        return;
      }
      setTimeout(typeRole, 55);
    } else {
      charIdx--;
      roleEl.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        setTimeout(typeRole, 300);
        return;
      }
      setTimeout(typeRole, 32);
    }
  }
  setTimeout(typeRole, 600);

  /* ---------- constellation canvas ---------- */
  var canvas = document.getElementById('stars');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var particles = [];
  var mouse = { x: -9999, y: -9999 };

  function resizeStars() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var count = Math.min(95, Math.floor((canvas.width * canvas.height) / 18000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.4
      });
    }
  }

  function drawStars() {
    if (!ctx || !canvas || reduced) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i, j, p, q, dx, dy, dist;

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      dx = p.x - mouse.x;
      dy = p.y - mouse.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        p.vx += (dx / dist) * 0.04;
        p.vy += (dy / dist) * 0.04;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(238,240,245,0.55)';
      ctx.fill();
    }

    for (i = 0; i < particles.length; i++) {
      for (j = i + 1; j < particles.length; j++) {
        dx = particles[i].x - particles[j].x;
        dy = particles[i].y - particles[j].y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(76,201,240,' + (0.18 * (1 - dist / 110)) + ')';
          ctx.stroke();
        }
      }
      dx = particles[i].x - mouse.x;
      dy = particles[i].y - mouse.y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = 'rgba(240,164,75,' + (0.28 * (1 - dist / 140)) + ')';
        ctx.stroke();
      }
    }
    requestAnimationFrame(drawStars);
  }

  if (canvas && ctx) {
    resizeStars();
    window.addEventListener('resize', resizeStars);
    if (!reduced) drawStars();
  }

  /* ---------- spotlight + magnetic + tilt ---------- */
  var spotlight = document.getElementById('spotlight');
  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (spotlight) {
      spotlight.style.setProperty('--x', e.clientX + 'px');
      spotlight.style.setProperty('--y', e.clientY + 'px');
    }
  });

  document.querySelectorAll('.tilt').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      if (reduced) return;
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rx = (0.5 - y) * 10;
      var ry = (x - 0.5) * 12;
      card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.mag').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      if (reduced) return;
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.18) + 'px)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
    });
  });

  /* ---------- scroll reveal + stats ---------- */
  function animateCount(el, target) {
    var start = 0;
    var dur = 1100;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('on');
      if (entry.target.classList.contains('stat') && !entry.target.dataset.done) {
        entry.target.dataset.done = '1';
        var num = entry.target.querySelector('.stat-num');
        var target = parseInt(entry.target.getAttribute('data-count'), 10) || 0;
        if (num) {
          if (reduced) num.textContent = String(target);
          else animateCount(num, target);
        }
      }
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* ---------- scroll progress + timeline ---------- */
  var progress = document.getElementById('scrollProgress');
  var journey = document.getElementById('journey');
  var journeyFill = document.getElementById('journeyFill');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';

    if (journey && journeyFill) {
      var rect = journey.getBoundingClientRect();
      var view = window.innerHeight;
      var total = rect.height + view * 0.4;
      var seen = Math.min(total, Math.max(0, view * 0.6 - rect.top));
      journeyFill.style.height = Math.min(100, (seen / total) * 100) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- terminal ---------- */
  var termOut = document.getElementById('termOut');
  var termInput = document.getElementById('termInput');
  var commands = {
    help: 'Commands: help, about, gradeglow, skills, projects, education, contact, hire, clear',
    about: 'Founder of GradeGlow — a virtual university for everyone. CS student @ Georgia State (May 2027). Builds full-stack + AI products.',
    gradeglow: 'I founded GradeGlow: a virtual university + AI study assistant. Mission: world-class education regardless of income.\nhttps://gradeglow-virtualuni.web.app/',
    skills: 'Python · JavaScript · Java · Flutter/Dart · SQL · Firebase · Git · HTML/CSS · C',
    projects: 'GradeGlow (founder) — https://gradeglow-virtualuni.web.app/\nSurefit Gym — https://surefitgymandfitnesscenter.com/',
    education: "Bachelor's CS (May 2027) · Associate CS (Dec 2025) · GPA 3.50 · Dean's & President's List",
    contact: 'Email: tomachiegere@gmail.com\nGitHub: github.com/Togirl-06\nLinkedIn: linkedin.com/in/tomachi-egere-4772a4316',
    hire: "I'm open to work — internships, freelance, and full-stack / AI roles. Let's build something.",
    clear: ''
  };

  function printLine(text) {
    if (!termOut) return;
    if (text === '') {
      termOut.textContent = '';
      return;
    }
    var prefix = termOut.textContent ? '\n' : '';
    termOut.textContent = termOut.textContent + prefix + text;
    termOut.scrollTop = termOut.scrollHeight;
  }

  function runCommand(raw) {
    var cmd = (raw || '').trim().toLowerCase();
    if (!cmd) return;
    printLine('> ' + cmd);
    if (Object.prototype.hasOwnProperty.call(commands, cmd)) {
      if (cmd === 'clear') printLine('');
      else printLine(commands[cmd]);
    } else {
      printLine("Unknown command. Type 'help'.");
    }
  }

  if (termInput) {
    termInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        runCommand(termInput.value);
        termInput.value = '';
      }
    });
  }
  document.querySelectorAll('.term-chips button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      runCommand(btn.getAttribute('data-cmd'));
    });
  });
  printLine("Welcome. Type 'help' or tap a chip.");

  /* ---------- avatar video + audio ---------- */
  var avatarScene = document.getElementById('avatarScene');
  var speechEl = document.getElementById('botSpeech');
  var replayBtn = document.getElementById('avatarReplay');
  var video = document.getElementById('avatarVideo');
  var INTRO =
    "Hey! I'm Tomachi. I build full-stack apps, ship real products like GradeGlow, and practice algorithms every single day. Scroll down to explore my work!";
  var typeTimer = null;

  function typeCaption(text) {
    if (!speechEl) return;
    var i = 0;
    speechEl.textContent = '';
    if (typeTimer) clearTimeout(typeTimer);
    if (reduced) {
      speechEl.textContent = text;
      return;
    }
    (function step() {
      if (i <= text.length) {
        speechEl.textContent = text.slice(0, i);
        i++;
        typeTimer = setTimeout(step, 28);
      }
    })();
  }

  function playWithSound() {
    if (!video) return;
    if (avatarScene) avatarScene.classList.add('talking');
    typeCaption(INTRO);

    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.loop = false;
    try { video.currentTime = 0; } catch (e) {}

    var p = video.play();
    if (p && p.then) {
      p.then(function () {
        if (replayBtn) replayBtn.textContent = '⏸ playing…';
      }).catch(function () {
        // Browser blocked audio — ask again via button (already a user gesture retry)
        video.muted = false;
        video.play().catch(function () {});
      });
    }

    video.onended = function () {
      if (avatarScene) avatarScene.classList.remove('talking');
      if (replayBtn) replayBtn.textContent = '▶ hear intro';
      // freeze on last frame (keep audio off until replay)
      video.pause();
    };
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function (e) {
      e.preventDefault();
      playWithSound();
    });
  }
  if (video) {
    video.style.cursor = 'pointer';
    video.addEventListener('click', playWithSound);
    // Show first frame (muted) so the video is visible before click
    video.muted = true;
    video.play().then(function () {
      video.pause();
      try { video.currentTime = 0.1; } catch (e) {}
    }).catch(function () {});
  }
  if (speechEl) {
    speechEl.textContent = 'Tap the video or “hear intro” for sound →';
  }
})();
