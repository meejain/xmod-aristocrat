/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import newsArticleTransformer from './transformers/news-article.js';
import cleanupTransformer from './transformers/aristocrat-cleanup.js';

// NO PARSER IMPORTS — this template is 100% default content

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  newsArticleTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'news-article',
  description: 'News article / press release — single-column layout with H1 title, date, category tag, body paragraphs with optional images, and boilerplate closing',
  blocks: [],
  sections: [
    {
      id: 'section-1',
      name: 'Article Content',
      selector: 'main#primary .container-lg',
      style: null,
      blocks: [],
      defaultContent: ['h1', 'h6', '.date', '.page-content p', '.page-content h2', '.page-content img'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. No blocks to discover or parse — this template is 100% default content

    // 3. Execute afterTransform transformers (final cleanup + metadata extraction)
    executeTransformers('afterTransform', main, payload);

    // 4. Extract article metadata before built-in rules run
    let pubDate = '';
    let category = '';
    const dateP = main.querySelector('h1 + p');
    if (dateP && dateP.textContent.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/)) {
      pubDate = dateP.textContent.trim();
    }
    const catH6 = main.querySelector('h6');
    if (catH6) {
      category = catH6.textContent.trim();
    }

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Append custom rows to the metadata block table
    const tables = main.querySelectorAll('table');
    let metaTable = null;
    tables.forEach((t) => {
      const firstCell = t.querySelector('tr td, th');
      if (firstCell && firstCell.textContent.trim().toLowerCase() === 'metadata') {
        metaTable = t;
      }
    });
    if (!metaTable) {
      // Also check for div-based metadata block
      const divMeta = main.querySelector('.metadata');
      if (divMeta) metaTable = divMeta;
    }
    if (metaTable) {
      const addMetaRow = (key, value) => {
        if (!value) return;
        if (metaTable.tagName === 'TABLE') {
          const tbody = metaTable.querySelector('tbody') || metaTable;
          const row = document.createElement('tr');
          const kc = document.createElement('td');
          kc.textContent = key;
          const vc = document.createElement('td');
          vc.textContent = value;
          row.appendChild(kc);
          row.appendChild(vc);
          tbody.appendChild(row);
        } else {
          const row = document.createElement('div');
          const kd = document.createElement('div');
          kd.textContent = key;
          const vd = document.createElement('div');
          vd.textContent = value;
          row.appendChild(kd);
          row.appendChild(vd);
          metaTable.appendChild(row);
        }
      };
      addMetaRow('template', 'news-article');
      addMetaRow('publication-date', pubDate);
      addMetaRow('category', category);
    }

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
