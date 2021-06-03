import { PaletteMode } from "@material-ui/core";

export type PaletteModeType = "dark" | "light" | "system" | "unknown";

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
  if (paletteMode === "system") {
    if (typeof window !== "undefined") {
      // Don't use Mui useMediaQuery because SSG render will pollute client render with a memoized value
      result = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? ("dark" as const)
        : ("light" as const);
    } else {
      result = "light" as const;
    }
  } else if (paletteMode === "unknown") {
    result = "light" as const;
  } else {
    result = paletteMode;
  }
  return result;
};
