/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-powerhouse.
 * Base: cards. Source: https://www.aristocrat.com/
 * Selectors from: section.block_cards_slider-wrapper .block_cards_slider
 *
 * Cards block structure (from block library):
 * 2 columns per row. Each row = one card.
 * Column 1: image. Column 2: heading + description + CTA link.
 * Uses non-duplicate swiper slides only.
 */
export default function parse(element, { document }) {
  // Get non-duplicate slides (found: .swiper-slide:not(.swiper-slide-duplicate))
  const slides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
  const cells = [];

  slides.forEach((slide) => {
    // Image from card front (found: .card-front .card-image, .card-front img)
    const img = slide.querySelector('.card-front .card-image, .card-front img');

    // Heading from card back (found: .card-back .card-subheading .h4, .card-back .card-subheading p)
    const headingEl = slide.querySelector('.card-back .card-subheading .h4, .card-back .card-subheading p');

    // Description from card back (found: .card-back .card-copy p)
    const description = slide.querySelector('.card-back .card-copy p');

    // CTA from card back (found: .card-back .card-cta a, .card-back a.btn)
    const cta = slide.querySelector('.card-back .card-cta a, .card-back a.btn');

    // Build image cell
    const imgCell = document.createElement('div');
    if (img) imgCell.appendChild(img);

    // Build text cell
    const textCell = document.createElement('div');
    if (headingEl) {
      const h = document.createElement('strong');
      h.textContent = headingEl.textContent.trim();
      const p = document.createElement('p');
      p.appendChild(h);
      textCell.appendChild(p);
    }
    if (description) textCell.appendChild(description);
    if (cta) textCell.appendChild(cta);

    cells.push([imgCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-powerhouse', cells });
  element.replaceWith(block);
}
