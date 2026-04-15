/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-corporate.
 * Base: hero. Source: https://www.aristocrat.com/
 * Selectors from: section.block_hero_slider-wrapper .swiper-slide.swiper-slide-active
 *
 * Hero block structure (from block library):
 * Row 1: background image
 * Row 2: heading + subheading + CTA
 */
export default function parse(element, { document }) {
  // Extract background image from desktop vimeo wrapper
  const bgImg = element.querySelector('.vimeo-iframe-wrapper.d-none.d-lg-block img, .vimeo-iframe-wrapper img');

  // Extract heading from .block_hero-header
  const heading = element.querySelector('.block_hero-header h2, .block_hero-header h1');

  // Extract subheading from .block_hero-subheading
  const subheading = element.querySelector('.block_hero-subheading h4, .block_hero-subheading p');

  // Extract CTA button
  const cta = element.querySelector('.btn.btn-secondary, a.btn');

  const cells = [];

  // Row 1: background image
  if (bgImg) {
    cells.push([bgImg]);
  }

  // Row 2: heading + subheading + CTA
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  if (cta) contentCell.push(cta);
  if (contentCell.length > 0) {
    cells.push(contentCell);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-corporate', cells });
  element.replaceWith(block);
}
