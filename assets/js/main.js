/* =========================================================
   KRWA Team — main.js
   Header state / mobile nav / scroll reveal / counters /
   active nav / accordion / to-top
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. Theme (dark / light) ----------
     초기 테마는 <head> 인라인 스크립트가 이미 적용한 상태입니다.
     여기서는 토글, 저장, 시스템 설정 변경 추적만 담당합니다. */
  var THEME_KEY = 'krwa-theme';
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var themeColorMeta = document.getElementById('themeColor');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  var THEME_COLOR = { dark: '#000000', light: '#ffffff' };

  function readStored() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return (v === 'light' || v === 'dark') ? v : null;
    } catch (e) { return null; }
  }

  function storeTheme(value) {
    try {
      if (value) localStorage.setItem(THEME_KEY, value);
      else localStorage.removeItem(THEME_KEY);
    } catch (e) { /* 프라이빗 모드 등 — 저장 실패는 무시 */ }
  }

  function syncToggleLabel(theme) {
    if (!themeToggle) return;
    var next = theme === 'dark' ? '라이트' : '다크';
    themeToggle.setAttribute('aria-label', next + ' 모드로 전환');
    themeToggle.setAttribute('title', next + ' 모드로 전환');
  }

  function applyTheme(theme, animate) {
    if (animate && !reduceMotion) {
      root.classList.add('theme-switching');
      window.setTimeout(function () {
        root.classList.remove('theme-switching');
      }, 300);
    }
    root.setAttribute('data-theme', theme);
    if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLOR[theme]);
    syncToggleLabel(theme);
  }

  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      storeTheme(next);
    });
  }

  // 사용자가 직접 선택하지 않았다면 OS 설정 변경을 실시간으로 따라갑니다.
  function onSystemThemeChange(e) {
    if (readStored()) return;
    applyTheme(e.matches ? 'dark' : 'light', true);
  }
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemThemeChange);
  else if (darkQuery.addListener) darkQuery.addListener(onSystemThemeChange);

  // 다른 탭에서 테마를 바꾸면 이 탭에도 반영합니다.
  window.addEventListener('storage', function (e) {
    if (e.key !== THEME_KEY) return;
    var v = e.newValue;
    applyTheme(v === 'dark' ? 'dark' : (v === 'light' ? 'light' : (darkQuery.matches ? 'dark' : 'light')), true);
  });

  /* ---------- 1. Header scroll state ---------- */
  var header = document.getElementById('siteHeader');
  var toTop = document.getElementById('toTop');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.hidden = y < 600;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Mobile navigation ---------- */
  var navToggle = document.getElementById('navToggle');
  var navMobile = document.getElementById('navMobile');

  function closeNav() {
    if (!navToggle || !navMobile) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '메뉴 열기');
    navMobile.hidden = true;
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
      navMobile.hidden = open;
    });

    navMobile.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) closeNav();
    });
  }

  /* ---------- 3. Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(revealEls, function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 4. Number count-up ---------- */
  var counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduceMotion) { el.textContent = String(target); return; }

    var duration = 900;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, runCounter);
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 });

      Array.prototype.forEach.call(counters, function (el) {
        countObserver.observe(el);
      });
    }
  }

  /* ---------- 5. Active nav link on scroll ---------- */
  var navLinks = document.querySelectorAll('.nav-desktop a[href^="#"]');
  var sectionMap = [];

  Array.prototype.forEach.call(navLinks, function (link) {
    var section = document.querySelector(link.getAttribute('href'));
    if (section) sectionMap.push({ link: link, section: section });
  });

  if (sectionMap.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sectionMap.filter(function (m) { return m.section === entry.target; })[0];
        if (!match) return;
        if (entry.isIntersecting) {
          Array.prototype.forEach.call(navLinks, function (l) { l.classList.remove('is-active'); });
          match.link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sectionMap.forEach(function (m) { navObserver.observe(m.section); });
  }

  /* ---------- 6. FAQ — one open at a time ---------- */
  var faqItems = document.querySelectorAll('#faqList .faq-item');
  Array.prototype.forEach.call(faqItems, function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      Array.prototype.forEach.call(faqItems, function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- 6. 영상 (YouTube) ----------
     영상 ID는 index.html의 <section id="hero" data-youtube-id="..."> 에서 읽습니다.
     - 히어로 배경: 무음 자동재생 + 반복 (소리 있는 자동재생은 모든 브라우저가 차단)
     - 모달: 사용자가 버튼을 누른 뒤이므로 소리와 함께 재생됩니다.
     두 경우 모두 필요한 시점에만 iframe을 만들어 플레이어를 늦게 불러옵니다. */
  var hero = document.getElementById('hero');
  var heroMount = document.getElementById('heroVideoMount');
  var youtubeId = hero ? (hero.getAttribute('data-youtube-id') || '').trim() : '';

  // 전체 URL을 붙여넣은 경우에도 동작하도록 ID만 추출합니다.
  if (/^https?:\/\//i.test(youtubeId) || youtubeId.indexOf('/') !== -1) {
    var idMatch = youtubeId.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{6,})/);
    youtubeId = idMatch ? idMatch[1] : '';
  }
  var hasVideo = /^[A-Za-z0-9_-]{6,}$/.test(youtubeId);

  var YT_HOST = 'https://www.youtube-nocookie.com/embed/';

  function buildEmbedUrl(opts) {
    var p = [
      'playsinline=1',
      'rel=0',
      'modestbranding=1',
      'enablejsapi=1',
      'autoplay=' + (opts.autoplay ? '1' : '0'),
      'mute=' + (opts.mute ? '1' : '0'),
      'controls=' + (opts.controls ? '1' : '0')
    ];
    // YouTube에서 반복 재생하려면 playlist에 같은 ID를 넘겨야 합니다.
    if (opts.loop) { p.push('loop=1', 'playlist=' + youtubeId); }
    if (!opts.controls) { p.push('disablekb=1', 'fs=0', 'iv_load_policy=3'); }
    return YT_HOST + encodeURIComponent(youtubeId) + '?' + p.join('&');
  }

  function makeIframe(src, title) {
    var f = document.createElement('iframe');
    f.src = src;
    f.title = title;
    f.setAttribute('frameborder', '0');
    f.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    return f;
  }

  // YouTube IFrame API를 따로 불러오지 않고 postMessage로 재생/정지만 제어합니다.
  function ytCommand(frame, func) {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: func, args: [] }), '*'
      );
    } catch (e) { /* 무시 */ }
  }

  /* ---------- 6-1. 히어로 배경 영상 ---------- */
  var bgFrame = null;

  function heroVideoAllowed() {
    if (!hasVideo || !hero || !heroMount) return false;
    if (reduceMotion) return false;              // 모션 최소화 설정
    if (window.innerWidth < 768) return false;   // 모바일 데이터 보호
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.saveData) return false;
      if (/(^|-)(2g|slow-2g)$/.test(conn.effectiveType || '')) return false;
    }
    return true;
  }

  if (heroVideoAllowed()) {
    bgFrame = makeIframe(
      buildEmbedUrl({ autoplay: true, mute: true, loop: true, controls: false }),
      'KRWA Team 소개 영상 (배경 재생)'
    );
    bgFrame.setAttribute('tabindex', '-1');
    bgFrame.setAttribute('aria-hidden', 'true');
    heroMount.appendChild(bgFrame);
    // 플레이어가 첫 프레임을 그릴 시간을 준 뒤 스크림을 전환합니다.
    window.setTimeout(function () { hero.classList.add('has-video'); }, 700);
  }

  // 히어로가 화면 밖으로 나가면 정지 — CPU·배터리·대역폭 절약
  if (bgFrame && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        ytCommand(bgFrame, entry.isIntersecting ? 'playVideo' : 'pauseVideo');
      });
    }, { threshold: 0.15 });
    heroObserver.observe(hero);
  }

  // 탭이 백그라운드로 가면 정지
  document.addEventListener('visibilitychange', function () {
    if (!bgFrame) return;
    ytCommand(bgFrame, document.hidden ? 'pauseVideo' : 'playVideo');
  });

  /* ---------- 6-2. 모달 (소리 포함 전체 영상) ---------- */
  var videoModal = document.getElementById('videoModal');
  var modalMount = document.getElementById('modalVideoMount');
  var playVideoBtn = document.getElementById('playVideo');
  var modalCloseBtn = videoModal ? videoModal.querySelector('.video-modal-close') : null;
  var lastFocused = null;

  // 영상 ID가 아직 비어 있으면 재생 버튼을 숨깁니다.
  if (!hasVideo && playVideoBtn) playVideoBtn.hidden = true;

  function openVideoModal() {
    if (!hasVideo || !videoModal || !modalMount) return;

    lastFocused = document.activeElement;
    videoModal.hidden = false;
    document.body.classList.add('modal-open');

    modalMount.innerHTML = '';
    modalMount.appendChild(makeIframe(
      buildEmbedUrl({ autoplay: true, mute: false, loop: false, controls: true }),
      'KRWA Team 공매 프로젝트 소개 영상'
    ));

    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeVideoModal() {
    if (!videoModal || videoModal.hidden) return;

    videoModal.hidden = true;
    document.body.classList.remove('modal-open');
    modalMount.innerHTML = '';   // iframe 제거 = 재생 중지 + 리소스 해제

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  if (playVideoBtn) playVideoBtn.addEventListener('click', openVideoModal);

  if (videoModal) {
    videoModal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close-modal')) closeVideoModal();
    });

    document.addEventListener('keydown', function (e) {
      if (videoModal.hidden) return;
      if (e.key === 'Escape') { closeVideoModal(); return; }

      // 간단한 포커스 트랩
      if (e.key !== 'Tab') return;
      var focusables = videoModal.querySelectorAll('button, iframe, a[href]');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ---------- 7. To-top ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 8. Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
