import { CssBaseline } from "@material-ui/core";
import { createTheme, StyledEngineProvider, ThemeProvider } from "@material-ui/core/styles";
import type { AppProps } from "next/app";
import Head from "next/head";
import nookies from "nookies";
import { useEffect, useMemo, useReducer } from "react";
import { parsePaletteMode } from "services/parser";
import { LoadingContextProvider } from "utilities/LoadingContextProvider";
import { SnackbarContextProvider } from "utilities/SnackbarContextProvider";

const theme = (paletteMode) => {
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
      background: {},
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
  if (parsedPaletteMode === "dark") {
    themeObject.palette.background.secondary = "#212121";
  } else {
    themeObject.palette.background.secondary = "#e0e0e0";
  }

  return createTheme(themeObject);
};

const Page = ({ Component, pageProps, serverPaletteModeCookie }: AppProps) => {
  const clientPaletteModeCookie = nookies.get({}).paletteMode;
  const renderType =
    typeof window !== "undefined" &&
    document.head.querySelector('meta[name="render-type"]').content;
  const initializedPaletteMode = serverPaletteModeCookie || clientPaletteModeCookie;
  const [paletteMode, setPaletteMode] = useReducer(
    (_state, action) => {
      const paletteModeExpiryDate = new Date();
      paletteModeExpiryDate.setFullYear(paletteModeExpiryDate.getFullYear() + 10);
      nookies.set({}, "paletteMode", action, {
        maxAge: (paletteModeExpiryDate - new Date().getTime()) / 1000,
        path: "/",
        sameSite: "strict",
        secure: window.location.protocol === "https:",
      });
      return action;
    },
    renderType !== "SSG" && initializedPaletteMode !== "system" ? initializedPaletteMode : ""
  );

  const appTheme = useMemo(() => theme(paletteMode), [paletteMode]);

  useEffect(() => {
    const jssStyles = document.getElementById("jss-server-side");
    jssStyles?.parentElement.removeChild(jssStyles);

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

export default Page;
