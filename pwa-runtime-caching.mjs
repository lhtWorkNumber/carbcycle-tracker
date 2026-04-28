const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-images",
      expiration: {
        maxEntries: 96,
        maxAgeSeconds: 7 * 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: /\/_next\/image\?url=.+$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "next-image",
      expiration: {
        maxEntries: 96,
        maxAgeSeconds: 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: /\.(?:js|css)$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-assets",
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: /\/api\/food-items$/i,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "food-database",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60
      },
      networkTimeoutSeconds: 4
    }
  },
  {
    urlPattern: /\/api\/barcode\/.+$/i,
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "barcode-lookups",
      expiration: {
        maxEntries: 24,
        maxAgeSeconds: 24 * 60 * 60
      },
      networkTimeoutSeconds: 6
    }
  },
  {
    urlPattern: ({ url }) => url.origin === self.origin && url.pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "api-runtime",
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60
      },
      networkTimeoutSeconds: 8
    }
  },
  {
    urlPattern: ({ url }) => url.origin === self.origin && !url.pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-runtime",
      expiration: {
        maxEntries: 48,
        maxAgeSeconds: 24 * 60 * 60
      },
      networkTimeoutSeconds: 8
    }
  }
];

export default runtimeCaching;
