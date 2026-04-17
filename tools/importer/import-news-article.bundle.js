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

  // tools/importer/import-news-article.js
  var import_news_article_exports = {};
  __export(import_news_article_exports, {
    default: () => import_news_article_default
  });

  // tools/importer/transformers/news-article.js
  var H = { before: "beforeTransform", after: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === H.before) {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        "#truste-consent-track",
        "#truste-consent-content",
        "#truste-consent-required",
        "#page-load",
        ".cookie-notice",
        '[class*="cookie"]',
        '[id*="cookie"]',
        '[id*="cf-"]',
        ".cf-turnstile",
        "[data-sitekey]",
        "#onetrust-consent-sdk",
        ".evidon-consent"
      ]);
    }
    if (hookName === H.after) {
      const { document } = payload;
      WebImporter.DOMUtils.remove(element, [
        "header.navbar",
        "footer.bg-primary",
        "a.visually-hidden-focusable",
        ".share-price-wrapper",
        "h3.visually-hidden",
        "h1.visually-hidden",
        "noscript",
        "link",
        ".nav-wrapper",
        ".logo-wrapper"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".post-share svg",
        ".post-share .share-icon",
        ".post-share a"
      ]);
      const meta = {};
      const h1 = element.querySelector("h1.entry-title");
      if (h1) {
        meta.title = h1.textContent.trim();
      }
      const dateEl = element.querySelector(".post-date time");
      if (dateEl) {
        meta["publication-date"] = dateEl.textContent.trim();
      }
      const catEl = element.querySelector("h6.subheading");
      if (catEl) {
        meta.category = catEl.textContent.trim();
      }
      meta.template = "news-article";
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        meta.description = ogDesc.getAttribute("content");
      }
      if (payload) {
        payload.meta = __spreadValues(__spreadValues({}, payload.meta), meta);
      }
    }
  }

  // tools/importer/transformers/aristocrat-cleanup.js
  var H2 = { before: "beforeTransform", after: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === H2.before) {
      WebImporter.DOMUtils.remove(element, [
        "#consent_blackbar",
        "#truste-consent-track",
        "#truste-consent-content"
      ]);
      WebImporter.DOMUtils.remove(element, ["#page-load"]);
    }
    if (hookName === H2.after) {
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
      element.querySelectorAll("p").forEach((p) => {
        if (p.textContent.includes("May we use cookies to track your activities")) {
          p.remove();
        }
      });
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-gtm");
      });
    }
  }

  // tools/importer/import-news-article.js
  var transformers = [
    transform2,
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "news-article",
    description: "News article / press release \u2014 single-column layout with H1 title, date, category tag, body paragraphs with optional images, and boilerplate closing",
    blocks: [],
    sections: [
      {
        id: "section-1",
        name: "Article Content",
        selector: "main#primary .container-lg",
        style: null,
        blocks: [],
        defaultContent: ["h1", "h6", ".date", ".page-content p", ".page-content h2", ".page-content img"]
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
  var import_news_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      let pubDate = "";
      let category = "";
      const dateP = main.querySelector("h1 + p");
      if (dateP && dateP.textContent.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/)) {
        pubDate = dateP.textContent.trim();
      }
      const catH6 = main.querySelector("h6");
      if (catH6) {
        category = catH6.textContent.trim();
      }
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const tables = main.querySelectorAll("table");
      let metaTable = null;
      tables.forEach((t) => {
        const firstCell = t.querySelector("tr td, th");
        if (firstCell && firstCell.textContent.trim().toLowerCase() === "metadata") {
          metaTable = t;
        }
      });
      if (!metaTable) {
        const divMeta = main.querySelector(".metadata");
        if (divMeta) metaTable = divMeta;
      }
      if (metaTable) {
        const addMetaRow = (key, value) => {
          if (!value) return;
          if (metaTable.tagName === "TABLE") {
            const tbody = metaTable.querySelector("tbody") || metaTable;
            const row = document.createElement("tr");
            const kc = document.createElement("td");
            kc.textContent = key;
            const vc = document.createElement("td");
            vc.textContent = value;
            row.appendChild(kc);
            row.appendChild(vc);
            tbody.appendChild(row);
          } else {
            const row = document.createElement("div");
            const kd = document.createElement("div");
            kd.textContent = key;
            const vd = document.createElement("div");
            vd.textContent = value;
            row.appendChild(kd);
            row.appendChild(vd);
            metaTable.appendChild(row);
          }
        };
        addMetaRow("template", "news-article");
        addMetaRow("publication-date", pubDate);
        addMetaRow("category", category);
      }
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_news_article_exports);
})();
