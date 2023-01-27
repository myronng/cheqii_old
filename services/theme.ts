import { createTheme, darken, lighten } from "@mui/material/styles";
import { Comfortaa, Fira_Code } from "@next/font/google";
import { PaletteModeType, parsePaletteMode } from "services/parser";

export const comfortaa = Comfortaa({ subsets: ["latin"] });
export const firaCode = Fira_Code({ subsets: ["latin"] });

const BACKGROUND_DEFAULT_DARK_MODE = "#1c2841";
const BACKGROUND_DEFAULT_LIGHT_MODE = "#fff";
const BORDER_WIDTH = 2;
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
        default: background,
        paper: background,
        secondary:
          parsedPaletteMode === "dark"
            ? lighten(background, TONAL_OFFSET / 4)
            : darken(background, TONAL_OFFSET / 4),
      },
    },
    spacing: SPACING,
    tonalOffset: TONAL_OFFSET,
    typography: {
      htmlFontSize: 16,
      fontFamily: comfortaa.style.fontFamily,
      h1: {
        fontSize: "3rem",
        fontWeight: 500,
      },
      h2: {
        fontSize: "2rem",
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
