const withPwa = require("next-pwa");

module.exports = withPwa({
  i18n: {
    locales: ["en-CA"],
    defaultLocale: "en-CA",
  },
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
  },
  reactStrictMode: true,
});
