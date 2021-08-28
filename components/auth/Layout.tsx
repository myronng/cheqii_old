import { Typography } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { AuthProviders, LinkedAuthProvider, PROVIDERS } from "components/auth/AuthProviders";
import { DividerText } from "components/auth/DividerText";
import {
  EmailProvider,
  EmailProviderProps,
  LinkedEmailProvider,
} from "components/auth/EmailProvider";
import { Splash } from "components/Splash";
import { BaseProps } from "declarations";
import { OAuthCredential } from "firebase/auth";
import { useState } from "react";

type AuthLayoutProps = BaseProps & EmailProviderProps;

export type LayoutViewOptions = {
  data?: {
    credential: OAuthCredential;
    email: string;
    existingProvider?: keyof typeof PROVIDERS;
    newProvider: keyof typeof PROVIDERS;
  };
  type: "default" | "password" | "provider";
};

export const AuthLayout = styled((props: AuthLayoutProps) => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<LayoutViewOptions>({
    type: "default",
  });

  let renderView;
  const isDataDefined = typeof view.data !== "undefined";
  if (view.type === "provider" && isDataDefined) {
    renderView = (
      <LinkedAuthProvider
        setLoading={setLoading}
        setView={setView}
        strings={props.strings}
        view={view as Required<LayoutViewOptions>}
      />
    );
  } else if (view.type === "password" && isDataDefined) {
    renderView = (
      <LinkedEmailProvider
        setView={setView}
        strings={props.strings}
        view={view as Required<LayoutViewOptions>}
      />
    );
  } else {
    renderView = (
      <>
        <Typography className="Layout-title" variant="h1">
          {props.title}
        </Typography>
        <DividerText clipping={3}>{props.strings["withAProvider"]}</DividerText>
        <AuthProviders setLoading={setLoading} setView={setView} />
        <DividerText clipping={3}>{props.strings["orByEmail"]}</DividerText>
        <EmailProvider mode={props.mode} strings={props.strings} title={props.title} />
        {props.children}
      </>
    );
  }

  return (
    <>
      <main className={props.className}>
        <div className="Layout-root">
          {renderView}
          <div className="Layout-filler" />
        </div>
      </main>
      <Splash open={loading} />
    </>
  );
})`
  ${({ theme }) => `
    align-items: center;
    display: flex;
    height: 100vh;
    justify-content: center;
    padding: ${theme.spacing(4, 4, 0, 4)};

    & .Layout-root {
      display: flex;
      flex-direction: column;
      // Use margin: auto; instead of justify-content: center; for overflow issues
      margin: auto;
      min-width: 256px;

      ${theme.breakpoints.up("xs")} {
        width: 100%;
      }
      ${theme.breakpoints.up("sm")} {
        width: 512px;
      }

      & .Divider-root {
        ${theme.breakpoints.up("xs")} {
          margin: ${theme.spacing(2, 0)};
        }
        ${theme.breakpoints.up("md")} {
          margin: ${theme.spacing(4, 0)};
        }
      }

      & .Layout-filler {
        padding-top: ${theme.spacing(4)};
      }

      & .Layout-title {
        margin: 0;
        text-align: center;
      }
    }
  `}
`;
