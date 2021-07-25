import { Menu, MenuItem } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { LoadingButton } from "@material-ui/lab";
import { LinkButton, redirect } from "components/Link";
import { StyledProps } from "declarations";
import { signOut } from "firebase/auth";
import { MouseEvent, useState } from "react";
import { auth } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export const Account = styled((props: StyledProps) => {
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
      await signOut(auth);
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

  return userInfo?.email ? (
    <div className={`Account-root ${props.className}`}>
      <LoadingButton
        aria-controls="account-menu"
        aria-expanded={userMenuOpen ? "true" : undefined}
        aria-haspopup="true"
        className="Account-button"
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
        className="Account-menu"
        id="account-menu"
        MenuListProps={{
          "aria-labelledby": "account-button",
        }}
        onClose={handleUserMenuClose}
        open={userMenuOpen}
      >
        <MenuItem onClick={handleSignOutClick}>Sign Out</MenuItem>
      </Menu>
    </div>
  ) : (
    <div className={`Account-root ${props.className}`}>
      <LinkButton className="Account-auth" NextLinkProps={{ href: "/auth" }} variant="outlined">
        Sign In
      </LinkButton>
      <LinkButton
        className="Account-register"
        NextLinkProps={{ href: "/register" }}
        variant="outlined"
      >
        Register
      </LinkButton>
    </div>
  );
})`
  ${({ theme }) => `
    margin-left: auto;

    & .Account-register {
      margin-left: ${theme.spacing(2)};
    }
  `}
`;
