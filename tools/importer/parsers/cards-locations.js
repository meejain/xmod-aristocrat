/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-locations.
 * Base: cards. Source: https://www.aristocrat.com/
 * Selectors from: section.block_interactive_map-wrapper
 *
 * Cards block structure (from block library):
 * 2 columns per row. Each row = one card.
 * Column 1: character image. Column 2: city name heading.
 * Extracts location pins from the interactive map.
 */
export default function parse(element, { document }) {
  // Get location items (found: .block_interactive_map-location, .map-pin, [class*="location"])
  const locations = element.querySelectorAll('.block_interactive_map-location, .map-location, [class*="map-pin"]');
  const cells = [];

  if (locations.length > 0) {
    locations.forEach((loc) => {
      const img = loc.querySelector('img');
      const name = loc.querySelector('h3, h4, p, span');

      const imgCell = document.createElement('div');
      if (img) imgCell.appendChild(img);

      const textCell = document.createElement('div');
      if (name) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = name.textContent.trim();
        p.appendChild(strong);
        textCell.appendChild(p);
      }

      cells.push([imgCell, textCell]);
    });
  } else {
    // Fallback: extract all images and text from the map section
    const images = element.querySelectorAll('img:not([src*="plus-sign"])');
    const headings = element.querySelectorAll('h3, h4, .map-city-name, [class*="city"]');

    images.forEach((img, index) => {
      const imgCell = document.createElement('div');
      imgCell.appendChild(img);

      const textCell = document.createElement('div');
      if (headings[index]) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = headings[index].textContent.trim();
        p.appendChild(strong);
        textCell.appendChild(p);
      }

      cells.push([imgCell, textCell]);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-locations', cells });
  element.replaceWith(block);
}
