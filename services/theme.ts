import { createTheme, darken, lighten } from "@mui/material/styles";
import { PaletteModeType, parsePaletteMode } from "services/parser";

const BACKGROUND_DEFAULT_DARK_MODE = "#1c2841";
const BACKGROUND_DEFAULT_LIGHT_MODE = "#ffffe8";
const BORDER_WIDTH = 2;
const PAPER_LIGHT_MODE = "#fff";
const SPACING = 8;
const TONAL_OFFSET = 0.2;

export const theme = (paletteMode: PaletteModeType) => {
  const parsedPaletteMode = parsePaletteMode(paletteMode);
  const background =
    parsedPaletteMode === "dark" ? BACKGROUND_DEFAULT_DARK_MODE : BACKGROUND_DEFAULT_LIGHT_MODE;
  const themeObject = {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderWidth: `${BORDER_WIDTH}px`,
            fontSize: "1rem",
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              borderWidth: `${BORDER_WIDTH}px`,
            },

            "&.Mui-disabled": {
              borderWidth: `${BORDER_WIDTH}px`,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderBottomWidth: `${BORDER_WIDTH}px`,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 700,
            textTransform: "none",
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
            borderWidth: `${BORDER_WIDTH}px`,

            "& legend": {
              marginLeft: `${SPACING}px`,
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderWidth: `${BORDER_WIDTH}px`,
            fontSize: "1rem",
            fontWeight: 700,
            textTransform: "none",
            "&.Mui-disabled": {
              borderWidth: `${BORDER_WIDTH}px`,
            },
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          groupedHorizontal: {
            "&:not(:first-of-type)": {
              borderLeftWidth: `${BORDER_WIDTH}px`,
              marginLeft: `-${BORDER_WIDTH}px`,
            },
          },
          groupedVertical: {
            "&:not(:first-of-type)": {
              borderTopWidth: `${BORDER_WIDTH}px`,
              marginTop: `-${BORDER_WIDTH}px`,
            },
          },
        },
      },
    },
    palette: {
      mode: parsedPaletteMode,
      primary: {
        main: "#1ccb49",
      },
      secondary: {
        main: "#f06292",
      },
      background: {
        dark: darken(background, TONAL_OFFSET),
        default: background,
        light: lighten(background, TONAL_OFFSET),
        paper: parsedPaletteMode === "dark" ? background : PAPER_LIGHT_MODE,
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
        fontSize: "1.25rem",
        lineHeight: 1.5,
      },
      h4: {
        fontSize: "1rem",
        fontWeight: 700,
        lineHeight: 1.5,
      },
      body1: {
        fontWeight: 500,
      },
      body2: {
        fontWeight: 500,
      },
      subtitle1: {
        fontSize: "0.9rem",
        fontWeight: 700,
        letterSpacing: 1,
      },
      subtitle2: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 32,
    },
  } as const;

  return createTheme(themeObject);
};
