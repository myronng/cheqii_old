import { signInAnonymously, signOut } from "@firebase/auth";
import { Menu, MenuItem } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { LoadingButton } from "@material-ui/lab";
import { LinkButton } from "components/Link";
import { getAuth } from "firebase/auth";
import { GetServerSideProps, NextPage } from "next";
import { destroyCookie } from "nookies";
import { useState, MouseEvent } from "react";
import { verifyAuthToken } from "services/firebase";
import { ServerAuthProps, useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface PageProps {
  className: string;
}

const Page: NextPage<PageProps> = styled((props: PageProps) => {
  const user = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const userMenuOpen = Boolean(userMenu);

  const handleUserMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    setUserMenu(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const handleSignOutClick = async () => {
    try {
      setLoading({
        active: true,
        id: "userMenu",
      });
      const auth = getAuth();
      await signOut(auth);
      destroyCookie({}, "authToken", {
        path: "/",
        sameSite: "strict",
        secure: window.location.protocol === "https:",
      });
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "userMenu",
      });
      handleUserMenuClose();
    }
  };

  return (
    <main className={props.className}>
      <header className="Header-root">
        {user.email ? (
          <>
            <LoadingButton
              aria-controls="account-menu"
              aria-expanded={userMenuOpen ? "true" : undefined}
              aria-haspopup="true"
              disabled={loading.active}
              id="account-button"
              loading={loading.queue.includes("userMenu")}
              onClick={handleUserMenuClick}
              variant="outlined"
            >
              {user.email}
            </LoadingButton>
            <Menu
              anchorEl={userMenu}
              anchorOrigin={{ horizontal: "right", vertical: "top" }}
              id="account-menu"
              MenuListProps={{
                "aria-labelledby": "account-button",
              }}
              onClose={handleUserMenuClose}
              open={userMenuOpen}
            >
              <MenuItem onClick={handleSignOutClick}>Sign Out</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <LinkButton
              loadingId="auth"
              NextLinkProps={{ href: "/auth", shallow: true }}
              variant="outlined"
            >
              Sign In
            </LinkButton>
            <LinkButton
              loadingId="register"
              NextLinkProps={{ href: "/register" }}
              variant="contained"
            >
              Register
            </LinkButton>
          </>
        )}
      </header>
      <div className="Body-root">
        {!user.uid && (
          <LoadingButton
            onClick={async () => {
              const auth = getAuth();
              const anonUser = await signInAnonymously(auth);
              console.log(anonUser);
            }}
            variant="contained"
          >
            Create Anonymous User
          </LoadingButton>
        )}
      </div>
    </main>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-root {
      align-items: center;
      display: flex;
      flex: 1;
      justify-content: center;
    }

    & .Header-root {
      display: flex;
      justify-content: flex-end;
      margin: ${theme.spacing(2)};

      & .MuiLoadingButton-root {
        margin-left: ${theme.spacing(2)};
      }
    }
  `}
`;

export const getServerSideProps: GetServerSideProps<ServerAuthProps> = async (context) => {
  const props = {
    auth: {},
  };
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context.req.cookies.authToken);
    props.auth = {
      email: typeof decodedToken.email === "string" ? decodedToken.email : null,
      uid: decodedToken.uid,
    };
  }

  return {
    props,
  };
};

export default Page;
