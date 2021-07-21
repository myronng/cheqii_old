import { Menu, MenuItem } from "@material-ui/core";
import { LoadingButton } from "@material-ui/lab";
import { LinkButton } from "components/Link";
import { signOut } from "firebase/auth";
import { MouseEvent, useState } from "react";
import { firebase } from "services/firebase";
import { redirect } from "services/redirect";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export const Account = () => {
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
      redirect(setLoading, "/");
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "userMenu",
      });
    } finally {
      handleUserMenuClose();
    }
  };

  return userInfo.email ? (
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
      <LinkButton NextLinkProps={{ href: "/auth" }} variant="outlined">
        Sign In
      </LinkButton>
      <LinkButton NextLinkProps={{ href: "/register" }} variant="contained">
        Register
      </LinkButton>
    </>
  );
};
