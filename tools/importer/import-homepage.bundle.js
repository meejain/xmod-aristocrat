var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-corporate.js
  function parse(element, { document }) {
    const bgImg = element.querySelector(".vimeo-iframe-wrapper.d-none.d-lg-block img, .vimeo-iframe-wrapper img");
    const heading = element.querySelector(".block_hero-header h2, .block_hero-header h1");
    const subheading = element.querySelector(".block_hero-subheading h4, .block_hero-subheading p");
    const cta = element.querySelector(".btn.btn-secondary, a.btn");
    const cells = [];
    if (bgImg) {
      cells.push([bgImg]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading) contentCell.push(subheading);
    if (cta) contentCell.push(cta);
    if (contentCell.length > 0) {
      cells.push(contentCell);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-corporate", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stats.js
  function parse2(element, { document }) {
    const counterItems = element.querySelectorAll('.block_counter-item[id^="ct-item-"]');
    const desktopLabels = element.querySelectorAll(".block_counter-item.d-none.d-lg-block");
    const columns = [];
    counterItems.forEach((item, index) => {
      const countBefore = item.querySelector(".ct-count-before");
      const countValue = item.querySelector('[id^="ct-count-"]');
      const countAfter = item.querySelector(".ct-count-after");
      const mobileLabel = item.querySelector(".ct-description");
      let statText = "";
      if (countBefore) statText += countBefore.textContent.trim();
      if (countValue) statText += countValue.textContent.trim();
      if (countAfter) statText += countAfter.textContent.trim();
      let labelText = "";
      if (desktopLabels[index]) {
        const labelEl2 = desktopLabels[index].querySelector(".ct-description");
        if (labelEl2) labelText = labelEl2.textContent.trim();
      } else if (mobileLabel) {
        labelText = mobileLabel.textContent.trim();
      }
      const colContent = document.createElement("div");
      const statEl = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = statText;
      statEl.appendChild(strong);
      colContent.appendChild(statEl);
      const labelEl = document.createElement("p");
      labelEl.textContent = labelText;
      colContent.appendChild(labelEl);
      columns.push(colContent);
    });
    const cells = [];
    if (columns.length > 0) {
      cells.push(columns);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-about.js
  function parse3(element, { document }) {
    const textCol = element.querySelector(".block_2columns-content");
    const heading = textCol ? textCol.querySelector("h2, h1") : null;
    const paragraphs = textCol ? Array.from(textCol.querySelectorAll(".lead p, .mt-4 p")) : [];
    const cta = textCol ? textCol.querySelector("a.btn") : null;
    const imageCol = element.querySelector(".block_2columns-image");
    const img = imageCol ? imageCol.querySelector("img.foreground_image, img:first-of-type") : null;
    const col1 = document.createElement("div");
    if (heading) col1.appendChild(heading);
    paragraphs.forEach((p) => col1.appendChild(p));
    if (cta) col1.appendChild(cta);
    const col2 = document.createElement("div");
    if (img) col2.appendChild(img);
    const cells = [[col1, col2]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-about", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-powerhouse.js
  function parse4(element, { document }) {
    const slides = element.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)");
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".card-front .card-image, .card-front img");
      const headingEl = slide.querySelector(".card-back .card-subheading .h4, .card-back .card-subheading p");
      const description = slide.querySelector(".card-back .card-copy p");
      const cta = slide.querySelector(".card-back .card-cta a, .card-back a.btn");
      const imgCell = document.createElement("div");
      if (img) imgCell.appendChild(img);
      const textCell = document.createElement("div");
      if (headingEl) {
        const h = document.createElement("strong");
        h.textContent = headingEl.textContent.trim();
        const p = document.createElement("p");
        p.appendChild(h);
        textCell.appendChild(p);
      }
      if (description) textCell.appendChild(description);
      if (cta) textCell.appendChild(cta);
      cells.push([imgCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-powerhouse", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-locations.js
  function parse5(element, { document }) {
    const locations = element.querySelectorAll('.block_interactive_map-location, .map-location, [class*="map-pin"]');
    const cells = [];
    if (locations.length > 0) {
      locations.forEach((loc) => {
        const img = loc.querySelector("img");
        const name = loc.querySelector("h3, h4, p, span");
        const imgCell = document.createElement("div");
        if (img) imgCell.appendChild(img);
        const textCell = document.createElement("div");
        if (name) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = name.textContent.trim();
          p.appendChild(strong);
          textCell.appendChild(p);
        }
        cells.push([imgCell, textCell]);
      });
    } else {
      const images = element.querySelectorAll('img:not([src*="plus-sign"])');
      const headings = element.querySelectorAll('h3, h4, .map-city-name, [class*="city"]');
      images.forEach((img, index) => {
        const imgCell = document.createElement("div");
        imgCell.appendChild(img);
        const textCell = document.createElement("div");
        if (headings[index]) {
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = headings[index].textContent.trim();
          p.appendChild(strong);
          textCell.appendChild(p);
        }
        cells.push([imgCell, textCell]);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-locations", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/aristocrat-cleanup.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        "#truste-consent-track",
        "#truste-consent-content"
      ]);
      WebImporter.DOMUtils.remove(element, ["#page-load"]);
    }
    if (hookName === H.after) {
      WebImporter.DOMUtils.remove(element, [
        "header.navbar",
        "footer.bg-primary",
        "a.visually-hidden-focusable",
        ".share-price-wrapper",
        "h1.visually-hidden",
        "h3.visually-hidden",
        "noscript",
        "iframe",
        "link"
      ]);
      WebImporter.DOMUtils.remove(element, [".swiper-slide-duplicate"]);
      WebImporter.DOMUtils.remove(element, [
        ".swiper-pagination",
        ".swiper-progress-bar",
        ".swiper-notification"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-gtm");
      });
    }
  }

  // tools/importer/transformers/aristocrat-sections.js
  var H2 = { after: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === H2.after) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document: element.getRootNode() };
      const sections = [...template.sections].reverse();
      sections.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.append(sectionMetadata);
        }
        if (section.id !== template.sections[0].id && sectionEl.previousElementSibling) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-corporate": parse,
    "columns-stats": parse2,
    "columns-about": parse3,
    "cards-powerhouse": parse4,
    "cards-locations": parse5
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Aristocrat main homepage with hero, featured content, and corporate information",
    urls: [
      "https://www.aristocrat.com/"
    ],
    blocks: [
      {
        name: "hero-corporate",
        instances: [
          "section.block_hero_slider-wrapper .swiper-slide.swiper-slide-active"
        ]
      },
      {
        name: "columns-stats",
        instances: [
          "section.block_counter-wrapper .block_counter"
        ]
      },
      {
        name: "columns-about",
        instances: [
          "section.block_2columns-wrapper .row.justify-content-between"
        ]
      },
      {
        name: "cards-powerhouse",
        instances: [
          "section.block_cards_slider-wrapper .block_cards_slider"
        ]
      },
      {
        name: "cards-locations",
        instances: [
          "section.block_interactive_map-wrapper"
        ]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero",
        selector: "section.block_hero_slider-wrapper",
        style: null,
        blocks: ["hero-corporate"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Stats Counter",
        selector: "section.block_counter-wrapper",
        style: "dark",
        blocks: ["columns-stats"],
        defaultContent: [
          "section.block_counter-wrapper .block_header h2",
          "section.block_counter-wrapper .block_header h3"
        ]
      },
      {
        id: "section-3",
        name: "About Two Columns",
        selector: "section.block_2columns-wrapper",
        style: null,
        blocks: ["columns-about"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Cards Slider",
        selector: "section.block_cards_slider-wrapper",
        style: "dark",
        blocks: ["cards-powerhouse"],
        defaultContent: [
          "section.block_cards_slider-wrapper .block_header h2",
          "section.block_cards_slider-wrapper .block_header h3"
        ]
      },
      {
        id: "section-5",
        name: "World Map / Global Locations",
        selector: "section.block_interactive_map-wrapper",
        style: "dark",
        blocks: ["cards-locations"],
        defaultContent: [
          "section.block_interactive_map-wrapper .block_header h2"
        ]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
