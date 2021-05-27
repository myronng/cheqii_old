const VALID_PALETTE_MODES = ["light", "dark"];

export const parseError = (error) => {
  let result;
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      result = error.toString();
    } else {
      result = error.stack;
    }
  } else if (typeof error === "string") {
    result = error;
  }
  return result;
};

export const parsePaletteMode = (paletteMode) => {
  let result;
  if (!VALID_PALETTE_MODES.includes(paletteMode)) {
    if (paletteMode === "system" && typeof window !== "undefined") {
      // Don't use Mui useMediaQuery because SSG render will pollute client render with a memoized value
      result = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      result = "light";
    }
  } else {
    result = paletteMode;
  }
  return result;
};
