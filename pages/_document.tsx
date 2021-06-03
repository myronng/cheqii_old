import { ServerStyleSheets } from "@material-ui/styles";
import BaseDocument, { DocumentContext, Html, Head, Main, NextScript } from "next/document";
import nookies from "nookies";
import { Children } from "react";

import type {
  AppContextType,
  AppInitialProps,
  AppPropsType,
  Enhancer,
  NextComponentType,
  RenderPageResult,
} from "next/dist/next-server/lib/utils";

export type AppType = NextComponentType<
  AppContextType,
  AppInitialProps,
  AppPropsType & { serverPaletteModeCookie: string }
>;
export type ComponentsEnhancer =
  | {
      enhanceApp?: Enhancer<AppType>;
      enhanceComponent?: Enhancer<NextComponentType>;
    }
  | Enhancer<NextComponentType>;
export type RenderPage = (
  options?: ComponentsEnhancer
) => RenderPageResult | Promise<RenderPageResult>;
export type DocumentProps = {
  renderType: string;
};

class Document extends BaseDocument<DocumentProps> {
  static async getInitialProps(context: DocumentContext) {
    const sheets = new ServerStyleSheets();
    const originalRenderPage = context.renderPage as RenderPage;

    context.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: AppType) => (props) =>
          sheets.collect(
            <App {...props} serverPaletteModeCookie={nookies.get(context).paletteMode} />
          ),
      });

    const initialProps = await BaseDocument.getInitialProps(context);

    return {
      ...initialProps,
      styles: [...Children.toArray(initialProps.styles), sheets.getStyleElement()],
      renderType: context?.req?.headers && Object.keys(context.req.headers).length ? "SSR" : "SSG",
    };
  }

  render() {
    return (
      <Html>
        <Head>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GANALYTICS_STREAM_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GANALYTICS_STREAM_ID}');`,
            }}
          />
          {/* <script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_GRECAPTCHA_SITE_KEY}`}
          /> */}
          <meta name="application-name" content="Check" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Check" />
          <meta name="description" content="Split payment calculator" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#002d3f" />
          <meta name="render-type" content={this.props.renderType} />
          <link rel="apple-touch-icon" sizes="180x180" href="/check/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/check/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/check/favicon-16x16.png" />
          <link rel="manifest" href="/check/site.webmanifest" />
          <link rel="mask-icon" href="/check/safari-pinned-tab.svg" color="#002d3f" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&amp;family=Fira+Code:wght@300..700&amp;display=swap"
          />
        </Head>
        <body>
          {/* <style>{`.grecaptcha-badge { visibility: hidden; }`}</style> */}
          {/* <!-- The core Firebase JS SDK is always required and must be listed first -->
          <script src="https://www.gstatic.com/firebasejs/8.6.2/firebase-app.js"></script>

          <!-- TODO: Add SDKs for Firebase products that you want to use
              https://firebase.google.com/docs/web/setup#available-libraries -->
          <script src="https://www.gstatic.com/firebasejs/8.6.2/firebase-analytics.js"></script>

          <script>
            // Your web app's Firebase configuration
            // For Firebase JS SDK v7.20.0 and later, measurementId is optional
            var firebaseConfig = {
              apiKey: "AIzaSyDhzkh3a1JmV9opy5v3votE4UEVt5joGOk",
              authDomain: "check-dev-74997.firebaseapp.com",
              projectId: "check-dev-74997",
              storageBucket: "check-dev-74997.appspot.com",
              messagingSenderId: "130128675839",
              appId: "1:130128675839:web:e178a614462c3288451dca",
              measurementId: "G-M3JPEZ5HDC"
            };
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            firebase.analytics();
          </script> */}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
