import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isMobile = window.matchMedia('(max-width: 899px)');

/**
 * Sets up accordion behavior for footer columns on mobile
 * @param {Element} footer The footer container
 */
function setupAccordions(footer) {
  footer.querySelectorAll('h4').forEach((heading) => {
    const list = heading.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    heading.classList.add('footer-accordion');
    heading.setAttribute('aria-expanded', 'false');
    list.style.display = 'none';

    heading.addEventListener('click', () => {
      const expanded = heading.getAttribute('aria-expanded') === 'true';
      // close all others
      footer.querySelectorAll('h4.footer-accordion').forEach((h) => {
        h.setAttribute('aria-expanded', 'false');
        const ul = h.nextElementSibling;
        if (ul) ul.style.display = 'none';
      });
      if (!expanded) {
        heading.setAttribute('aria-expanded', 'true');
        list.style.display = 'block';
      }
    });
  });
}

/**
 * Removes accordion behavior (for desktop)
 * @param {Element} footer The footer container
 */
function removeAccordions(footer) {
  footer.querySelectorAll('h4.footer-accordion').forEach((heading) => {
    heading.setAttribute('aria-expanded', 'true');
    const list = heading.nextElementSibling;
    if (list) list.style.display = '';
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // try /content/ first (local preview), fall back to published path
  let fragment = await loadFragment('/content/footer');
  if (!fragment) {
    fragment = await loadFragment(footerPath);
  }
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-grid';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Tag each section for CSS grid targeting
  footer.querySelectorAll('.section').forEach((section, i) => {
    section.classList.add(`footer-col-${i + 1}`);
  });

  block.append(footer);

  /* Copyright row only: keep year current (fragment may ship a stale year from import) */
  const year = new Date().getFullYear();
  footer.querySelectorAll('.footer-col-5 p').forEach((p) => {
    if (!/©|rights reserved/i.test(p.textContent)) return;
    p.textContent = p.textContent.replace(/\b(19|20)\d{2}\b/, String(year));
  });

  // Accordion on mobile
  if (isMobile.matches) setupAccordions(footer);
  isMobile.addEventListener('change', () => {
    if (isMobile.matches) setupAccordions(footer);
    else removeAccordions(footer);
  });
}
