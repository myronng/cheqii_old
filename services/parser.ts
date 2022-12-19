import type { PaletteMode } from "@mui/material";
import { Currency, dinero, Dinero, toSnapshot } from "dinero.js";
import { getCurrencyType } from "services/locale";

export const DARK_MODE: PaletteModeType = "dark";
export const LIGHT_MODE: PaletteModeType = "light";
export const SYSTEM_MODE: PaletteModeType = "system";
export const UNKNOWN_MODE: PaletteModeType = "unknown";

type ApiRequestBody = Record<string, unknown>;
type IsNumber = (value: number) => boolean;
type IsNumericFormat = (locale: string, value: string, formatParts: string[]) => boolean;
type ParseCurrencyAmount = (locale: string, currency: Currency<number>, value: string) => number;
type ParseDefinedKeys = (object: Record<string, any>) => Record<string, any>;
type ParseDineroAmount = (dinero: Dinero<number>) => number;
type ParseDineroMap = (
  currency: Currency<number>,
  dineroMap: Map<number, Dinero<number>>,
  index: number
) => Dinero<number>;
type ParseError = (error: unknown) => unknown;
type ParseNumericFormat = (locale: string, value: string, min?: number, max?: number) => number;
type ParsePaletteMode = (paletteMode: PaletteModeType) => PaletteMode;
type ParseRatioAmount = (locale: string, value: string) => number;

export type PaletteModeType = "dark" | "light" | "system" | "unknown";

export const isNumber: IsNumber = (value) => !Number.isNaN(value) && Number.isFinite(value);

export const isNumericFormat: IsNumericFormat = (locale, value, formatParts) => {
  const currency = getCurrencyType(locale);
  const currencyFormatter = new Intl.NumberFormat(locale, {
    currency: currency.code,
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  // Use currency formatter with 5 digits to get all known permutations of number formatting
  const parts = currencyFormatter.formatToParts(11111.1);
  const validCharacters = [];
  for (const part of parts) {
    if (formatParts.includes(part.type)) {
      validCharacters.push(`\\${part.value}`);
    }
  }
  const validRegex = new RegExp(`^[${validCharacters.join("")}\\d]*$`);
  return validRegex.test(value);
};

export const parseCurrencyAmount: ParseCurrencyAmount = (locale, currency, value) => {
  if (typeof currency.base !== "number") {
    throw new Error("Invalid currency");
  }
  const unformattedCost = parseNumericFormat(
    locale,
    value,
    Number(process.env.NEXT_PUBLIC_CURRENCY_MIN),
    Number(process.env.NEXT_PUBLIC_CURRENCY_MAX)
  );
  return Math.round(unformattedCost * Math.pow(currency.base, currency.exponent));
};

export const parseDineroAmount: ParseDineroAmount = (dinero) => toSnapshot(dinero).amount;

export const parseDineroMap: ParseDineroMap = (currency, dineroMap, index) =>
  dineroMap.get(index) || dinero({ amount: 0, currency });

export const parseError: ParseError = (error) => {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production" || typeof error.stack === "undefined") {
      return error.toString();
    } else {
      return error.stack;
    }
  } else if (typeof error === "string") {
    return error;
  }
  return error;
};

export const parseNumericFormat: ParseNumericFormat = (locale, value, min, max) => {
  const currency = getCurrencyType(locale);
  const currencyFormatter = new Intl.NumberFormat(locale, {
    currency: currency.code,
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  // Use currency formatter with 5 digits to get all known permutations of number formatting
  const parts = currencyFormatter.formatToParts(11111.1);
  for (const part of parts) {
    if (
      part.type === "currency" ||
      part.type === "group" ||
      part.type === "literal" ||
      part.type === "percentSign" ||
      part.type === "unit"
    ) {
      value = value.replace(new RegExp(`\\${part.value}`, "g"), "");
    } else if (part.type === "decimal") {
      value = value.replace(new RegExp(`\\${part.value}`), ".");
    }
  }
  const numericValue = Number(value);
  const isAboveMinimum =
    typeof min === "undefined" || (typeof min === "number" && numericValue >= min);
  const isUnderMaximum =
    typeof max === "undefined" || (typeof max === "number" && numericValue <= max);
  if (isNumber(numericValue) && isAboveMinimum && isUnderMaximum) {
    return numericValue;
  }
  return 0;
};

export const parseObjectByKeys = (body: Record<string, any>, keys: string[]) =>
  Object.entries(body).reduce<Record<string, any>>((newBody, [key, value]) => {
    if (keys.includes(key) && Boolean(value)) {
      newBody[key] = value;
    }
    return newBody;
  }, {});

export const parsePaletteMode: ParsePaletteMode = (paletteMode) => {
  let result;
  if (paletteMode === SYSTEM_MODE) {
    if (typeof window !== "undefined") {
      // Don't use Mui useMediaQuery because SSG render will pollute client render with a memoized value
      result = window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_MODE : LIGHT_MODE;
    } else {
      result = LIGHT_MODE;
    }
  } else if (paletteMode === UNKNOWN_MODE) {
    result = LIGHT_MODE;
  } else {
    result = paletteMode;
  }
  return result;
};

export const parseRatioAmount: ParseRatioAmount = (locale, value) =>
  parseNumericFormat(
    locale,
    value,
    Number(process.env.NEXT_PUBLIC_RATIO_MIN),
    Number(process.env.NEXT_PUBLIC_RATIO_MAX)
  );
