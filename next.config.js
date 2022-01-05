const withPwa = require("next-pwa");

const config = {
  i18n: {
    locales: ["en-CA"],
    defaultLocale: "en-CA",
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  reactStrictMode: true,
  // swcMinify: true,
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
