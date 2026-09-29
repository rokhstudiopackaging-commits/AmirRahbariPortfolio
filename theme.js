/* ============================================================
   AMIR RAHBARI — Portfolio
   Main JavaScript
   بدون کتابخانه خارجی — احترام کامل به prefers-reduced-motion
   نسخه: 2026
   ============================================================ */

(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ==========================================================
     ۱) سیستم تغییر تم (paper ↔ ink)
     accent همیشه ثابت می‌ماند
     ========================================================== */
  const themeBtn = document.getElementById('theme-toggle');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (themeBtn) {
      themeBtn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'
      );
    }
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
  };

  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    themeBtn.classList.add('spin');
    setTimeout(() => themeBtn.classList.remove('spin'), 500);

    if (document.startViewTransition && !reduceMotion) {
      const r = themeBtn.getBoundingClientRect();
      root.style.setProperty('--tx', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--ty', (r.top + r.height / 2) + 'px');
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  });

  // همگام‌سازی با تم سیستم — فقط اگر کاربر انتخاب دستی نکرده باشد
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme')) return;
    applyTheme(e.matches ? 'dark' : 'light');
  });


  /* ==========================================================
     ۲) هدر چسبنده
     ========================================================== */
  const nav = document.getElementById('nav');
  const onScrollNav = () => nav?.classList.toggle('solid', scrollY > 24);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();


  /* ==========================================================
     ۳) نوار پیشرفت اسکرول
     ========================================================== */
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();


  /* ==========================================================
     ۴) نوارهای چسبنده کناری
     ========================================================== */
  const railL = document.createElement('aside');
  railL.className = 'rail rail--l';
  railL.setAttribute('aria-hidden', 'true');
  railL.innerHTML = `
    <span class="rail__line"></span>
    <span class="rail__text">Amir&nbsp;Rahbari</span>
    <span class="rail__dot"></span>`;

  const railR = document.createElement('aside');
  railR.className = 'rail rail--r';
  railR.setAttribute('aria-hidden', 'true');
  railR.innerHTML = `
    <span class="rail__line"></span>
    <span class="rail__text">Design&nbsp;&mdash;&nbsp;2026</span>
    <span class="rail__dot"></span>`;

  document.body.append(railL, railR);

  const showRails = () => {
    const v = scrollY > 80;
    railL.classList.toggle('show', v);
    railR.classList.toggle('show', v);
  };
  addEventListener('scroll', showRails, { passive: true });
  showRails();


  /* ==========================================================
     ۵) لینک فعال بر اساس بخش دیده‌شده
     ========================================================== */
  const navLinks = [...document.querySelectorAll('.nav a.l[href^="#"]')];
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a =>
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
        );
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(s => activeObserver.observe(s));
  }
  // هایلایت لینک فعال در منوی موبایل
const mobileLinks = [...document.querySelectorAll('#mobile-menu a[href^="#"]')];

const mobileActiveObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    mobileLinks.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
    );
  });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

