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
    swfMinify: true,
  },
  i18n: {
    locales: ["en-CA"],
    defaultLocale: "en-CA",
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  reactStrictMode: true,
};

module.exports =
  process.env.NODE_ENV === "development"
    ? config
    : withPwa({
        ...config,
        pwa: {
          dest: "public",
          disable: process.env.NODE_ENV === "development",
        },
      });
