import { Typography } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { AuthProviders } from "components/auth/AuthProviders";
import { DividerText } from "components/auth/DividerText";
import { Splash } from "components/Splash";
import { ValidateForm } from "components/ValidateForm";
import { FormEventHandler, ReactNode, useState } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const AuthLayout = styled((props: AuthLayoutProps) => {
  // const [loading, setLoading] = useState(isCrossSite);
  const [loading, setLoading] = useState(false);

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
