import type { PaletteMode } from "@material-ui/core";
import { InputHTMLAttributes } from "react";

export type PaletteModeType = "dark" | "light" | "system" | "unknown";

const DARK_MODE: PaletteModeType = "dark";
const LIGHT_MODE: PaletteModeType = "light";
const SYSTEM_MODE: PaletteModeType = "system";
const UNKNOWN_MODE: PaletteModeType = "unknown";

type parseErrorType = (error: Error | string) => string;
type parseNumericValueType = (
  value: InputHTMLAttributes<HTMLInputElement>["defaultValue"]
) => number;
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

export const parseNumericValue: parseNumericValueType = (value) => {
  if (typeof value === "string") {
    return Number(value);
  } else if (typeof value === "number") {
    return value;
  } else if (Array.isArray(value)) {
    return Number(value.join(""));
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
