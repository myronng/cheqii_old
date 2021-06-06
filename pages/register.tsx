import { Button, TextField } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Email, Restore, VpnKey } from "@material-ui/icons";
import { Link } from "components/Link";
import { LoginLayout } from "layouts/Login";
import { NextPage } from "next";

interface PageProps {
  className?: string;
}

const Page: NextPage = styled((props: PageProps) => {
  return (
    <LoginLayout className={props.className} title="Register">
      <TextField
        autoComplete="email"
        className="Register-email"
        InputProps={{
          startAdornment: <Email />,
        }}
        label="Email"
        type="email"
      />
      <TextField
        autoComplete="new-password"
        className="Register-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        label="Password"
        type="password"
      />
      <TextField
        autoComplete="new-password"
        className="Register-confirm"
        InputProps={{
          startAdornment: <Restore />,
        }}
        label="Confirm Password"
        type="password"
      />
      <Button className="Register-submit" variant="contained">
        Register
      </Button>
      <div className="Register-navigation">
        <Link className="Register-back" NextLinkProps={{ href: "/" }}>
          Go back
        </Link>
        <Link className="Register-login" NextLinkProps={{ href: "/login" }}>
          Log in
        </Link>
      </div>
    </LoginLayout>
  );
})`
  ${({ theme }) => `
    & .Register-email {
      margin-top: ${theme.spacing(2)};
    }

    & .Register-navigation {
      display: flex;
      justify-content: space-between;
      margin: ${theme.spacing(4)} ${theme.spacing(2)} 0 ${theme.spacing(2)};
    }

    & .Register-password {
      margin-bottom: ${theme.spacing(4)};
      margin-top: ${theme.spacing(4)};
    }

    & .Register-submit {
      height: 48px;
      margin-top: ${theme.spacing(4)};
    }
  `}
`;

export default Page;
