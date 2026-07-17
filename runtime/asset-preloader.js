/**
 * @file DyniPlugin Asset Preloader - Preloads declared component assets and exposes runtime asset lookup
 * Documentation: documentation/architecture/asset-system.md
 */
(function (root) {
  "use strict";

  const runtime = /** @type {DyniRuntimeNamespace} */ (root.DyniPlugin.runtime);

  /** @param {unknown} baseUrl @returns {DyniAssetPreloader} */
  function createAssetPreloader(baseUrl) {
    if (typeof baseUrl !== "string" || !baseUrl) {
      throw new Error("dyninstruments: baseUrl missing before runtime/asset-preloader.js load");
    }

    const cache = new Map();

    /** @param {string} relativePath @returns {string} */
    function resolveAssetUrl(relativePath) {
      return baseUrl + relativePath;
    }

    /** @param {unknown} asset @returns {DyniAssetDeclaration} */
    function validateAssetDeclaration(asset) {
      if (!asset || typeof asset !== "object") {
        throw new Error("dyninstruments: asset declaration must be an object");
      }
      const declaration = /** @type {Record<string, unknown>} */ (asset);

      if (typeof declaration.key !== "string" || !declaration.key) {
        throw new Error("dyninstruments: asset declaration missing key");
      }

      if (typeof declaration.path !== "string" || !declaration.path) {
        throw new Error("dyninstruments: asset declaration missing path for key " + declaration.key);
      }

      if (typeof declaration.type !== "string" || !declaration.type) {
        throw new Error("dyninstruments: asset declaration missing type for key " + declaration.key);
      }

      if (
        declaration.type !== "svg" &&
        declaration.type !== "image" &&
        declaration.type !== "audio" &&
        declaration.type !== "json" &&
        declaration.type !== "font"
      ) {
        throw new Error("dyninstruments: unsupported asset type '" + declaration.type + "' for key " + declaration.key);
      }

      return /** @type {DyniAssetDeclaration} */ (asset);
    }

    /** @param {unknown} response @param {string} url @param {DyniAssetType} type @returns {DyniAssetFetchResponse} */
    function checkResponseOk(response, url, type) {
      if (!response) {
        throw new Error("dyninstruments: empty response while loading " + type + " asset from " + url);
      }
      const candidate = /** @type {Record<string, unknown>} */ (response);

      if (typeof candidate.ok === "boolean" && !candidate.ok) {
        throw new Error("dyninstruments: failed to load " + type + " asset from " + url);
      }

      if (typeof candidate.status === "number" && (candidate.status < 200 || candidate.status >= 300)) {
        throw new Error("dyninstruments: failed to load " + type + " asset from " + url);
      }

      return /** @type {DyniAssetFetchResponse} */ (response);
    }

    /** @param {string} url @returns {Promise<unknown>} */
    function loadSvg(url) {
      const fetchFn = root.fetch;
      if (typeof fetchFn !== "function") {
        throw new Error("dyninstruments: fetch is required to preload svg assets");
      }

      return fetchFn(url)
        .then(function (response) {
          return checkResponseOk(response, url, "svg").text();
        });
    }

    /** @param {string} url @returns {Promise<unknown>} */
    function loadAudio(url) {
      const fetchFn = root.fetch;
      if (typeof fetchFn !== "function") {
        throw new Error("dyninstruments: fetch is required to preload audio assets");
      }

      return fetchFn(url)
        .then(function (response) {
          return checkResponseOk(response, url, "audio").arrayBuffer();
        });
    }

    /** @param {string} url @returns {Promise<unknown>} */
    function loadJson(url) {
      const fetchFn = root.fetch;
      if (typeof fetchFn !== "function") {
        throw new Error("dyninstruments: fetch is required to preload json assets");
      }

      return fetchFn(url)
        .then(function (response) {
          return checkResponseOk(response, url, "json").json();
        });
    }

    /** @param {string} url @returns {Promise<unknown>} */
    function loadImage(url) {
      const ImageCtor = root.Image;
      if (typeof ImageCtor !== "function") {
        throw new Error("dyninstruments: Image is required to preload image assets");
      }

      return new Promise(function (resolve, reject) {
        const img = new ImageCtor();
        img.onload = function () {
          resolve(img);
        };
        img.onerror = function (error) {
          reject(error || new Error("dyninstruments: failed to load image asset from " + url));
        };
        img.src = url;
      });
    }

    /** @param {string} url @param {string} key @returns {Promise<unknown>} */
    function loadFont(url, key) {
      const fetchFn = root.fetch;
      if (typeof fetchFn !== "function") {
        throw new Error("dyninstruments: fetch is required to preload font assets");
      }

      return fetchFn(url)
        .then(function (response) {
          return checkResponseOk(response, url, "font").arrayBuffer();
        })
        .then(function (buffer) {
          const FontFaceCtor = root.FontFace;
          if (typeof FontFaceCtor !== "function") {
            throw new Error("dyninstruments: FontFace is required to preload font assets");
          }

          const face = new FontFaceCtor(key, /** @type {BufferSource} */ (buffer));
          const fonts = root.document && root.document.fonts;
          if (!fonts || typeof fonts.add !== "function") {
            throw new Error("dyninstruments: document.fonts.add is required to preload font assets");
          }

          fonts.add(face);
          return face;
        });
    }

    /** @param {DyniAssetDeclaration} asset @returns {Promise<unknown>} */
    function loadAsset(asset) {
      const url = resolveAssetUrl(asset.path);
      switch (asset.type) {
        case "svg":
          return loadSvg(url);
        case "image":
          return loadImage(url);
        case "audio":
          return loadAudio(url);
        case "json":
          return loadJson(url);
        case "font":
          return loadFont(url, asset.key);
        default:
          throw new Error("dyninstruments: unsupported asset type '" + asset.type + "' for key " + asset.key);
      }
    }

    /** @param {DyniAssetDeclaration} asset @returns {Promise<unknown>} */
    function preloadOne(asset) {
      const url = resolveAssetUrl(asset.path);
      if (cache.has(asset.key)) {
        throw new Error("dyninstruments: duplicate asset key '" + asset.key + "'");
      }

      cache.set(asset.key, {
        status: "pending",
        type: asset.type,
        value: null
      });

      return loadAsset(asset)
        .then(function (value) {
          cache.set(asset.key, {
            status: "loaded",
            type: asset.type,
            value: value
          });
          return value;
        })
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Known asset preload failures degrade to null after logging so widgets can fall back gracefully.
        .catch(function (error) {
          cache.set(asset.key, {
            status: "failed",
            type: asset.type,
            value: null
          });
          console.warn("dyninstruments: failed to preload asset '" + asset.key + "' from " + url + ":", error);
          return null;
        });
    }

    /** @param {unknown} assetDeclarations @returns {Promise<unknown[]>} */
    function preloadAssets(assetDeclarations) {
      if (!Array.isArray(assetDeclarations)) {
        throw new Error("dyninstruments: asset declarations must be an array");
      }

      return Promise.all(assetDeclarations.map(function (asset) {
        return preloadOne(validateAssetDeclaration(asset));
      }));
    }

    /** @param {string} key @returns {unknown} */
    function getAsset(key) {
      const record = cache.get(key);
      if (!record) {
        throw new Error("dyninstruments: unknown asset key '" + key + "'");
      }
      if (record.status === "failed") {
        return null;
      }
      return record.value;
    }

    return {
      preloadAssets: preloadAssets,
      getAsset: getAsset
    };
  }

  runtime.createAssetPreloader = createAssetPreloader;
}(this));
