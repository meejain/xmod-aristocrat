/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-about.
 * Base: columns. Source: https://www.aristocrat.com/
 * Selectors from: section.block_2columns-wrapper .row.justify-content-between
 *
 * Columns block structure (from block library):
 * Single row with 2 columns. Column 1: text content + CTA. Column 2: image.
 */
export default function parse(element, { document }) {
  // Column 1: text content (found: .block_2columns-content)
  const textCol = element.querySelector('.block_2columns-content');
  const heading = textCol ? textCol.querySelector('h2, h1') : null;
  const paragraphs = textCol ? Array.from(textCol.querySelectorAll('.lead p, .mt-4 p')) : [];
  const cta = textCol ? textCol.querySelector('a.btn') : null;

  // Column 2: image (found: .block_2columns-image)
  const imageCol = element.querySelector('.block_2columns-image');
  const img = imageCol ? imageCol.querySelector('img.foreground_image, img:first-of-type') : null;

  // Build column 1 content
  const col1 = document.createElement('div');
  if (heading) col1.appendChild(heading);
  paragraphs.forEach((p) => col1.appendChild(p));
  if (cta) col1.appendChild(cta);

  // Build column 2 content
  const col2 = document.createElement('div');
  if (img) col2.appendChild(img);

  const cells = [[col1, col2]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-about', cells });
  element.replaceWith(block);
}
