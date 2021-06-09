import { signOut } from "@firebase/auth";
import { Button, Menu, MenuItem } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { LoadingButton } from "@material-ui/lab";
import { Link, LinkButton } from "components/Link";
import { getAuth } from "firebase/auth";
import { GetServerSideProps, NextPage } from "next";
import { useState, MouseEvent } from "react";
import { verifyAuthToken } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface PageProps extends ServerProps {
  className: string;
}

interface ServerProps {
  email?: string;
  user?: string;
}

const Page: NextPage<PageProps> = styled((props: PageProps) => {
  const user = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const userMenuOpen = Boolean(userMenu);

  console.log(user);

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
        {user ? (
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
              NextLinkProps={{ href: "/auth" }}
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
      margin: ${theme.spacing(1, 2, 0, 0)};

      & .MuiLoadingButton-root {
        margin-left: ${theme.spacing(2)};
      }
    }
  `}
`;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const props: ServerProps = {};

  if (context.req.cookies.authToken) {
    const token = await verifyAuthToken(context.req.cookies.authToken);
    props.email = token.email;
    props.user = token.uid;
  }

  return {
    props,
  };
};

export default Page;
