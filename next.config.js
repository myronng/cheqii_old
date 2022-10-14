const withPwa = require("next-pwa");

const config = {
  experimental: {
    modularizeImports: {
      "@mui/icons-material": {
        transform: "@mui/icons-material/{{member}}",
      },
      "@mui/lab": {
        transform: "@mui/lab/{{member}}",
      },
      "@mui/material": {
        transform: "@mui/material/{{member}}",
      },
    },
  },
  i18n: {
    locales: ["en-CA"],
    defaultLocale: "en-CA",
  },
  images: {
    domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withPwa({
  cacheStartUrl: false,
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  dynamicStartUrlRedirect: true,
  runtimeCaching: [
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-audio-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-video-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-data",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:json|xml|csv)$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "static-data-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        if (!isSameOrigin) return false;
        const pathname = url.pathname;
        // Exclude /api/auth/callback/* to fix OAuth workflow in Safari without impact other environment
        // Above route is default for next-auth, you may need to change it if your OAuth workflow has a different callback route
        // Issue: https://github.com/shadowwalker/next-pwa/issues/131#issuecomment-821894809
        if (pathname.startsWith("/api/auth/")) return false;
        if (pathname.startsWith("/api/")) return true;
        return false;
      },
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "apis",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10, // fall back to cache if api does not response within 10 seconds
      },
    },
    {
      urlPattern: ({ url }) => {
        const isSameOrigin = self.origin === url.origin;
        return !isSameOrigin;
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "cross-origin",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Handles all remaining paths
    {
      urlPattern: () => true,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})(config);
