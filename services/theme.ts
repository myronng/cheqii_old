import { createTheme, darken, lighten } from "@mui/material/styles";
import { PaletteModeType, parsePaletteMode } from "services/parser";

const BACKGROUND_DEFAULT_DARK_MODE = "#1c2841";
const BACKGROUND_DEFAULT_LIGHT_MODE = "#ffffe0";
const TONAL_OFFSET = 0.2;
const SPACING = 8;

export const theme = (paletteMode: PaletteModeType) => {
  const parsedPaletteMode = parsePaletteMode(paletteMode);
  const themeObject = {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderWidth: "2px",
            fontSize: "1rem",
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              borderWidth: "2px",
            },

            "&.Mui-disabled": {
              borderWidth: "2px",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          outlined: {
            marginLeft: `${SPACING}px`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            margin: `0 ${SPACING}px`,
          },
          notchedOutline: {
            borderWidth: "2px",

            "& legend": {
              marginLeft: `${SPACING}px`,
            },
          },
        },
      },
    },
    palette: {
      mode: parsedPaletteMode,
      primary: {
        main: "#64e986",
      },
      secondary: {
        main: "#f06292",
      },
      background: {
        dark: darken(
          parsedPaletteMode === "dark"
            ? BACKGROUND_DEFAULT_DARK_MODE
            : BACKGROUND_DEFAULT_LIGHT_MODE,
          TONAL_OFFSET
        ),
        default:
          parsedPaletteMode === "dark"
            ? BACKGROUND_DEFAULT_DARK_MODE
            : BACKGROUND_DEFAULT_LIGHT_MODE,
        light: lighten(
          parsedPaletteMode === "dark"
            ? BACKGROUND_DEFAULT_DARK_MODE
            : BACKGROUND_DEFAULT_LIGHT_MODE,
          TONAL_OFFSET
        ),
      },
      tonalOffset: TONAL_OFFSET,
    },
    spacing: SPACING,
    typography: {
      htmlFontSize: 16,
      fontFamily: "Comfortaa, sans-serif",
      h1: {
        fontSize: "3rem",
        fontWeight: 500,
        marginBottom: 16,
      },
      h2: {
        fontSize: "1.5rem",
        marginBottom: 16,
      },
      h3: {
        fontSize: "1.5rem",
        fontFamily: "Fira Code",
      },
      h4: {
        fontSize: "2.5rem",
        fontFamily: "Fira Code",
      },
      h6: {
        fontSize: "1.25rem",
        fontWeight: 500,
      },
      body1: {
        fontWeight: 500,
      },
      subtitle1: {
        fontSize: "0.9rem",
        fontWeight: 700,
        letterSpacing: 1,
        lineHeight: 1,
      },
    },
    shape: {
      borderRadius: 32,
    },
  } as const;

  return createTheme(themeObject);
};
