import { CssBaseline } from "@material-ui/core";
import { createTheme, StyledEngineProvider, ThemeProvider } from "@material-ui/core/styles";
import Head from "next/head";
import nookies from "nookies";
import { useEffect, useMemo, useReducer } from "react";
import { parsePaletteMode } from "services/parser";
import { LoadingContextProvider } from "utilities/LoadingContextProvider";
import { SnackbarContextProvider } from "utilities/SnackbarContextProvider";

import type { AppProps as BaseAppProps } from "next/app";
import type { PaletteModeType } from "services/parser";

export type AppProps = BaseAppProps & {
  serverPaletteModeCookie: PaletteModeType;
};

declare module "@material-ui/core/styles/createPalette" {
  export interface TypeBackground {
    secondary?: string;
  }
}

const theme = (paletteMode: PaletteModeType) => {
  const parsedPaletteMode = parsePaletteMode(paletteMode);
  const themeObject = {
    palette: {
      mode: parsedPaletteMode,
      primary: {
        main: "#03a9f4",
      },
      secondary: {
        main: "#f06292",
      },
      background: {
        secondary: parsedPaletteMode === "dark" ? "#212121" : "#e0e0e0",
      },
    },
    typography: {
      fontFamily: "Quicksand, sans-serif",
      fontSize: 16,
      h1: {
        fontSize: "5rem",
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
        fontSize: "1.25rem",
        fontWeight: 400,
      },
      subtitle2: {
        fontSize: "1.15rem",
      },
    },
  };

  return createTheme(themeObject);
};

const App = ({ Component, pageProps, serverPaletteModeCookie }: AppProps) => {
  const clientPaletteModeCookie = nookies.get({}).paletteMode as PaletteModeType;
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
      nookies.set({}, "paletteMode", action, {
        maxAge: (paletteModeExpiryDate.getTime() - new Date().getTime()) / 1000,
        path: "/",
        sameSite: "strict",
        secure: window.location.protocol === "https:",
      });
      return action;
    },
    renderType !== "SSG" && initializedPaletteMode !== "system" ? initializedPaletteMode : "unknown"
  );

  const appTheme = useMemo(() => theme(paletteMode), [paletteMode]);

  useEffect(() => {
    const jssStyles = document.getElementById("jss-server-side") as HTMLStyleElement;
    const jssStylesParent = jssStyles.parentElement as HTMLHeadElement;
    jssStylesParent.removeChild(jssStyles);

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
          <title>Myron Ng</title>
          <meta name="color-scheme" content={appTheme.palette.mode} key="colorScheme" />
        </Head>
        <SnackbarContextProvider {...pageProps}>
          <LoadingContextProvider>
            <Component {...pageProps} />
          </LoadingContextProvider>
        </SnackbarContextProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
