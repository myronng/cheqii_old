import { Menu, MenuItem } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { LoadingButton } from "@material-ui/lab";
import { LinkButton } from "components/Link";
import { signInAnonymously, signOut } from "firebase/auth";
import { GetServerSideProps, NextPage } from "next";
import { useState, MouseEvent } from "react";
import { firebase } from "services/firebase";
import { verifyAuthToken } from "services/firebaseAdmin";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface PageProps {
  className: string;
}

const Page: NextPage<PageProps> = styled((props: PageProps) => {
  const userInfo = useAuth();
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
      await signOut(firebase.auth);
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
        {userInfo.email ? (
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
              {userInfo.email}
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
        {!userInfo.uid ? (
          <LoadingButton
            onClick={async () => {
              await signInAnonymously(firebase.auth);
            }}
            variant="contained"
          >
            Create Anonymous User
          </LoadingButton>
        ) : (
          userInfo.uid
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const props = {
    auth: {},
  };
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      props.auth = {
        email: typeof decodedToken.email === "string" ? decodedToken.email : null,
        uid: decodedToken.uid,
      };
    }
  }

  return {
    props,
  };
};

export default Page;
