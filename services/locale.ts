import { CAD, Currency } from "@dinero.js/currencies";
import localeMaster from "locales/master.json";
import { NextRouter } from "next/router";

export type LocaleStrings = {
  [key: string]: string;
};

type GetCurrencyType = (locale: string) => Currency<number>;

type GetLocale = (router: NextRouter) => string;

type GetLocaleStrings = (localeSubset: string[], localeCode?: string) => LocaleStrings;

type LocaleMaster = {
  [key: string]: {
    [locale: string]: string;
  };
};

const CURRENCY_MAPPING = {
  "en-CA": CAD,
};

export const getCurrencyType: GetCurrencyType = (locale) =>
  CURRENCY_MAPPING[locale as keyof typeof CURRENCY_MAPPING];

export const getLocaleStrings: GetLocaleStrings = (localeSubset, localeCode) => {
  const result: LocaleStrings = {};
  localeSubset.forEach(
    (localeItem) =>
      (result[localeItem] = (localeMaster as LocaleMaster)[localeItem]?.[localeCode || "en-CA"])
  );
  return result;
};

export const getLocale: GetLocale = (router) =>
  router.locale ?? router.defaultLocale ?? router.locales?.[0] ?? "en-CA";
