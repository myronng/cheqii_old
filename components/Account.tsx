import { Feedback, Logout, SettingsApplications } from "@mui/icons-material";
import { Badge, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { LinkMenuItem, redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { MouseEventHandler, useState } from "react";
import { auth } from "services/firebase";

export type AccountProps = Pick<BaseProps, "className" | "strings"> & {
  disabledMenuItems?: string[];
  onSignOut?: () => Promise<void>;
};

export const Account = styled((props: AccountProps) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const userMenuOpen = Boolean(userMenu);

  const handleUserMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setUserMenu(e.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const handleSignOutClick = async () => {
    try {
      setLoading({ active: true });
      if (typeof props.onSignOut === "function") {
        await props.onSignOut();
      }
      await signOut(auth);
      if (router.pathname === "/") {
        router.reload();
      } else {
        redirect(setLoading, "/");
      }
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
        aria-expanded={userMenuOpen ? "true" : "false"}
        aria-haspopup="true"
        aria-label={props.strings["account"]}
        className="Account-button"
        disabled={loading.active}
        id="account-button"
        onClick={handleUserMenuClick}
      >
        <UserAvatar
          alt={userInfo.displayName ?? userInfo.email ?? undefined}
          src={userInfo.photoURL}
        />
      </IconButton>
      <Menu
        anchorEl={userMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        className={`Account-menu ${props.className}`}
        id="account-menu"
        MenuListProps={{
          "aria-labelledby": "account-button",
        }}
        onClose={handleUserMenuClose}
        open={userMenuOpen}
      >
        <LinkMenuItem
          disabled={loading.active || props.disabledMenuItems?.includes("settings")}
          NextLinkProps={{ href: "/settings" }}
        >
          <ListItemIcon>
            <SettingsApplications />
          </ListItemIcon>
          <ListItemText primary={props.strings["settings"]} />
        </LinkMenuItem>
        <LinkMenuItem
          disabled={loading.active || props.disabledMenuItems?.includes("sendFeedback")}
          NextLinkProps={{ href: "/feedback" }}
        >
          <ListItemIcon>
            <Feedback />
          </ListItemIcon>
          <ListItemText primary={props.strings["sendFeedback"]} />
        </LinkMenuItem>
        <MenuItem
          disabled={loading.active || props.disabledMenuItems?.includes("signOut")}
          onClick={handleSignOutClick}
        >
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText primary={props.strings["signOut"]} />
        </MenuItem>
      </Menu>
    </div>
  ) : (
    <div className={`Account-root ${props.className}`}>
      <Badge color="warning" overlap="circular" variant="dot">
        <IconButton
          aria-controls="account-menu"
          aria-expanded={userMenuOpen ? "true" : "false"}
          aria-haspopup="true"
          aria-label={props.strings["account"]}
          className="Account-button Account-warn"
          disabled={loading.active}
          id="account-button"
          onClick={handleUserMenuClick}
        >
          <UserAvatar />
        </IconButton>
      </Badge>
      <Menu
        anchorEl={userMenu}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        className={`Account-menu ${props.className}`}
        id="account-menu"
        MenuListProps={{
          "aria-labelledby": "account-button",
        }}
        onClose={handleUserMenuClose}
        open={userMenuOpen}
      >
        <LinkMenuItem NextLinkProps={{ href: "/register" }}>
          <ListItemText primary={props.strings["register"]} />
        </LinkMenuItem>
        <LinkMenuItem NextLinkProps={{ href: "/auth" }}>
          <ListItemText primary={props.strings["signIn"]} />
        </LinkMenuItem>
      </Menu>
    </div>
  );
})`
  ${({ theme }) => `
    &.Account-root {
      display: flex;
      gap: ${theme.spacing(2)};
    }

    & .Account-button {
      padding: 0;

      &.Mui-disabled .MuiAvatar-root {
        border-color: ${theme.palette.action.disabled};
      }

      &:not(.Mui-disabled) {
        &.Account-warn .MuiAvatar-root {
          border-color: ${theme.palette.warning[theme.palette.mode]};
        }
      }

      & .MuiAvatar-root {
        border: 2px solid ${theme.palette.primary.main};
      }
    }

    & .MuiMenuItem-root > a {
      color: inherit;
      display: contents;
    }
  `}
`;

Account.displayName = "Account";
