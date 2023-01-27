import { CssBaseline } from "@mui/material";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { AuthContextProvider } from "components/AuthContextProvider";
import { ErrorBoundary } from "components/ErrorBoundary";
import { HashContextProvider } from "components/HashContextProvider";
import { LoadingContextProvider } from "components/LoadingContextProvider";
import { PaletteContextProvider, usePalette } from "components/PaletteContextProvider";
import { SnackbarContextProvider } from "components/SnackbarContextProvider";
import { SplashContextProvider } from "components/SplashContextProvider";
import { AppProps as BaseAppProps } from "next/app";
import { PropsWithChildren } from "react";
import { PaletteModeType } from "services/parser";

export type AppProps = BaseAppProps & {
  serverPaletteModeCookie: PaletteModeType;
};

type PaletteConsumerProps = PropsWithChildren<any>;

const App = ({ Component, pageProps, serverPaletteModeCookie }: AppProps) => {
  return (
    <StyledEngineProvider injectFirst>
      <PaletteContextProvider serverPaletteModeCookie={serverPaletteModeCookie}>
        <PaletteConsumer {...pageProps}>
          <Component {...pageProps} />
        </PaletteConsumer>
      </PaletteContextProvider>
    </StyledEngineProvider>
  );
};

export default App;

const PaletteConsumer = ({ children, ...pageProps }: PaletteConsumerProps) => {
  const { theme } = usePalette();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <ErrorBoundary {...pageProps}>
        <SplashContextProvider open={pageProps.reload}>
          <SnackbarContextProvider>
            <LoadingContextProvider>
              <AuthContextProvider auth={pageProps.auth} customToken={pageProps.customToken}>
                <HashContextProvider>{children}</HashContextProvider>
              </AuthContextProvider>
            </LoadingContextProvider>
          </SnackbarContextProvider>
        </SplashContextProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
