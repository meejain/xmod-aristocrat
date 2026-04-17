import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Restores h6 + share p after a legacy `.news-article-meta-row` wrapper.
 * @param {Element} wrapper `.default-content-wrapper`
 */
function migrateLegacyNewsArticleMetaRow(wrapper) {
  const old = wrapper.querySelector(':scope > .news-article-meta-row');
  if (!old) return;
  const h6n = old.querySelector(':scope > h6');
  const pn = old.querySelector(':scope > p');
  const span = h6n?.querySelector('.news-article-meta-row-category');
  if (span && h6n) {
    while (span.firstChild) h6n.insertBefore(span.firstChild, span);
    span.remove();
  }
  if (h6n && pn) old.before(h6n, pn);
  old.remove();
}

/**
 * Builds `.post-date` (icon + time) from a plain date paragraph.
 * @param {HTMLParagraphElement} dateP Date line as authored `<p>`
 */
function buildPostDateBlock(dateP) {
  const label = dateP.textContent.trim();
  if (!label) return;
  const parsed = new Date(label);
  const iso = Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();

  const wrap = document.createElement('div');
  wrap.className = 'post-date mb-3 text-lg-end';

  const codeBase = window.hlx?.codeBasePath || '';
  const icon = document.createElement('img');
  icon.className = 'news-article-calendar-icon';
  icon.src = `${codeBase}/icons/calendar.svg`;
  icon.width = 16;
  icon.height = 16;
  icon.alt = '';
  icon.setAttribute('aria-hidden', 'true');

  const time = document.createElement('time');
  if (iso) time.setAttribute('datetime', iso);
  time.setAttribute('itemprop', 'datePublished');
  time.textContent = label;

  wrap.append(icon, document.createTextNode('\u00a0\u00a0'), time);
  dateP.replaceWith(wrap);
}

/**
 * Ensures share line uses `<b>Share post:</b>` like the WP template.
 * @param {HTMLParagraphElement} shareP Share row paragraph
 */
function normalizeSharePostMarkup(shareP) {
  if (shareP.querySelector('b, strong')) return;
  const t = shareP.textContent.trim();
  const m = t.match(/^Share post:\s*(.*)$/i);
  if (!m) return;
  const rest = m[1] ? ` ${m[1]}` : '';
  shareP.innerHTML = `<b>Share post:</b>${rest}`;
}

/**
 * Matches aristocrat.com article markup: `.post-date`, `.post-meta` / `.post-share`.
 * @param {Element} main The main element
 */
function decorateNewsArticleStructure(main) {
  if (!document.body.classList.contains('news-article')) return;
  const wrapper = main.querySelector('.default-content-wrapper');
  if (!wrapper || wrapper.querySelector(':scope > .post-meta')) return;

  migrateLegacyNewsArticleMetaRow(wrapper);

  const h1 = wrapper.querySelector(':scope > h1');
  if (!h1) return;

  let afterDate = h1.nextElementSibling;
  if (afterDate?.tagName === 'P') {
    buildPostDateBlock(afterDate);
    afterDate = h1.nextElementSibling;
  }
  if (!afterDate?.classList?.contains('post-date')) return;

  const h6 = afterDate.nextElementSibling;
  const shareP = h6?.nextElementSibling;
  if (h6?.tagName !== 'H6' || shareP?.tagName !== 'P') return;

  h6.classList.add('subheading', 'mb-0');
  normalizeSharePostMarkup(shareP);
  shareP.classList.add('mb-0');

  const postMeta = document.createElement('div');
  postMeta.className = 'post-meta';

  const row = document.createElement('div');
  row.className = 'row';

  const colL = document.createElement('div');
  colL.className = 'col-12 col-lg-6 py-lg-4 d-flex align-items-center';

  const colR = document.createElement('div');
  colR.className = 'col-12 col-lg-6 text-lg-end py-lg-4';

  const postShare = document.createElement('div');
  const shareClasses = [
    'post-share', 'd-flex', 'justify-content-lg-end', 'align-items-center',
    'py-3', 'mt-4', 'mb-3', 'py-lg-0', 'my-lg-0',
  ];
  postShare.classList.add(...shareClasses);

  wrapper.insertBefore(postMeta, h6);
  postMeta.append(row);
  row.append(colL, colR);
  colL.append(h6);
  postShare.append(shareP);
  colR.append(postShare);
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateNewsArticleStructure(main);
  decorateButtons(main);
}

/**
 * Transparent header uses `body.homepage` (see `blocks/header/header.css`).
 * Helix often omits `<meta name="template">` on `/`; add the class so root matches index UX.
 */
function ensureHomepageBodyClassForSiteRoot() {
  const raw = window.location.pathname || '/';
  const path = raw.replace(/\/$/, '') || '/';
  const isSiteRoot = path === '/' || path === '/index';
  if (!isSiteRoot) return;

  const tmplRaw = getMetadata('template').trim();
  const primaryTemplate = tmplRaw.split(',')[0].trim();
  if (!primaryTemplate || primaryTemplate === 'homepage') {
    document.body.classList.add('homepage');
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  ensureHomepageBodyClassForSiteRoot();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);

  // Load template-specific CSS based on metadata
  const templateMeta = document.querySelector('meta[name="template"]');
  if (templateMeta) {
    const tmpl = templateMeta.content.trim();
    if (tmpl) {
      loadCSS(`${window.hlx.codeBasePath}/styles/${tmpl}.css`).catch(() => { /* optional */ });
    }
  }

  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
