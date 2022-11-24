import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AuthProviders, LinkedAuthProvider } from "components/auth/AuthProviders";
import { DividerText } from "components/auth/DividerText";
import {
  EmailProvider,
  EmailProviderProps,
  LinkedEmailProvider,
} from "components/auth/EmailProvider";
import { Header } from "components/auth/Header";
import { useSplash } from "components/SplashContextProvider";
import { BaseProps } from "declarations";
import { OAuthCredential } from "firebase/auth";
import { useEffect, useState } from "react";

type AuthLayoutProps = BaseProps & EmailProviderProps;

export type LayoutViewOptions = {
  data?: {
    credential: OAuthCredential;
    email: string;
    existingProvider?: string;
    newProvider: string;
  };
  type: "default" | "password" | "provider";
};

export const AuthLayout = styled((props: AuthLayoutProps) => {
  const { setSplash } = useSplash();
  const [view, setView] = useState<LayoutViewOptions>({
    type: "default",
  });

  useEffect(() => {
    // setView({
    //   data: {
    //     credential: "abc",
    //     email: "mng@firstcanadian.ca",
    //     newProvider: "facebook.com",
    //   },
    //   type: "password",
    // });
    // setView({
    //   data: {
    //     credential: "abc",
    //     email: "mng@firstcanadian.ca",
    //     existingProvider: "facebook.com",
    //     newProvider: "google.com",
    //   },
    //   type: "provider",
    // });
  }, []);

  let renderView;
  if (typeof view.data !== "undefined") {
    if (view.type === "provider") {
      renderView = (
        <LinkedAuthProvider
          setLoading={setSplash}
          setView={setView}
          strings={props.strings}
          view={view as Required<LayoutViewOptions>}
        />
      );
    } else if (view.type === "password") {
      renderView = (
        <LinkedEmailProvider
          setView={setView}
          strings={props.strings}
          view={view as Required<LayoutViewOptions>}
        />
      );
    }
  } else {
    renderView = (
      <>
        <div className="Layout-heading">
          <Typography className="Layout-title" variant="h1">
            {props.title}
          </Typography>
          <DividerText clipping={3}>{props.strings["withAProvider"]}</DividerText>
          <AuthProviders setLoading={setSplash} setView={setView} />
          <DividerText clipping={3}>{props.strings["orByEmail"]}</DividerText>
        </div>
        <EmailProvider mode={props.mode} strings={props.strings} title={props.title} />
        {props.children}
      </>
    );
  }

  return (
    <>
      <div className={props.className}>
        <Header />
        <main className={`Layout-root ${view.type !== "default" ? "Layout-alternate" : ""}`}>
          {renderView}
        </main>
      </div>
    </>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;

    & .Layout-heading {
      display: flex;

      ${theme.breakpoints.down("sm")} {
        gap: ${theme.spacing(2)};
        justify-content: space-between;
        padding: ${theme.spacing(2)};

        & .Divider-root {
          display: none;
        }
      }

      ${theme.breakpoints.up("sm")} {
        flex-direction: column;
        gap: ${theme.spacing(4)};
      }
    }

    & .Layout-root {
      display: flex;
      flex-direction: column;
      // Use margin: auto; instead of justify-content: center; for overflow issues
      margin: auto;
      min-width: 256px;

      ${theme.breakpoints.down("sm")} {
        width: 100%;

        &:not(.Layout-alternate) {
          gap: ${theme.spacing(2)};
          padding: ${theme.spacing(2)};
        }
      }
      ${theme.breakpoints.up("sm")} {
        gap: ${theme.spacing(4)};
        padding: ${theme.spacing(4)};
        width: 600px;
      }

      & .Layout-title {
        margin: 0;
        text-align: center;
      }
    }
  `}
`;

AuthLayout.displayName = "AuthLayout";