sections.forEach(s => mobileActiveObserver.observe(s));


  /* ==========================================================
     ۶) ظاهر شدن نرم هنگام اسکرول
        + تأخیر پله‌ای خودکار بین خواهر/برادرها
     ========================================================== */
  const revealGroups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.style.getPropertyValue('--d')) return;
    const parent = el.parentElement;
    const idx = revealGroups.get(parent) ?? 0;
    if (idx) el.style.setProperty('--d', (idx * 0.08) + 's');
    revealGroups.set(parent, idx + 1);
  });

  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));


  /* ==========================================================
     ۷) پارالاکس ملایم روی تصاویر نمونه‌کار
     ========================================================== */
  if (!reduceMotion) {
    const parallaxTiles = [...document.querySelectorAll('figure .tile img')];
    let tileRaf = null;

    const applyParallax = () => {
      tileRaf = null;
      const vh = innerHeight;
      for (const img of parallaxTiles) {
        // هنگام هاور، پارالاکس را متوقف کن تا با scale تضاد نکند
        if (img.parentElement.matches(':hover')) continue;

        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;

        const center = (r.top + r.height / 2 - vh / 2) / vh;
        const shift = -center * 22;
        img.style.transform =
          `translate3d(0,${shift.toFixed(2)}px,0) scale(1.08)`;
      }
    };

    const requestTile = () => {
      if (tileRaf) return;
      tileRaf = requestAnimationFrame(applyParallax);
    };

    addEventListener('scroll', requestTile, { passive: true });
    addEventListener('resize', requestTile);
    requestTile();
  }


  /* ==========================================================
     ۸) نورافکن (Lightbox)
     ========================================================== */
  const lb = document.getElementById('lb');
  if (lb) {
    const lbi = lb.querySelector('img');
    let lastFocus = null;

    const openLb = (src, alt) => {
      lastFocus = document.activeElement;
      lbi.src = src;
      lbi.alt = alt || '';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    };
    const closeLb = () => {
      lb.classList.remove('on');
      document.body.style.overflow = '';
      lastFocus?.focus?.();
    };

    document.querySelectorAll('.tile img').forEach(img => {
      const tile = img.parentElement;
      if (tile.classList.contains('!cursor-default')) return;

      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.addEventListener('click', () => openLb(img.src, img.alt));
      tile.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLb(img.src, img.alt);
        }
      });
    });

    lb.addEventListener('click', closeLb);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && lb.classList.contains('on')) closeLb();
    });
  }


  /* ==========================================================
     ۹) بوم ذرات پس‌زمینه
        رنگ ذرات از --halo گرفته می‌شود تا با تم هماهنگ شود
     ========================================================== */
  if (!reduceMotion && innerWidth > 720) {
    const canvas = document.createElement('canvas');
    canvas.className = 'particles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;

    const COUNT = Math.min(46, Math.round((W * H) / 42000));
    const dots = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.2 + 0.5,
    }));

    let dotColor = 'rgba(20,20,19,.28)';
    let lineBase = '218,100,75';

    const readThemeColors = () => {
      const s = getComputedStyle(root);
      dotColor = s.getPropertyValue('--halo').trim() || dotColor;
    };
    readThemeColors();

    // اگر تم عوض شد، رنگ ذرات را دوباره بخوان
    document.addEventListener('theme:change', readThemeColors);

    const resizeCanvas = () => {
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
    };
    addEventListener('resize', resizeCanvas);

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      // خطوط بین نقاط نزدیک
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > 130 * 130) continue;

          const alpha = 1 - Math.sqrt(dist2) / 130;
          ctx.strokeStyle = `rgba(${lineBase},${(alpha * 0.14).toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      requestAnimationFrame(tick);
    };
    tick();
  }


  /* ==========================================================
     ۱۰) پارالاکس ملایم امضای فوتر
     ========================================================== */
  if (!reduceMotion) {
    const signature = document.querySelector('.footer-signature span');
    if (signature) {
      let sigRaf = null;
      const moveSignature = () => {
        sigRaf = null;
        const r = signature.getBoundingClientRect();
        const vh = innerHeight;
        if (r.bottom < -100 || r.top > vh + 100) return;

        const progress = 1 - Math.min(1, Math.max(0, r.top / vh));
        const shift = (progress - 0.5) * 24;
        signature.style.transform = `translate3d(0,${shift.toFixed(2)}px,0)`;
      };
      const requestSig = () => {
        if (sigRaf) return;
        sigRaf = requestAnimationFrame(moveSignature);
      };
      addEventListener('scroll', requestSig, { passive: true });
      addEventListener('resize', requestSig);
      requestSig();
    }
  }


  /* ==========================================================
     ۱۱) کلیدهای میان‌بر پیمایش بین بخش‌ها (J / K)
        فقط وقتی فوکوس روی input نیست
     ========================================================== */
  const sectionIds = sections.map(s => s.id);
  if (sectionIds.length) {
    addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const idx = sectionIds.findIndex(id => '#' + id === location.hash);

      if (e.key === 'j' || e.key === 'J') {
        const next = sections[Math.min(sections.length - 1, (idx < 0 ? -1 : idx) + 1)];
        next?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (e.key === 'k' || e.key === 'K') {
        const prev = sections[Math.max(0, (idx < 0 ? 1 : idx) - 1)];
        prev?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }


  /* ==========================================================
     ۱۲) نمایش وضعیت لود تصاویر — اختیاری
        اگر خواستی می‌توانی حذف کنی
     ========================================================== */
  document.querySelectorAll('.tile img').forEach(img => {
    if (img.complete) return;
    img.style.opacity = '0';
    img.style.transition = 'opacity .6s cubic-bezier(.19,1,.22,1)';
    img.addEventListener('load', () => { img.style.opacity = '1'; }, { once: true });
    img.addEventListener('error', () => { img.style.opacity = '.4'; }, { once: true });
  });


  /* ==========================================================
     ۱۳) اعلان به بقیه اسکریپت‌ها که همه‌چیز آماده است
     ========================================================== */
  document.dispatchEvent(new CustomEvent('site:ready'));

})();
/* ==========================================================
   ۱۵) هدر موبایل — منوی تمام‌صفحه
     ========================================================== */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');

if (burger && mobileMenu) {
  const menuLinks = mobileMenu.querySelectorAll('a[href^="#"]');
  let lastFocus = null;
  let isOpen = false;

  const openMenu = () => {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;

    mobileMenu.removeAttribute('inert');
    mobileMenu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'بستن منو');
    document.body.classList.add('menu-open');

    // فوکوس روی اولین لینک (پس از انیمیشن باز شدن)
    setTimeout(() => {
      menuLinks[0]?.focus({ preventScroll: true });
    }, 300);
  };

  const closeMenu = (returnFocus = true) => {
    if (!isOpen) return;
    isOpen = false;

    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'باز کردن منو');
    document.body.classList.remove('menu-open');

    // inert بعد از پایان انیمیشن اعمال شود
    setTimeout(() => {
      if (!isOpen) mobileMenu.setAttribute('inert', '');
    }, 500);

    if (returnFocus) lastFocus?.focus?.();
  };

  burger.addEventListener('click', () => {
    isOpen ? closeMenu() : openMenu();
  });

  // بستن هنگام کلیک روی لینک (بعد از پیمایش نرم)
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu(false);
    });
  });

  // بستن با Escape
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  // بستن هنگام تغییر اندازه به دسکتاپ
  const mq = matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (e) => {
    if (e.matches && isOpen) closeMenu(false);
  });

  // تله‌ی فوکوس داخل منو (fallback برای مرورگرهایی که inert را پشتیبانی نمی‌کنند)
  const trapFocus = (e) => {
    if (!isOpen || e.key !== 'Tab') return;
    const focusables = [
      ...mobileMenu.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      ),
    ].filter(el => !el.hasAttribute('disabled'));

    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  addEventListener('keydown', trapFocus);
}