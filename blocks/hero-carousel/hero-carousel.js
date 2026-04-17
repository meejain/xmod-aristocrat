/** Time each slide stays visible before autoplay advances */
const SLIDE_INTERVAL_MS = 3000;

/** Text enter/exit animation length (keep in sync with --hero-text-duration in CSS) */
const TEXT_MOTION_MS = 800;
const TEXT_MOTION_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Desktop → Mobile video ID map.
 * Original aristocrat.com serves portrait (9:16) videos on mobile with character centered,
 * and separate landscape (16:9) videos on desktop.
 */
const MOBILE_VIDEO_MAP = {
  941099183: '941099273', // Aristocrat Gaming
  941099217: '941099291', // Product Madness
  941099250: '941099321', // Aristocrat Interactive
};

/**
 * Mobile poster thumbnails from Vimeo CDN — portrait frames with character centered.
 * Shown as background-image on the video wrapper until the video loads.
 */
const MOBILE_POSTER_MAP = {
  941099273: 'https://i.vimeocdn.com/video/1848380086-9edafb401ec4c6cc5416d615896d753391e29573c00aaaa24e200a650c335814-d',
  941099291: 'https://i.vimeocdn.com/video/1848380818-29605837a26a7b1f830628b59e0b97664743d5111cf8a72e8da682f5807a20b9-d',
  941099321: 'https://i.vimeocdn.com/video/1848381627-0e7d769dc330d19a9a1b415c8afa29dc8139df2749a37163886b0f98a5ac15e7-d',
};

/** Matches --hero-text-parallax / small-screen cap in hero-carousel.css */
function getTextParallaxPx() {
  if (window.innerWidth < 600) return Math.min(window.innerWidth * 1.2, 720);
  return 1500;
}

/** Aligns with CSS `@media (width < 600px)` used for portrait video swap */
function isHeroMobileViewport() {
  return window.innerWidth < 600;
}

function extractVimeoId(href) {
  const m = href.match(/(?:player\.vimeo\.com\/video\/|vimeo\.com\/)(\d+)/);
  return m ? m[1] : null;
}

