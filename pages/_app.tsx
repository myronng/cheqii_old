import { CssBaseline } from "@mui/material";
import { responsiveFontSizes, StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { AuthContextProvider } from "components/AuthContextProvider";
import { ErrorBoundary } from "components/ErrorBoundary";
import { LoadingContextProvider } from "components/LoadingContextProvider";
import { SnackbarContextProvider } from "components/SnackbarContextProvider";
import { AppProps as BaseAppProps } from "next/app";
import { parseCookies, setCookie } from "nookies";
import { useEffect, useMemo, useReducer } from "react";
import { PaletteModeType } from "services/parser";
import "services/styles.css";
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
        secure: true,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <CssBaseline enableColorScheme />
        <ErrorBoundary {...pageProps}>
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
        </ErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
