import { Avatar, IconButton, Menu, MenuItem } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { LinkButton, redirect } from "components/Link";
import { StyledProps } from "declarations";
import { signOut } from "firebase/auth";
import Image from "next/image";
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
  const altText = userInfo?.displayName ? userInfo.displayName : userInfo?.email;
  const fallbackText = altText?.slice(0, 1);

  const handleUserMenuClick = (e: MouseEvent<HTMLButtonElement>) => {
    setUserMenu(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const handleSignOutClick = async () => {
    try {
      setLoading({ active: true });
      await signOut(auth);
      redirect(setLoading, "/");
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({ active: false });
    } finally {
      handleUserMenuClose();
    }
  };

  return userInfo?.email ? (
    <div className={`Account-root ${props.className}`}>
      <IconButton
        aria-controls="account-menu"
        aria-expanded={userMenuOpen ? "true" : undefined}
        aria-haspopup="true"
        className="Account-button"
        disabled={loading.active}
        id="account-button"
        onClick={handleUserMenuClick}
      >
        <Avatar alt={userInfo.displayName ? userInfo.displayName : userInfo.email}>
          {userInfo.profilePhoto ? (
            <Image layout="fill" priority src={userInfo.profilePhoto} />
          ) : (
            fallbackText
          )}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={userMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
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

    & .Account-button {
      padding: 0;
    }

    & .Account-register {
      margin-left: ${theme.spacing(2)};
    }
  `}
`;
