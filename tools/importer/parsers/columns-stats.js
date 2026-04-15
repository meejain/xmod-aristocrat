/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-stats.
 * Base: columns. Source: https://www.aristocrat.com/
 * Selectors from: section.block_counter-wrapper .block_counter
 *
 * Columns block structure (from block library):
 * Single row with N columns side-by-side. Each column contains content.
 * Here: 4 columns, each with a stat number and label.
 */
export default function parse(element, { document }) {
  // Extract counter items (the visible ones with id ct-item-N)
  const counterItems = element.querySelectorAll('.block_counter-item[id^="ct-item-"]');
  // Extract desktop labels (the ones with d-none d-lg-block)
  const desktopLabels = element.querySelectorAll('.block_counter-item.d-none.d-lg-block');

  const columns = [];

  counterItems.forEach((item, index) => {
    const countBefore = item.querySelector('.ct-count-before');
    const countValue = item.querySelector('[id^="ct-count-"]');
    const countAfter = item.querySelector('.ct-count-after');
    const mobileLabel = item.querySelector('.ct-description');

    // Build the stat string
    let statText = '';
    if (countBefore) statText += countBefore.textContent.trim();
    if (countValue) statText += countValue.textContent.trim();
    if (countAfter) statText += countAfter.textContent.trim();

    // Get label from desktop labels if available, otherwise mobile
    let labelText = '';
    if (desktopLabels[index]) {
      const labelEl = desktopLabels[index].querySelector('.ct-description');
      if (labelEl) labelText = labelEl.textContent.trim();
    } else if (mobileLabel) {
      labelText = mobileLabel.textContent.trim();
    }

    // Create column content
    const colContent = document.createElement('div');
    const statEl = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = statText;
    statEl.appendChild(strong);
    colContent.appendChild(statEl);

    const labelEl = document.createElement('p');
    labelEl.textContent = labelText;
    colContent.appendChild(labelEl);

    columns.push(colContent);
  });

  const cells = [];
  if (columns.length > 0) {
    cells.push(columns);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stats', cells });
  element.replaceWith(block);
}
