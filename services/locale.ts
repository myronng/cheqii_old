import { CAD, Currency } from "@dinero.js/currencies";
import localeMaster from "locales/master.json";

export type LocaleStrings = {
  [key: string]: string;
};

type GetCurrencyType = (locale: string) => Currency<number>;

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
