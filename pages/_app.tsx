import { CssBaseline } from "@mui/material";
import { responsiveFontSizes, StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { AppProps as BaseAppProps } from "next/app";
import ErrorPage from "next/error";
import Head from "next/head";
import { parseCookies, setCookie } from "nookies";
import { useEffect, useMemo, useReducer } from "react";
import { PaletteModeType } from "services/parser";
import { AuthContextProvider } from "utilities/AuthContextProvider";
import { LoadingContextProvider } from "utilities/LoadingContextProvider";
import { SnackbarContextProvider } from "utilities/SnackbarContextProvider";
import { theme } from "services/theme";

export type AppProps = BaseAppProps & {
  serverPaletteModeCookie: PaletteModeType;
};

const App = ({ Component, pageProps, serverPaletteModeCookie }: AppProps) => {
  const clientPaletteModeCookie = parseCookies(undefined).paletteMode as PaletteModeType;
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
      setCookie(undefined, "paletteMode", action, {
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

  return pageProps.message ? (
    <ErrorPage {...pageProps} />
  ) : (
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
