import { createOptimizedPicture } from '../../scripts/aem.js';

function buildHeading(text) {
  const h4 = document.createElement('h4');
  const words = ['Flex', 'Innovate', 'Lead'];
  let found = false;
  words.forEach((word) => {
    if (text.includes(word) && !found) {
      const idx = text.indexOf(word);
      if (idx > 0) h4.append(document.createTextNode(text.substring(0, idx)));
      const em = document.createElement('em');
      em.textContent = word;
      h4.append(em);
      const rest = text.substring(idx + word.length);
      if (rest) h4.append(document.createTextNode(rest));
      found = true;
    }
  });
  if (!found) h4.textContent = text;
  return h4;
}

function buildCard(headingText, imgSrc, imgAlt, descText, ctaHref, ctaText) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('flip-card-wrapper');

  const flipCard = document.createElement('div');
  flipCard.classList.add('flip-card');

  // Front
  const front = document.createElement('div');
  front.classList.add('card-front');
  const frontBody = document.createElement('div');
  frontBody.classList.add('card-body');
  frontBody.append(buildHeading(headingText));
  if (imgSrc) {
    const pic = createOptimizedPicture(imgSrc, imgAlt || '', false, [{ width: '750' }]);
    pic.classList.add('card-image');
    frontBody.append(pic);
  }
  front.append(frontBody);

  // Back
  const back = document.createElement('div');
  back.classList.add('card-back');
  const backBody = document.createElement('div');
  backBody.classList.add('card-body');
  const backTop = document.createElement('div');
  backTop.classList.add('card-back-content');
  backTop.append(buildHeading(headingText));
  if (descText) {
    const p = document.createElement('p');
    p.textContent = descText;
    backTop.append(p);
  }
  backBody.append(backTop);
  if (ctaHref) {
    const cta = document.createElement('a');
    cta.classList.add('card-btn');
    cta.href = ctaHref;
    cta.textContent = ctaText;
    backBody.append(cta);
  }
  back.append(backBody);

  flipCard.append(front, back);
  wrapper.append(flipCard);
  return wrapper;
}

/* eslint-disable max-len, quotes */
const PREV_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 110.5 184.59'><path class='triangle' d='M30.5 118.6a2.5 2.5 0 01-1.66-.64L.84 93A2.5 2.5 0 010 91a2.5 2.5 0 01.91-1.88l28-23A2.5 2.5 0 0133 68v48a2.5 2.5 0 01-2.5 2.6z' fill='#ff512e'/><path d='M61.6 184.2a5 5 0 01-3-9 103.5 103.5 0 0041.9-82.9A103.4 103.4 0 0058.1 9 5 5 0 0163 .3a4.8 4.8 0 011 .7 113.5 113.5 0 0146.5 91.3 113.5 113.5 0 01-45.9 90.9 5 5 0 01-3 1z' fill='#fff'/></svg>`;
const NEXT_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 110.5 184.59'><path class='triangle' d='M80 65.2a2.5 2.5 0 011.66.64l28 25a2.5 2.5 0 01-.07 3.82l-28 23A2.5 2.5 0 0177.5 116V68a2.5 2.5 0 012.5-2.8z' fill='#ff512e'/><path d='M48.9-.4a5 5 0 013 9 103 103 0 00.5 166.2 5 5 0 01-4.9 8.7 5.2 5.2 0 01-1-.7A113 113 0 0145.9.6 5 5 0 0148.9-.4z' fill='#fff'/></svg>`;
/* eslint-enable max-len, quotes */

export default function decorate(block) {
  const cardData = [];

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const img = cols[0]?.querySelector('picture img');
    const strong = cols[1]?.querySelector('strong');
    const headingText = strong?.textContent?.trim() || '';
    let descText = '';
    let ctaHref = '';
    let ctaText = '';
    (cols[1]?.querySelectorAll('p') || []).forEach((p) => {
      const link = p.querySelector('a');
      if (link && !p.querySelector('strong')) {
        ctaHref = link.href;
        ctaText = link.textContent.trim();
      } else if (!p.querySelector('strong') && p.textContent.trim()) {
        descText = p.textContent.trim();
      }
    });
    cardData.push({
      headingText, imgSrc: img?.src, imgAlt: img?.alt, descText, ctaHref, ctaText,
    });
  });

  block.textContent = '';

  // Build slider
  const slider = document.createElement('div');
  slider.classList.add('cards-slider');

  const track = document.createElement('div');
  track.classList.add('cards-track');

  // Clone cards for infinite loop: [clone-last, ...originals, clone-first]
  const allCards = [...cardData, ...cardData, ...cardData];
  allCards.forEach((data) => {
    const slide = document.createElement('div');
    slide.classList.add('cards-slide');
    slide.append(buildCard(
      data.headingText,
      data.imgSrc,
      data.imgAlt,
      data.descText,
      data.ctaHref,
      data.ctaText,
    ));
    track.append(slide);
  });

  slider.append(track);
  block.append(slider);

  // Navigation
  const prevBtn = document.createElement('button');
  prevBtn.classList.add('cards-nav', 'cards-nav-prev');
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.innerHTML = PREV_SVG;

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('cards-nav', 'cards-nav-next');
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.innerHTML = NEXT_SVG;

  block.append(prevBtn, nextBtn);

  // Slider logic
  const total = cardData.length;
  let current = total; // Start at first "real" set
  let transitioning = false;

  const getSlideWidth = () => {
    const slide = track.querySelector('.cards-slide');
    return slide ? slide.offsetWidth + 32 : 300;
  };

  const goTo = (index, animate) => {
    if (animate) {
      track.style.transition = 'transform 0.4s ease';
    } else {
      track.style.transition = 'none';
    }
    const offset = index * getSlideWidth();
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;
    current = index;
  };

  const handleTransitionEnd = () => {
    transitioning = false;
    // Jump to real position if on a clone
    if (current >= total * 2) {
      goTo(current - total, false);
    } else if (current < total) {
      goTo(current + total, false);
    }
  };

  track.addEventListener('transitionend', handleTransitionEnd);

  nextBtn.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    goTo(current + 1, true);
  });

  prevBtn.addEventListener('click', () => {
    if (transitioning) return;
    transitioning = true;
    goTo(current - 1, true);
  });

  // Initial position (no animation)
  requestAnimationFrame(() => goTo(current, false));

  // Recalculate on resize
  window.addEventListener('resize', () => goTo(current, false));
}