function buildVimeoIframeSrc(id) {
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1`;
}

function vimeoIdFromIframeSrc(src) {
  if (!src) return null;
  try {
    return new URL(src).pathname.match(/\/video\/(\d+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Picks portrait vs landscape Vimeo id and poster for the current viewport.
 * @param {HTMLElement} videoWrapper `.hero-carousel-video-wrapper`
 * @param {number} slideIndex For eager/lazy on first iframe src set only
 */
function applyVideoWrapperForViewport(videoWrapper, slideIndex) {
  const desktopId = videoWrapper.dataset.vimeoDesktopId;
  if (!desktopId) return;
  const iframe = videoWrapper.querySelector('iframe');
  if (!iframe) return;

  const targetId = isHeroMobileViewport() && MOBILE_VIDEO_MAP[desktopId]
    ? MOBILE_VIDEO_MAP[desktopId]
    : desktopId;
  const nextSrc = buildVimeoIframeSrc(targetId);
  const currentId = vimeoIdFromIframeSrc(iframe.src);

  if (currentId !== targetId || !iframe.src) {
    iframe.src = nextSrc;
    if (slideIndex === 0) {
      iframe.setAttribute('loading', 'eager');
      iframe.setAttribute('fetchpriority', 'high');
    } else {
      iframe.setAttribute('loading', 'lazy');
    }
  }

  const poster = videoWrapper.querySelector('.hero-carousel-poster');
  const mobilePoster = isHeroMobileViewport() && MOBILE_POSTER_MAP[targetId]
    ? MOBILE_POSTER_MAP[targetId]
    : null;

  if (mobilePoster) {
    videoWrapper.style.backgroundImage = `url(${JSON.stringify(mobilePoster)})`;
  } else if (poster) {
    const posterImg = poster.querySelector('img');
    const posterSrc = posterImg?.currentSrc || posterImg?.src;
    if (posterSrc) {
      videoWrapper.style.backgroundImage = `url(${JSON.stringify(posterSrc)})`;
    }
  } else {
    videoWrapper.style.backgroundImage = '';
  }
  videoWrapper.style.backgroundSize = 'cover';
  videoWrapper.style.backgroundPosition = 'center center';
}

/** Clears stale text motion when parallax distance changes (viewport resize). */
function resetVisibleSlideTextMotion(block) {
  const slide = block.querySelector('.hero-carousel-slide[aria-hidden="false"]');
  if (!slide || slide.classList.contains('slide-exiting')) return;
  const content = slide.querySelector('.hero-carousel-slide-content');
  if (!content) return;
  content.style.transition = 'none';
  content.style.transform = 'translate3d(0, 0, 0)';
  // eslint-disable-next-line no-unused-expressions
  content.offsetWidth;
  requestAnimationFrame(() => {
    content.style.transition = '';
    content.style.removeProperty('transform');
  });
}

function syncHeroCarouselViewport(block) {
  block.querySelectorAll('.hero-carousel-video-wrapper').forEach((wrap) => {
    const slide = wrap.closest('.hero-carousel-slide');
    const slideIndex = slide ? parseInt(slide.dataset.slideIndex, 10) || 0 : 0;
    applyVideoWrapperForViewport(wrap, slideIndex);
  });
  resetVisibleSlideTextMotion(block);
}

function debounce(fn, ms) {
  let timeoutId = 0;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), ms);
  };
}

function bindViewportResize(block) {
  const run = debounce(() => syncHeroCarouselViewport(block), 150);
  window.addEventListener('resize', run, { passive: true });
  const target = block.querySelector('.hero-carousel-slides-container') || block;
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => run());
    ro.observe(target);
  }
}

function clearContentMotion(slide) {
  const el = slide?.querySelector('.hero-carousel-slide-content');
  if (!el) return;
  el.style.transition = '';
  el.style.transform = '';
}

/**
 * "Forward" (next / dot to the right / autoplay): new panel enters right → left (+x → 0).
 * "Backward" (prev / dot to the left): new panel enters left → right (−x → 0).
 */
function isForwardMotion(prevIndex, nextIndex, total) {
  if (total <= 1) return true;
  if (prevIndex === total - 1 && nextIndex === 0) return true;
  if (prevIndex === 0 && nextIndex === total - 1) return false;
  return nextIndex > prevIndex;
}

/**
 * Forces layout between start and end transforms so the transition always runs
 * (fixes last→first loop where a double-rAF clear could skip interpolation).
 */
function playTextEnter(slide, forward) {
  const content = slide.querySelector('.hero-carousel-slide-content');
  if (!content) return;
  const px = getTextParallaxPx();
  content.style.transition = 'none';
  content.style.transform = `translate3d(${forward ? px : -px}px, 0, 0)`;
  // eslint-disable-next-line no-unused-expressions
  content.offsetWidth;
  requestAnimationFrame(() => {
    content.style.transition = `transform ${TEXT_MOTION_MS}ms ${TEXT_MOTION_EASE}`;
    content.style.transform = 'translate3d(0, 0, 0)';
  });
}

function updateActiveSlide(targetSlide) {
  const block = targetSlide.closest('.hero-carousel');
  const slides = block.querySelectorAll('.hero-carousel-slide');
  const total = slides.length;
  const slideIndex = parseInt(targetSlide.dataset.slideIndex, 10);
  const prevIndex = parseInt(block.dataset.activeSlide, 10);

  if (slideIndex === prevIndex) return;

  const forward = isForwardMotion(prevIndex, slideIndex, total);
  const prevSlide = slides[prevIndex];

  if (prevSlide) {
    prevSlide.setAttribute('data-exit-dir', forward ? 'left' : 'right');
    prevSlide.classList.add('slide-exiting');
  }

  slides.forEach((aSlide, idx) => {
    if (idx !== slideIndex && idx !== prevIndex) {
      aSlide.setAttribute('aria-hidden', 'true');
      aSlide.classList.remove('slide-exiting');
      aSlide.removeAttribute('data-exit-dir');
      clearContentMotion(aSlide);
    }
  });

  clearContentMotion(targetSlide);
  targetSlide.setAttribute('aria-hidden', 'false');
  playTextEnter(targetSlide, forward);

  block.dataset.activeSlide = String(slideIndex);

  slides.forEach((aSlide, idx) => {
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  block.querySelectorAll('.hero-carousel-slide-indicator').forEach((indicator, idx) => {
    const btn = indicator.querySelector('button');
    if (!btn) return;
    if (idx !== slideIndex) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', 'true');
    }
  });

  if (prevSlide) {
    const prevId = block.dataset.heroExitTimeoutId;
    if (prevId) window.clearTimeout(parseInt(prevId, 10));
    const tid = window.setTimeout(() => {
      prevSlide.setAttribute('aria-hidden', 'true');
      prevSlide.classList.remove('slide-exiting');
      prevSlide.removeAttribute('data-exit-dir');
      clearContentMotion(prevSlide);
      delete block.dataset.heroExitTimeoutId;
    }, TEXT_MOTION_MS);
    block.dataset.heroExitTimeoutId = String(tid);
  }
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.hero-carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;

  updateActiveSlide(slides[realSlideIndex]);
}

function startAutoplay(block) {
  const intervalId = window.setInterval(() => {
    const current = parseInt(block.dataset.activeSlide, 10);
    showSlide(block, current + 1);
  }, SLIDE_INTERVAL_MS);
  block.dataset.autoplayId = String(intervalId);
}

function stopAutoplay(block) {
  const id = block.dataset.autoplayId;
  if (id) window.clearInterval(parseInt(id, 10));
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.hero-carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      stopAutoplay(block);
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      startAutoplay(block);
    });
  });

  block.addEventListener('mouseenter', () => stopAutoplay(block));
  block.addEventListener('mouseleave', () => startAutoplay(block));
}

function createSlide(row, slideIndex, id) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `hero-carousel-${id}-slide-${slideIndex}`);
  slide.classList.add('hero-carousel-slide');

  const columns = [...row.querySelectorAll(':scope > div')];
  columns.forEach((column, colIdx) => {
    if (colIdx === 0) {
      column.classList.add('hero-carousel-slide-image');
      const videoLink = column.querySelector('a[href*="vimeo"]');
      if (videoLink) {
        const desktopId = extractVimeoId(videoLink.href);
        if (desktopId) {
          const poster = column.querySelector('picture');
          const videoWrapper = document.createElement('div');
          videoWrapper.classList.add('hero-carousel-video-wrapper');
          videoWrapper.dataset.vimeoDesktopId = desktopId;

          if (poster) {
            poster.classList.add('hero-carousel-poster');
            videoWrapper.append(poster);
          }

          const iframe = document.createElement('iframe');
          iframe.setAttribute('frameborder', '0');
          iframe.setAttribute('allow', 'autoplay; fullscreen');
          iframe.title = '';
          videoWrapper.append(iframe);
          applyVideoWrapperForViewport(videoWrapper, slideIndex);

          column.textContent = '';
          column.append(videoWrapper);
        }
      }
      slide.append(column);
    } else if (colIdx === 1) {
      column.classList.add('hero-carousel-slide-content');
      slide.append(column);
    } else if (colIdx === 2) {
      const colorText = column.textContent.trim();
      const colors = colorText.split(',').map((c) => c.trim());
      if (colors[0]?.startsWith('#')) slide.style.setProperty('--slide-accent', colors[0]);
      if (colors[1]?.startsWith('#')) slide.style.setProperty('--slide-btn-color', colors[1]);
      if (colors[2]?.startsWith('#')) slide.style.setProperty('--slide-hover-bg', colors[2]);
      if (colors[3]?.startsWith('#')) slide.style.setProperty('--slide-hover-color', colors[3]);
      column.remove();
    }
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy?.id) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

function playInitialIntro(firstSlide) {
  const content = firstSlide.querySelector('.hero-carousel-slide-content');
  if (!content) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    content.style.transform = 'translate3d(0, 0, 0)';
    return;
  }
  playTextEnter(firstSlide, true);
}

let carouselId = 0;
export default function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `hero-carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('hero-carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('hero-carousel-slides');

  let slideIndicators;
  let slideIndicatorsNav;
  if (!isSingleSlide) {
    slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('hero-carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slide.setAttribute('aria-hidden', 'true');
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('hero-carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  if (slideIndicatorsNav) {
    slideIndicatorsNav.classList.add('hero-carousel-controls');
    container.append(slideIndicatorsNav);
  }
  block.prepend(container);

  block.dataset.activeSlide = '0';
  const firstSlide = block.querySelector('.hero-carousel-slide');
  if (firstSlide) {
    firstSlide.setAttribute('aria-hidden', 'false');
    playInitialIntro(firstSlide);
  }

  const firstIndicator = block.querySelector('.hero-carousel-slide-indicator button');
  if (firstIndicator) firstIndicator.setAttribute('disabled', 'true');

  if (!isSingleSlide) {
    bindEvents(block);
    startAutoplay(block);
  }

  bindViewportResize(block);
}
