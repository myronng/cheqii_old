import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Email, VpnKey } from "@material-ui/icons";
import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { TextField } from "components/auth/TextField";
import { Link } from "components/Link";
import { ValidateSubmitButton } from "components/ValidateForm";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";
import { verifyAuthToken } from "services/firebase";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface PageProps {
  className: string;
}

const Page: NextPage<PageProps> = styled((props: PageProps) => {
  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleFormSubmit = async () => {
    try {
      setLoading({
        active: true,
        id: "authSubmit",
      });
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      router.events.on("routeChangeComplete", handleRouteChange);
      router.push("/");
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "authSubmit",
      });
    }
  };
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handleRouteChange = () => {
    setLoading({ active: false });
    router.events.off("routeChangeComplete", handleRouteChange);
  };

  return (
    <AuthLayout className={props.className} onSubmit={handleFormSubmit} title="Sign In">
      <TextField
        autoComplete="email"
        className="Auth-email"
        disabled={loading.active}
        InputProps={{
          startAdornment: <Email />,
        }}
        label="Email"
        onChange={handleEmailChange}
        type="email"
        value={email}
      />
      <TextField
        autoComplete="current-password"
        className="Auth-password"
        disabled={loading.active}
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        inputProps={{
          minLength: 6,
        }}
        label="Password"
        onChange={handlePasswordChange}
        type="password"
        value={password}
      />
      <ValidateSubmitButton
        className="Auth-submit"
        disabled={loading.active}
        loading={loading.queue.includes("authSubmit")}
        variant="outlined"
      >
        Sign In
      </ValidateSubmitButton>
      <LinkRow>
        <Link
          className="Auth-back"
          MuiLinkProps={{ variant: "body1" }}
          NextLinkProps={{ href: "/" }}
        >
          Go back
        </Link>
        <Link
          className="Auth-register"
          MuiLinkProps={{ variant: "body1" }}
          NextLinkProps={{ href: "/register" }}
        >
          Register
        </Link>
      </LinkRow>
      <LinkRow>
        <Link
          className="Auth-reset"
          MuiLinkProps={{ variant: "body1" }}
          NextLinkProps={{ href: "/resetPassword" }}
        >
          Forgot your password?
        </Link>
      </LinkRow>
    </AuthLayout>
  );
})`
  ${({ theme }) => `
    & .Auth-email {
      ${theme.breakpoints.up("md")} {
        margin-top: ${theme.spacing(2)};
      }
    }

    & .Auth-password {
      ${theme.breakpoints.up("xs")} {
        margin-top: ${theme.spacing(2)};
      }
      ${theme.breakpoints.up("md")} {
        margin-top: ${theme.spacing(4)};
      }
    }

    & .Auth-submit {
      ${theme.breakpoints.up("xs")} {
        height: 32px;
        margin-top: ${theme.spacing(2)};
      }
      ${theme.breakpoints.up("md")} {
        height: 48px;
        margin-top: ${theme.spacing(4)};
      }
    }
  `}
`;

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.cookies.authToken) {
    await verifyAuthToken(context.req.cookies.authToken);
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  } else {
    return {
      props: {},
    };
  }
};

export default Page;
