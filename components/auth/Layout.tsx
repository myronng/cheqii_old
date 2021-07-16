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

type BaseLayoutProps = BaseProps & {
  loading: boolean;
};

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

  return (
    <BaseLayout loading={loading}>
      <div className={`Layout-root ${props.className}`}>
        {view.type === "provider" && typeof view.data !== "undefined" ? (
          <LinkedAuthProvider setLoading={setLoading} setView={setView} view={view} />
        ) : view.type === "password" ? (
          <LinkedEmailProvider setView={setView} view={view} />
        ) : (
          <>
            <Typography className="Layout-title" variant="h1">
              {props.title}
            </Typography>
            <DividerText clipping={3}>With a provider</DividerText>
            <AuthProviders setLoading={setLoading} setView={setView} />
            <DividerText clipping={3}>Or by email</DividerText>
            <EmailProvider mode={props.mode} title={props.title} />
            {props.children}
          </>
        )}
      </div>
    </BaseLayout>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
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

    & .Layout-title {
      margin: 0;
      text-align: center;
    }
  `}
`;

export const BaseLayout = styled((props: BaseLayoutProps) => (
  <>
    <main className={props.className}>{props.children}</main>
    <Splash open={props.loading} />
  </>
))`
  ${({ theme }) => `
    align-items: center;
    display: flex;
    height: 100vh;
    justify-content: center;
    padding: ${theme.spacing(2)};
  `}
`;
