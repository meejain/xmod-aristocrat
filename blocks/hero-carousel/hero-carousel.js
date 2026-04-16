/** Time each slide stays visible before autoplay advances */
const SLIDE_INTERVAL_MS = 3000;

/** Text enter/exit animation length (keep in sync with --hero-text-duration in CSS) */
const TEXT_MOTION_MS = 800;
const TEXT_MOTION_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Matches --hero-text-parallax / small-screen cap in hero-carousel.css */
function getTextParallaxPx() {
  if (window.innerWidth < 600) return Math.min(window.innerWidth * 1.2, 720);
  return 1500;
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
  void content.offsetWidth;
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
        const videoUrl = videoLink.href;
        const poster = column.querySelector('picture');
        const videoWrapper = document.createElement('div');
        videoWrapper.classList.add('hero-carousel-video-wrapper');

        if (poster) {
          poster.classList.add('hero-carousel-poster');
          videoWrapper.append(poster);
          const posterImg = poster.querySelector('img');
          const posterSrc = posterImg?.currentSrc || posterImg?.src;
          if (posterSrc) {
            videoWrapper.style.backgroundImage = `url(${JSON.stringify(posterSrc)})`;
            videoWrapper.style.backgroundSize = 'cover';
            videoWrapper.style.backgroundPosition = 'center center';
          }
        }

        const iframe = document.createElement('iframe');
        const separator = videoUrl.includes('?') ? '&' : '?';
        iframe.src = `${videoUrl}${separator}background=1&autoplay=1&loop=1&muted=1`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        iframe.title = '';
        /* First slide is LCP: eager load — lazy defers iframe ~1s+ in Chrome */
        if (slideIndex === 0) {
          iframe.setAttribute('loading', 'eager');
          iframe.setAttribute('fetchpriority', 'high');
        } else {
          iframe.setAttribute('loading', 'lazy');
        }

        videoWrapper.append(iframe);
        column.textContent = '';
        column.append(videoWrapper);
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
}
