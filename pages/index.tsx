import { signOut } from "@firebase/auth";
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
              aria-controls="basic-menu"
              aria-expanded={userMenuOpen ? "true" : undefined}
              aria-haspopup="true"
              disabled={loading.active}
              id="basic-button"
              loading={loading.queue.includes("userMenu")}
              onClick={handleUserMenuClick}
              variant="outlined"
            >
              {user.email}
            </LoadingButton>
            <Menu
              anchorEl={userMenu}
              anchorOrigin={{ horizontal: "right", vertical: "top" }}
              onClose={handleUserMenuClose}
              open={userMenuOpen}
            >
              <MenuItem onClick={handleSignOutClick}>Sign Out</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <LinkButton
              LoadingButtonProps={{ variant: "outlined" }}
              NextLinkProps={{ href: "/auth", shallow: true }}
            >
              Sign In
            </LinkButton>
            <LinkButton
              LoadingButtonProps={{ variant: "contained" }}
              NextLinkProps={{ href: "/register" }}
            >
              Register
            </LinkButton>
          </>
        )}
      </header>
    </main>
  );
})`
  ${({ theme }) => `
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
    props.auth = { email: decodedToken.email, uid: decodedToken.uid };
  }

  return {
    props,
  };
};

export default Page;
