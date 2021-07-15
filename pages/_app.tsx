import { CssBaseline } from "@material-ui/core";
import {
  createTheme,
  responsiveFontSizes,
  StyledEngineProvider,
  ThemeProvider,
} from "@material-ui/core/styles";
import { AppProps as BaseAppProps } from "next/app";
import Head from "next/head";
import { parseCookies, setCookie } from "nookies";
import { useEffect, useMemo, useReducer } from "react";
import { PaletteModeType, parsePaletteMode } from "services/parser";
import { AuthContextProvider } from "utilities/AuthContextProvider";
import { LoadingContextProvider } from "utilities/LoadingContextProvider";
import { SnackbarContextProvider } from "utilities/SnackbarContextProvider";

export type AppProps = BaseAppProps & {
  serverPaletteModeCookie: PaletteModeType;
};

const theme = (paletteMode: PaletteModeType) => {
  const parsedPaletteMode = parsePaletteMode(paletteMode);
  const themeObject = {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
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
        default: parsedPaletteMode === "dark" ? "#1c2841" : "#fefdfa",
        secondary: parsedPaletteMode === "dark" ? "#212121" : "#e0e0e0",
      },
    },
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
      body1: {
        fontWeight: 500,
      },
      subtitle1: {
        fontSize: "0.8rem;",
        fontWeight: 700,
        lineHeight: 1,
      },
    },
    shape: {
      borderRadius: 32,
    },
  } as const;

  return createTheme(themeObject);
};

const App = ({ Component, pageProps, serverPaletteModeCookie }: AppProps) => {
  const clientPaletteModeCookie = parseCookies({}).paletteMode as PaletteModeType;
  let renderType;
  if (typeof window !== "undefined") {
    const metaRenderType = document.head.querySelector(
      'meta[name="render-type"]'
    ) as HTMLMetaElement;
    renderType = metaRenderType.content;
  }
  const initializedPaletteMode = serverPaletteModeCookie || clientPaletteModeCookie;
  const [paletteMode, setPaletteMode] = useReducer(
    (_state: PaletteModeType, action: PaletteModeType) => {
      const paletteModeExpiryDate = new Date();
      paletteModeExpiryDate.setFullYear(paletteModeExpiryDate.getFullYear() + 10);
      setCookie({}, "paletteMode", action, {
        maxAge: (paletteModeExpiryDate.getTime() - new Date().getTime()) / 1000,
        path: "/",
        sameSite: "strict",
        secure: window.location.protocol === "https:",
      });
      return action;
    },
    renderType !== "SSG" && initializedPaletteMode !== "system" ? initializedPaletteMode : "unknown"
  );

  const appTheme = useMemo(
    () => responsiveFontSizes(theme(paletteMode), { factor: 3 }),
    [paletteMode]
  );

  useEffect(() => {
    if (typeof clientPaletteModeCookie === "undefined") {
      setPaletteMode("system");
    } else if (clientPaletteModeCookie !== paletteMode) {
      setPaletteMode(clientPaletteModeCookie);
    }
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Head>
          <title>Cheqii</title>
          <meta name="color-scheme" content={appTheme.palette.mode} key="colorScheme" />
        </Head>
        <SnackbarContextProvider>
          <LoadingContextProvider>
            <AuthContextProvider
              auth={pageProps.auth}
              // fetchSite={pageProps.fetchSite}
            >
              <Component {...pageProps} />
            </AuthContextProvider>
          </LoadingContextProvider>
        </SnackbarContextProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
