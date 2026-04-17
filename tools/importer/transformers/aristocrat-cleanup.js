/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Aristocrat site cleanup v3.
 * Selectors from captured DOM of https://www.aristocrat.com/
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove cookie consent banner (found: #consent_blackbar, #truste-consent-track)
    WebImporter.DOMUtils.remove(element, [
      '#consent_blackbar',
      '#truste-consent-track',
      '#truste-consent-content',
    ]);

    // Remove page load overlay (found: #page-load)
    WebImporter.DOMUtils.remove(element, ['#page-load']);
  }

  if (hookName === H.after) {
    // Remove non-authorable site chrome
    // Header nav (found: header.navbar)
    // Footer (found: footer.bg-primary)
    // Skip-to-content link (found: a.visually-hidden-focusable)
    // Share price widget (found: .share-price-wrapper)
    // Hidden headings (found: h1.visually-hidden, h3.visually-hidden)
    WebImporter.DOMUtils.remove(element, [
      'header.navbar',
      'footer.bg-primary',
      'a.visually-hidden-focusable',
      '.share-price-wrapper',
      'h1.visually-hidden',
      'h3.visually-hidden',
      'noscript',
      'iframe',
      'link',
    ]);

    // Remove swiper duplicate slides (found: .swiper-slide-duplicate)
    WebImporter.DOMUtils.remove(element, ['.swiper-slide-duplicate']);

    // Remove swiper navigation elements (found: .swiper-pagination, .swiper-progress-bar, .swiper-notification)
    WebImporter.DOMUtils.remove(element, [
      '.swiper-pagination',
      '.swiper-progress-bar',
      '.swiper-notification',
    ]);

    // Remove cookie consent text that leaks from Cloudflare/Turnstile
    element.querySelectorAll('p').forEach((p) => {
      if (p.textContent.includes('May we use cookies to track your activities')) {
        p.remove();
      }
    });

    // Clean tracking attributes
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-track');
      el.removeAttribute('onclick');
      el.removeAttribute('data-gtm');
    });
  }
}
