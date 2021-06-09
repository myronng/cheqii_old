import { IconButton, Typography } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Facebook, Google } from "@material-ui/icons";
import { DividerText } from "components/auth/DividerText";
import { ValidateForm } from "components/ValidateForm";
import { FormEventHandler, ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export const AuthLayout = styled((props: AuthLayoutProps) => (
  <main className={props.className}>
    <ValidateForm className="Layout-root" onSubmit={props.onSubmit}>
      <Typography className="Layout-title" variant="h1">
        {props.title}
      </Typography>
      <DividerText clipping={2}>With a provider</DividerText>
      <div className="Layout-providers">
        <IconButton className="Layout-google" color="primary">
          <Google />
        </IconButton>
        <IconButton className="Layout-facebook" color="primary">
          <Facebook />
        </IconButton>
      </div>
      <DividerText clipping={2}>Or by email</DividerText>
      {props.children}
    </ValidateForm>
  </main>
))`
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

      & .Layout-providers {
        display: flex;
        justify-content: center;

        & .MuiIconButton-root {
          margin: 0 ${theme.spacing(1)};

          &:before {
            border: 1px solid ${theme.palette.primary.main};
            border-radius: 50%;
            content: " ";
            height: 100%;
            position: absolute;
            width: 100%;
          }

          & .MuiSvgIcon-root {
            fill: ${theme.palette.text.primary};
          }
        }
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
