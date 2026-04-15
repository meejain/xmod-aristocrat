const SLIDE_ACCENTS = [
  { accent: '#9518e3', btnText: '#ffffff' },
  { accent: '#ff56c0', btnText: '#072c51' },
  { accent: '#94ff80', btnText: '#072c51' },
];

const AUTO_PLAY_INTERVAL = 6000;

export default async function decorate(block) {
  const rows = [...block.children];
  const slides = [];
  const fragment = document.createDocumentFragment();

  rows.forEach((row, index) => {
    const cells = [...row.children];
    const imgCell = cells[0]; // picture cell
    const textCell = cells[1]; // text cell

    const slide = document.createElement('div');
    slide.className = 'slide';
    if (index === 0) slide.classList.add('active');

    // Background image
    const bg = document.createElement('div');
    bg.className = 'slide-bg';
    const picture = imgCell.querySelector('picture');
    if (picture) bg.append(picture);
    slide.append(bg);

    // Content overlay
    const content = document.createElement('div');
    content.className = 'slide-content';

    const colors = SLIDE_ACCENTS[index % SLIDE_ACCENTS.length];

    // Heading — colorize last word "play"
    const h2 = textCell.querySelector('h2');
    if (h2) {
      const html = h2.innerHTML;
      h2.innerHTML = html.replace(
        /play/i,
        `<span class="accent-word" style="color: ${colors.accent}">play</span>`,
      );
      content.append(h2);
    }

    // Button
    const buttonWrapper = textCell.querySelector('.button-wrapper');
    if (buttonWrapper) {
      buttonWrapper.style.setProperty('--slide-accent', colors.accent);
      buttonWrapper.style.setProperty('--slide-btn-text', colors.btnText);
      const btn = buttonWrapper.querySelector('a.button');
      if (btn) {
        btn.style.setProperty('--slide-accent', colors.accent);
        btn.style.setProperty('--slide-btn-text', colors.btnText);
      }
      content.append(buttonWrapper);
    }

    // Subheading
    const h4 = textCell.querySelector('h4');
    if (h4) content.append(h4);

    slide.append(content);
    fragment.append(slide);
    slides.push(slide);
  });

  // Clear block and rebuild
  block.textContent = '';
  block.append(fragment);

  // Pagination dots
  const dots = document.createElement('div');
  dots.className = 'slider-dots';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dots.append(dot);
  });
  block.append(dots);

  // Slider logic
  let current = 0;
  let timer = null;

  function goToSlide(index) {
    slides[current].classList.remove('active');
    dots.children[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dots.children[current].classList.add('active');
    resetTimer();
  }

  function nextSlide() {
    goToSlide((current + 1) % slides.length);
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
  }

  resetTimer();
}
