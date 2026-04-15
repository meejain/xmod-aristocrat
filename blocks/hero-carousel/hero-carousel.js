const SLIDE_INTERVAL = 6000;

function updateActiveSlide(slide) {
  const block = slide.closest('.hero-carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  const prevIndex = parseInt(block.dataset.activeSlide, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.hero-carousel-slide');

  // Previous slide: add exiting class, then hide after transition
  if (prevIndex !== slideIndex && slides[prevIndex]) {
    slides[prevIndex].classList.add('slide-exiting');
    setTimeout(() => {
      slides[prevIndex].setAttribute('aria-hidden', 'true');
      slides[prevIndex].classList.remove('slide-exiting');
    }, 800);
  }

  slides.forEach((aSlide, idx) => {
    if (idx === slideIndex) {
      aSlide.setAttribute('aria-hidden', 'false');
    } else if (idx !== prevIndex) {
      aSlide.setAttribute('aria-hidden', 'true');
      aSlide.classList.remove('slide-exiting');
    }
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  block.querySelectorAll('.hero-carousel-slide-indicator').forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.hero-carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;

  updateActiveSlide(slides[realSlideIndex]);
}

function startAutoplay(block) {
  const intervalId = setInterval(() => {
    const current = parseInt(block.dataset.activeSlide, 10);
    showSlide(block, current + 1);
  }, SLIDE_INTERVAL);
  block.dataset.autoplayId = intervalId;
}

function stopAutoplay(block) {
  const id = block.dataset.autoplayId;
  if (id) clearInterval(parseInt(id, 10));
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
        }

        const iframe = document.createElement('iframe');
        const separator = videoUrl.includes('?') ? '&' : '?';
        iframe.src = `${videoUrl}${separator}background=1&autoplay=1&loop=1&muted=1`;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        iframe.setAttribute('loading', 'lazy');
        iframe.title = '';

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
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
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
    // All start hidden
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
  if (slideIndicatorsNav) container.append(slideIndicatorsNav);
  block.prepend(container);

  // Activate first slide
  block.dataset.activeSlide = 0;
  const firstSlide = block.querySelector('.hero-carousel-slide');
  if (firstSlide) firstSlide.setAttribute('aria-hidden', 'false');
  const firstIndicator = block.querySelector('.hero-carousel-slide-indicator button');
  if (firstIndicator) firstIndicator.setAttribute('disabled', 'true');

  if (!isSingleSlide) {
    bindEvents(block);
    startAutoplay(block);
  }
}
