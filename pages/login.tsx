import { Button, TextField, Typography } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Email, VpnKey } from "@material-ui/icons";
import { Link } from "components/Link";
import { LoginLayout } from "layouts/Login";
import { NextPage } from "next";

interface PageProps {
  className?: string;
}

const Page: NextPage = styled((props: PageProps) => {
  return (
    <LoginLayout className={props.className} title="Log In">
      <TextField
        autoComplete="email"
        className="Login-email"
        InputProps={{
          startAdornment: <Email />,
        }}
        label="Email"
        type="email"
      />
      <TextField
        autoComplete="current-password"
        className="Login-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        label="Password"
        type="password"
      />
      <Button className="Login-submit" variant="contained">
        Log In
      </Button>
      <div className="Login-navigation">
        <Link className="Login-back" NextLinkProps={{ href: "/" }}>
          Go back
        </Link>
        <Link className="Login-register" NextLinkProps={{ href: "/register" }}>
          Register
        </Link>
      </div>
      <Link className="Login-reset" NextLinkProps={{ href: "/resetPassword" }}>
        Forgot your password?
      </Link>
    </LoginLayout>
  );
})`
  ${({ theme }) => `
    & .Login-email {
      margin-top: ${theme.spacing(2)};
    }

    & .Login-navigation {
      display: flex;
      justify-content: space-between;
      margin: ${theme.spacing(4, 2, 0, 2)};
    }

    & .Login-password {
      margin-top: ${theme.spacing(4)};
    }

    & .Login-reset {
      margin: ${theme.spacing(8, "auto", "5px", 2)};
    }

    & .Login-submit {
      height: 48px;
      margin-top: ${theme.spacing(4)};
    }
  `}
`;

export default Page;
