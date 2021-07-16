import type { PaletteMode } from "@material-ui/core";

export type PaletteModeType = "dark" | "light" | "system" | "unknown";

const DARK_MODE: PaletteModeType = "dark";
const LIGHT_MODE: PaletteModeType = "light";
const SYSTEM_MODE: PaletteModeType = "system";
const UNKNOWN_MODE: PaletteModeType = "unknown";

export const parseError = (error: Error | string): string => {
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

export const parsePaletteMode = (paletteMode: PaletteModeType): PaletteMode => {
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
