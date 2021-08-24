import { CAD } from "@dinero.js/currencies";
import { LocaleStrings } from "declarations";
import localeMaster from "locales/master.json";

type GetLocaleStrings = (localeCode: string, localeSubset: string[]) => LocaleStrings;

type LocaleMaster = {
  [key: string]: {
    [locale: string]: string;
  };
};

const CURRENCY_MAPPING = {
  "en-CA": CAD,
};

export const getCurrencyType = (locale: string) =>
  CURRENCY_MAPPING[locale as keyof typeof CURRENCY_MAPPING];

export const getLocaleStrings: GetLocaleStrings = (localeCode, localeSubset) => {
  const result: LocaleStrings = {};
  localeSubset.forEach(
    (localeItem) => (result[localeItem] = (localeMaster as LocaleMaster)[localeItem]?.[localeCode])
  );
  return result;
};
