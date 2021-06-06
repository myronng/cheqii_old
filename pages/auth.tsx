import {
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
  TypographyProps,
} from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Email, Facebook, Google } from "@material-ui/icons";
import { Link } from "components/Link";
import { NextPage } from "next";
import { ReactNode } from "react";

interface PageProps {
  className?: string;
}

interface DividerTextProps extends TypographyProps {
  children: ReactNode;
  className?: string;
  spacing?: number;
}

const Page: NextPage = styled((props: PageProps) => {
  return (
    <main className={props.className}>
      <section className="Auth-root">
        <Typography className="Auth-title" variant="h1">
          Sign In / Register
        </Typography>
        <DividerText>With a provider</DividerText>
        <div className="Auth-providers">
          <IconButton className="Auth-google">
            <Google />
          </IconButton>
          <IconButton className="Auth-facebook">
            <Facebook />
          </IconButton>
        </div>
        <DividerText>Or by email</DividerText>
        <TextField
          autoComplete="email"
          className="Auth-email"
          InputProps={{
            startAdornment: <Email />,
          }}
          label="Email"
          type="email"
        />
        <Button className="Auth-submit" variant="outlined">
          Continue
        </Button>
        <Link className="Auth-back" NextLinkProps={{ href: "/" }}>
          Go back
        </Link>
      </section>
    </main>
  );
})`
  ${({ theme }) => `
    align-items: center;
    display: flex;
    height: 100vh;
    justify-content: center;
    padding: ${theme.spacing(2)};

    & .Auth-root {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 256px;
      width: 512px;

      & .Auth-back {
        margin: ${theme.spacing(4, "auto", "5px", 2)};
      }

      & .Auth-email {
        margin-top: ${theme.spacing(2)};
      }

      & .Auth-providers {
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

      & .Auth-submit {
        height: 48px;
        margin-top: ${theme.spacing(4)};
      }

      & .Auth-title {
        margin: 0;
        text-align: center;
      }

      & .Divider-root {
        margin: ${theme.spacing(4)} 0;
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

export default Page;
