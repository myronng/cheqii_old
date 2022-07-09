import BaseDocument, { Html, Head, Main, NextScript } from "next/document";
import { parseCookies } from "nookies";

export type DocumentProps = {
  renderType: string;
};

class Document extends BaseDocument<DocumentProps> {
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
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="icon" href="/icon.svg" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="mask-icon.svg" color="#1ccb49" />
          <meta name="application-name" content="Cheqii" />
          <meta name="description" content="Split payment calculator" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#1ccb49" />
          <meta name="render-type" content={this.props.renderType} />
        </Head>
        <body>
          {/* <style>{`.grecaptcha-badge { visibility: hidden; }`}</style> */}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

Document.getInitialProps = async (context) => {
  const originalRenderPage = context.renderPage;

  context.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) => {
        const EnhancedApp = (props: any) => (
          <App {...props} serverPaletteModeCookie={parseCookies(context).paletteMode} />
        );
        return EnhancedApp;
      },
    });

  const initialProps = await BaseDocument.getInitialProps(context);

  return {
    ...initialProps,
    renderType: context?.req?.headers && Object.keys(context.req.headers).length ? "SSR" : "SSG",
  };
};

export default Document;
