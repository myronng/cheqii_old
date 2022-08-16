import { LoadingButton } from "@mui/lab";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AuthForm, EXTERNAL_AUTH_PROVIDERS } from "components/auth/AuthProviders";
import { EmailForm } from "components/auth/EmailProvider";
import { Header } from "components/auth/Header";
import { useAuth } from "components/AuthContextProvider";
import { LinkButton, redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateFormProps, ValidateSubmitButton } from "components/ValidateForm";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import Head from "next/head";
import { ReauthPageProps } from "pages/reauth";
import { MouseEventHandler } from "react";
import { auth } from "services/firebase";

export const ReauthPage = styled((props: ReauthPageProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo } = useAuth();

  let renderAuthProvider;
  if (props.method === "provider") {
    const handleAuthClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
      try {
        setLoading({
          active: true,
          id: "reauthSubmit",
        });
        if (auth.currentUser) {
          const authProvider = auth.currentUser.providerData[0].providerId;
          const currentProvider = EXTERNAL_AUTH_PROVIDERS[authProvider]?.provider;
          await reauthenticateWithPopup(auth.currentUser, currentProvider);
          redirect(setLoading, `/settings#${props.origin}`); // Can't redirect with `as` when using a hash link
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
        setLoading({
          active: false,
          id: "reauthSubmit",
        });
      }
    };
    renderAuthProvider = (
      <AuthForm className="Body-provider" hint={props.strings["reauthenticateHint"]}>
        <nav className="Body-nav">
          <LinkButton NextLinkProps={{ href: `/settings#${props.origin}` }} variant="outlined">
            {props.strings["goBack"]}
          </LinkButton>
          <LoadingButton
            className="LinkedAuthProviders-submit"
            loading={loading.queue.includes("reauthSubmit")}
            onClick={handleAuthClick}
            variant="contained"
          >
            {props.strings["continue"]}
          </LoadingButton>
        </nav>
      </AuthForm>
    );
  } else {
    const handleFormSubmit: ValidateFormProps["onSubmit"] = async (e) => {
      try {
        setLoading({
          active: true,
          id: "reauthSubmit",
        });
        const form = e.target as HTMLFormElement;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;
        if (auth.currentUser && auth.currentUser.email) {
          await reauthenticateWithCredential(
            auth.currentUser,
            EmailAuthProvider.credential(auth.currentUser.email, password)
          );
          redirect(setLoading, `/settings#${props.origin}`);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
        setLoading({
          active: false,
          id: "reauthSubmit",
        });
      }
    };

    renderAuthProvider = (
      <>
        <div className="Body-hint">
          <Typography component="p" variant="h3">
            {props.strings["reauthenticateHint"]}
          </Typography>
        </div>
        <EmailForm
          email={userInfo.email}
          mode="auth"
          onSubmit={handleFormSubmit}
          strings={props.strings}
        >
          <nav className="Body-nav">
            <LinkButton NextLinkProps={{ href: `/settings#${props.origin}` }} variant="outlined">
              {props.strings["goBack"]}
            </LinkButton>
            <ValidateSubmitButton
              loading={loading.queue.includes("reauthSubmit")}
              variant="contained"
            >
              {props.strings["continue"]}
            </ValidateSubmitButton>
          </nav>
        </EmailForm>
      </>
    );
  }

  return (
    <div className={props.className}>
      <Head>
        <title>{props.strings["reauthenticate"]}</title>
      </Head>
      <Header />
      <main className="Body-root">{renderAuthProvider}</main>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;

    & .Body-nav {
      display: flex;
      justify-content: space-between;
    }

    & .Body-root {
      background: ${theme.palette.background.secondary};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(4)};
      margin: auto;
      padding: ${theme.spacing(4)};

      ${theme.breakpoints.down("sm")} {
        width: 100%;
      }
      ${theme.breakpoints.up("sm")} {
        border-radius: ${theme.shape.borderRadius}px;
        width: 600px;
      }
    }
  `}
`;
