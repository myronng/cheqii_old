import type { PaletteMode } from "@material-ui/core";
import { toUnit } from "dinero.js";
import { getCurrencyType } from "services/locale";

export type PaletteModeType = "dark" | "light" | "system" | "unknown";

const DARK_MODE: PaletteModeType = "dark";
const LIGHT_MODE: PaletteModeType = "light";
const SYSTEM_MODE: PaletteModeType = "system";
const UNKNOWN_MODE: PaletteModeType = "unknown";

type parseErrorType = (error: Error | string) => string;
type parseNumericValueType = (locale: string, value?: string) => number;
type parsePaletteModeType = (paletteMode: PaletteModeType) => PaletteMode;

export const parseError: parseErrorType = (error) => {
  let result;
  if (typeof error === "string") {
    result = error;
  } else if (process.env.NODE_ENV === "production" || typeof error.stack === "undefined") {
    result = error.toString();
  } else {
    result = error.stack;
  }
  return result;
};

export const parseNumericValue: parseNumericValueType = (locale, value) => {
  if (typeof value !== "undefined") {
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
    if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return 0;
};

export const parsePaletteMode: parsePaletteModeType = (paletteMode) => {
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
