import { Divider, IconButton, Typography, TypographyProps } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Facebook, Google } from "@material-ui/icons";
import { ReactNode } from "react";

interface LoginLayoutProps {
  children: ReactNode;
  className?: string;
  title: string;
}

interface DividerTextProps extends TypographyProps {
  children: ReactNode;
  className?: string;
  spacing?: number;
}

export const LoginLayout = styled((props: LoginLayoutProps) => (
  <main className={props.className}>
    <section className="LoginLayout-root">
      <Typography className="LoginLayout-title" variant="h1">
        {props.title}
      </Typography>
      <DividerText>With a provider</DividerText>
      <div className="LoginLayout-providers">
        <IconButton className="LoginLayout-google">
          <Google />
        </IconButton>
        <IconButton className="LoginLayout-facebook">
          <Facebook />
        </IconButton>
      </div>
      <DividerText>Or by email</DividerText>
      {props.children}
    </section>
  </main>
))`
  ${({ theme }) => `
    align-items: center;
    display: flex;
    height: 100vh;
    justify-content: center;
    padding: ${theme.spacing(2)};

    & .LoginLayout-root {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 256px;
      width: 512px;

      & .Divider-root {
        margin: ${theme.spacing(4)} 0;
      }

      & .LoginLayout-providers {
        display: flex;
        justify-content: center;

        & .MuiIconButton-root {
          margin: 0 ${theme.spacing(1)};

          &:before {
            border: 1px solid ${theme.palette.divider};
            border-radius: 50%;
            content: " ";
            height: 100%;
            position: absolute;
            width: 100%;
          }
        }
      }

      & .LoginLayout-title {
        margin: 0;
        text-align: center;
      }

      & .MuiTextField-root {
        & .MuiInputLabel-root {
          margin-left: ${theme.spacing(1)};
        }

        & .MuiInputBase-root.MuiInputBase-adornedStart {
          height: 64px;

          & .MuiInputBase-input {
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
          }

          & .MuiOutlinedInput-notchedOutline legend {
            margin-left: ${theme.spacing(1)};
          }

          & .MuiSvgIcon-root {
            margin: 0 ${theme.spacing(1)};
          }
        }
      }
    }

  `}
`;

const DividerText = styled(({ children, className, spacing, ...props }: DividerTextProps) => (
  <Typography
    className={`${className} Divider-root`}
    component="span"
    variant="subtitle1"
    {...props}
  >
    <Divider />
    <span className="Divider-text">{children}</span>
    <Divider />
  </Typography>
))`
  ${({ spacing = 1, theme }) => `
    align-items: center;
    display: flex;
    width: 100%;

    & .Divider-text {
      color: ${theme.palette.action.disabled};
      flex: 0;
      padding: 0 ${theme.spacing(spacing)};
      white-space: nowrap;
    }

    & .MuiDivider-root {
      flex: 1;
    }
  `}
`;