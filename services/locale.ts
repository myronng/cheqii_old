import { CAD } from "@dinero.js/currencies";

const CURRENCY_MAPPING = {
  "en-CA": CAD,
};

export const getCurrencyType = (locale: string) =>
  CURRENCY_MAPPING[locale as keyof typeof CURRENCY_MAPPING];
