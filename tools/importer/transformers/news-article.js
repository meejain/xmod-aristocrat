/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: News article extraction v4.
 * Preserves the full article header: breadcrumbs, H1, date, category tag, share post.
 * Then the article body content.
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove cookie / consent elements and Cloudflare challenges
    WebImporter.DOMUtils.remove(element, [
      '#consent_blackbar',
      '#truste-consent-track',
      '#truste-consent-content',
      '#truste-consent-required',
      '#page-load',
      '.cookie-notice',
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[id*="cf-"]',
      '.cf-turnstile',
      '[data-sitekey]',
      '#onetrust-consent-sdk',
      '.evidon-consent',
    ]);
  }

  if (hookName === H.after) {
    const { document } = payload;

    // Remove site chrome
    WebImporter.DOMUtils.remove(element, [
      'header.navbar',
      'footer.bg-primary',
      'a.visually-hidden-focusable',
      '.share-price-wrapper',
      'h3.visually-hidden',
      'h1.visually-hidden',
      'noscript',
      'link',
      '.nav-wrapper',
      '.logo-wrapper',
    ]);

    // Remove social share icon images/SVGs but keep the "Share post:" text
    WebImporter.DOMUtils.remove(element, [
      '.post-share svg',
      '.post-share .share-icon',
      '.post-share a',
    ]);

    // Build metadata
    const meta = {};

    // Title
    const h1 = element.querySelector('h1.entry-title');
    if (h1) {
      meta.title = h1.textContent.trim();
    }

    // Publication date — keep in DOM, also save to metadata
    const dateEl = element.querySelector('.post-date time');
    if (dateEl) {
      meta['publication-date'] = dateEl.textContent.trim();
    }

    // Category — keep in DOM, also save to metadata
    const catEl = element.querySelector('h6.subheading');
    if (catEl) {
      meta.category = catEl.textContent.trim();
    }

    // Template
    meta.template = 'news-article';

    // OG description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      meta.description = ogDesc.getAttribute('content');
    }

    // Attach metadata to payload
    if (payload) {
      payload.meta = { ...payload.meta, ...meta };
    }
  }
}
