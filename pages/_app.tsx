import { CssBaseline } from "@material-ui/core";
import { createTheme, StyledEngineProvider, ThemeProvider } from "@material-ui/core/styles";
import { getApps, initializeApp } from "firebase/app";
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

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

if (!getApps().length) {
  initializeApp(FIREBASE_CONFIG);
}

const theme = (paletteMode: PaletteModeType) => {
  const parsedPaletteMode = parsePaletteMode(paletteMode);
  const themeObject = {
    components: {
      MuiButton: {
        styleOverrides: {
          label: {
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
      fontFamily: "Comfortaa, sans-serif",
      fontSize: 16,
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
    if (jssStyles) {
      const jssStylesParent = jssStyles.parentElement as HTMLHeadElement;
      jssStylesParent.removeChild(jssStyles);
    }

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
          <title>Check</title>
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
