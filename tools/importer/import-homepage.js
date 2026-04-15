/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroCorporateParser from './parsers/hero-corporate.js';
import columnsStatsParser from './parsers/columns-stats.js';
import columnsAboutParser from './parsers/columns-about.js';
import cardsPowerhouseParser from './parsers/cards-powerhouse.js';
import cardsLocationsParser from './parsers/cards-locations.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/aristocrat-cleanup.js';
import sectionsTransformer from './transformers/aristocrat-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-corporate': heroCorporateParser,
  'columns-stats': columnsStatsParser,
  'columns-about': columnsAboutParser,
  'cards-powerhouse': cardsPowerhouseParser,
  'cards-locations': cardsLocationsParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Aristocrat main homepage with hero, featured content, and corporate information',
  urls: [
    'https://www.aristocrat.com/',
  ],
  blocks: [
    {
      name: 'hero-corporate',
      instances: [
        'section.block_hero_slider-wrapper .swiper-slide.swiper-slide-active',
      ],
    },
    {
      name: 'columns-stats',
      instances: [
        'section.block_counter-wrapper .block_counter',
      ],
    },
    {
      name: 'columns-about',
      instances: [
        'section.block_2columns-wrapper .row.justify-content-between',
      ],
    },
    {
      name: 'cards-powerhouse',
      instances: [
        'section.block_cards_slider-wrapper .block_cards_slider',
      ],
    },
    {
      name: 'cards-locations',
      instances: [
        'section.block_interactive_map-wrapper',
      ],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: 'section.block_hero_slider-wrapper',
      style: null,
      blocks: ['hero-corporate'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Stats Counter',
      selector: 'section.block_counter-wrapper',
      style: 'dark',
      blocks: ['columns-stats'],
      defaultContent: [
        'section.block_counter-wrapper .block_header h2',
        'section.block_counter-wrapper .block_header h3',
      ],
    },
    {
      id: 'section-3',
      name: 'About Two Columns',
      selector: 'section.block_2columns-wrapper',
      style: null,
      blocks: ['columns-about'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Cards Slider',
      selector: 'section.block_cards_slider-wrapper',
      style: 'dark',
      blocks: ['cards-powerhouse'],
      defaultContent: [
        'section.block_cards_slider-wrapper .block_header h2',
        'section.block_cards_slider-wrapper .block_header h3',
      ],
    },
    {
      id: 'section-5',
      name: 'World Map / Global Locations',
      selector: 'section.block_interactive_map-wrapper',
      style: 'dark',
      blocks: ['cards-locations'],
      defaultContent: [
        'section.block_interactive_map-wrapper .block_header h2',
      ],
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

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
