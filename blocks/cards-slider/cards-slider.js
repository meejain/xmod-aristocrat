export default async function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    const cells = [...row.children];
    const imgCell = cells[0];
    const textCell = cells[1];

    if (imgCell) {
      imgCell.classList.add('cards-slider-image');
    }

    if (textCell) {
      textCell.classList.add('cards-slider-content');

      // Create a front title overlay (duplicate of the heading)
      const heading = textCell.querySelector('h3');
      if (heading) {
        const frontTitle = document.createElement('div');
        frontTitle.classList.add('cards-slider-front-title');
        const h3Clone = heading.cloneNode(true);
        frontTitle.appendChild(h3Clone);
        row.appendChild(frontTitle);
      }
    }
  });

  // Add navigation arrows
  const wrapper = block.closest('.cards-slider-wrapper');
  if (wrapper) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'cards-slider-prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = '&#8249;';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'cards-slider-next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = '&#8250;';

    wrapper.appendChild(prevBtn);
    wrapper.appendChild(nextBtn);

    const scrollAmount = 372; // card width + gap

    nextBtn.addEventListener('click', () => {
      block.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    prevBtn.addEventListener('click', () => {
      block.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }
}
