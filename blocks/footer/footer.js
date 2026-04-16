import { getMetadata, decorateSections, loadSections } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // try /content/ first (local preview), fall back to published path
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.innerHTML = await resp.text();

  decorateSections(footer);
  await loadSections(footer);

  block.append(footer);
}
