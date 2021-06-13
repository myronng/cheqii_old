import { getAuth, getRedirectResult } from "@firebase/auth";
import { Typography } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { AuthProviders } from "components/auth/AuthProviders";
import { DividerText } from "components/auth/DividerText";
import { Splash } from "components/Splash";
import { ValidateForm } from "components/ValidateForm";
import { useRouter } from "next/router";
import { FormEventHandler, ReactNode, useEffect, useState } from "react";
import { useAuth } from "utilities/AuthContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type FetchSite = "cross-site" | "same-origin" | "same-site" | "none";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
  fetchSite: FetchSite;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const AuthLayout = styled((props: AuthLayoutProps) => {
  const auth = useAuth();
  const router = useRouter();
  const { setSnackbar } = useSnackbar();
  const isCrossSite = props.fetchSite === "cross-site";
  const [loading, setLoading] = useState(isCrossSite);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const fireAuth = getAuth();
        const redirectResult = await getRedirectResult(fireAuth);
        if (redirectResult === null) {
          setLoading(false);
        } else {
          router.push("/");
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
        setLoading(false);
      }
    };

    if (isCrossSite) {
      checkRedirect();
    }
  }, [auth]);

  return (
    <>
      <main className={props.className}>
        <ValidateForm className="Layout-root" onSubmit={props.onSubmit}>
          <Typography className="Layout-title" variant="h1">
            {props.title}
          </Typography>
          <DividerText clipping={3}>With a provider</DividerText>
          <AuthProviders setLoading={setLoading} />
          <DividerText clipping={3}>Or by email</DividerText>
          {props.children}
        </ValidateForm>
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
    padding: ${theme.spacing(2)};

    & .Layout-root {
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

      & .Layout-title {
        margin: 0;
        text-align: center;
      }

      & .Divider-root {
        ${theme.breakpoints.up("xs")} {
          margin: ${theme.spacing(2, 0)};
        }
        ${theme.breakpoints.up("md")} {
          margin: ${theme.spacing(4, 0)};
        }
      }
    }
  `}
`;
