import { AccountCircle, CameraAlt, Email, Person } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { EXTERNAL_AUTH_PROVIDERS } from "components/auth/AuthProviders";
import { useAuth } from "components/AuthContextProvider";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { UserAvatar } from "components/UserAvatar";
import {
  ValidateForm,
  ValidateFormProps,
  ValidateSubmitButton,
  ValidateTextField,
} from "components/ValidateForm";
import { BaseProps, User } from "declarations";
import { FirebaseError } from "firebase/app";
import { AuthErrorCodes, updateEmail, updateProfile } from "firebase/auth";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ChangeEventHandler, MouseEventHandler, useRef, useState } from "react";
import { auth, storage } from "services/firebase";
import { parseDefinedKeys } from "services/parser";

const AVATAR_SIZE = 96;

export const Profile = styled((props: Pick<BaseProps, "className" | "strings">) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo, setUserInfo } = useAuth(); // Can't use props.userData because this view must always be up to date
  const [avatar, setAvatar] = useState(userInfo.photoURL);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null);
  const [avatarMenu, setAvatarMenu] = useState<HTMLElement | null>(null);
  const avatarMenuOpen = Boolean(avatarMenu);

  const handleAvatarChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    if (files !== null) {
      for (const file of files) {
        if (file.type.match(/^image.*/)) {
          const originalAvatar = new Image();
          originalAvatar.src = URL.createObjectURL(file);
          originalAvatar.onload = () => {
            URL.revokeObjectURL(originalAvatar.src);
            if (avatarCanvasRef.current !== null) {
              const canvasContext = avatarCanvasRef.current.getContext("2d");
              if (canvasContext !== null) {
                // Use the shortest dimension to crop image into a square
                const imageSize = Math.min(
                  originalAvatar.naturalHeight,
                  originalAvatar.naturalWidth
                );
                canvasContext.drawImage(
                  originalAvatar,
                  (originalAvatar.naturalWidth - imageSize) / 2, // If width is the long side, find the middle of it
                  (originalAvatar.naturalHeight - imageSize) / 2, // Otherwise if height is the long side, do the same
                  imageSize,
                  imageSize,
                  0,
                  0,
                  AVATAR_SIZE,
                  AVATAR_SIZE
                );
                avatarCanvasRef.current.toBlob((imageBlob) => {
                  if (imageBlob !== null) {
                    const newAvatar = URL.createObjectURL(imageBlob);
                    setAvatar(newAvatar);
                  } else {
                    setAvatar(imageBlob);
                  }
                  setAvatarBlob(imageBlob);
                }, "image/webp");
              }
            }
          };
        }
      }
    }
    setAvatarMenu(null);
  };

  const handleAvatarDelete: MouseEventHandler<HTMLLIElement> = () => {
    setAvatar(null);
    handleAvatarMenuClose();
  };

  const handleAvatarMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setAvatarMenu(e.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenu(null);
  };

  const handleFormSubmit: ValidateFormProps["onSubmit"] = async (e) => {
    try {
      setLoading({
        active: true,
        id: "profileSubmit",
      });
      if (auth.currentUser !== null) {
        const form = e.target as HTMLFormElement;
        let profileUpdated = false;
        let userInfoUpdated = false;
        const newProfile: Parameters<typeof updateProfile>[1] = {};
        const { isAnonymous, ...filteredUserInfo } = userInfo;
        const newUserInfo: Partial<User> = parseDefinedKeys(filteredUserInfo);

        const newDisplayName = (form.elements.namedItem("displayName") as HTMLInputElement).value;
        const newEmail = (form.elements.namedItem("email") as HTMLInputElement).value;
        let newPhotoURL = userInfo.photoURL;

        if (newEmail !== userInfo.email) {
          // Don't make a separate try/catch for re-authentication; stop execution and use the top level catch
          await updateEmail(auth.currentUser, newEmail);
          newUserInfo.email = newEmail;
          userInfoUpdated = true;
        }

        // newDisplayName can be updated to an empty string
        if (newDisplayName !== userInfo.displayName) {
          newProfile.displayName = newDisplayName;
          newUserInfo.displayName = newDisplayName;
          profileUpdated = true;
          userInfoUpdated = true;
        }

        if (avatarBlob) {
          const profilePhotoRef = ref(storage, `${userInfo.uid}/profilePhoto`);
          await uploadBytes(profilePhotoRef, avatarBlob);
          newPhotoURL = await getDownloadURL(profilePhotoRef);
        } else if (avatar === null && userInfo.photoURL) {
          const profilePhotoRef = ref(storage, `${userInfo.uid}/profilePhoto`);
          await deleteObject(profilePhotoRef);
          newPhotoURL = "";
        }

        if (newPhotoURL !== userInfo.photoURL) {
          newProfile.photoURL = newPhotoURL;
          newUserInfo.photoURL = newPhotoURL;
          profileUpdated = true;
          userInfoUpdated = true;
        }

        if (profileUpdated === true) {
          await updateProfile(auth.currentUser, newProfile);
        }

        if (userInfoUpdated === true) {
          // Use admin API to update checks where user has read-only access
          await fetch("/api/user", {
            body: JSON.stringify(newUserInfo),
            headers: {
              "Content-Type": "application/json",
            },
            method: "PUT",
          });
          setUserInfo({
            ...newUserInfo,
            token: await auth.currentUser.getIdToken(true),
          });
        }
      }
      setLoading({
        active: false,
        id: "profileSubmit",
      });
    } catch (err) {
      // Occurs when updating email with stale credentials
      if (
        err instanceof FirebaseError &&
        err.code === AuthErrorCodes.CREDENTIAL_TOO_OLD_LOGIN_AGAIN &&
        auth.currentUser
      ) {
        const authProvider = auth.currentUser.providerData[0].providerId;
        const currentProvider = EXTERNAL_AUTH_PROVIDERS[authProvider]?.provider;
        let query: URLSearchParams;
        if (typeof currentProvider !== "undefined") {
          query = new URLSearchParams({
            method: "provider",
            origin: "profile",
          });
        } else {
          query = new URLSearchParams({
            method: "password",
            origin: "profile",
          });
        }
        redirect(setLoading, `/reauth?${query}`, "/reauth");
      } else {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
        setLoading({
          active: false,
          id: "profileSubmit",
        });
      }
    }
  };

  return (
    <ValidateForm className={`Profile-root ${props.className}`} onSubmit={handleFormSubmit}>
      <Typography className="Profile-heading" component="h2" id="profile" variant="h2">
        <AccountCircle fontSize="inherit" />
        <span>{props.strings["profile"]}</span>
      </Typography>
      <IconButton
        aria-controls="avatar-menu"
        aria-expanded={avatarMenuOpen ? "true" : "false"}
        aria-haspopup="true"
        className="AvatarUploader-root"
        disabled={loading.active}
        id="avatar-button"
        onClick={handleAvatarMenuClick}
      >
        <UserAvatar
          className="AvatarUploader-avatar"
          alt={userInfo.displayName ?? userInfo.email ?? undefined}
          src={avatar}
          size={AVATAR_SIZE}
        />
        <canvas
          className="AvatarUploader-canvas"
          height={AVATAR_SIZE}
          id="avatarCanvas"
          ref={avatarCanvasRef}
          width={AVATAR_SIZE}
        />
        <CameraAlt className="AvatarUploader-icon" />
        <input
          accept="image/*"
          capture="user"
          className="AvatarUploader-input"
          disabled={loading.active}
          hidden
          id="avatarUploader"
          onChange={handleAvatarChange}
          type="file"
        />
      </IconButton>
      <Menu
        anchorEl={avatarMenu}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        className="Avatar-menu"
        id="avatar-menu"
        MenuListProps={{
          "aria-labelledby": "avatar-button",
        }}
        onClose={handleAvatarMenuClose}
        open={avatarMenuOpen}
      >
        <MenuItem component="label" disabled={loading.active} htmlFor="avatarUploader">
          {props.strings["uploadAPhoto"]}
        </MenuItem>
        <MenuItem disabled={loading.active} onClick={handleAvatarDelete}>
          {props.strings["deletePhoto"]}
        </MenuItem>
      </Menu>
      <ValidateTextField
        autoComplete="email"
        defaultValue={userInfo.email}
        InputProps={{
          startAdornment: <Email />,
        }}
        label={props.strings["email"]}
        name="email"
        type="email"
      />
      <ValidateTextField
        autoComplete="name"
        defaultValue={userInfo.displayName}
        InputProps={{
          startAdornment: <Person />,
        }}
        label={props.strings["name"]}
        name="displayName"
        required={false} // Allow user to not have a name
      />
      <ValidateSubmitButton loading={loading.queue.includes("profileSubmit")} variant="outlined">
        {props.strings["save"]}
      </ValidateSubmitButton>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    & .AvatarUploader-root {
      margin: 0 auto;
      position: relative;

      &:not(.Mui-disabled) {
        cursor: pointer;

        & .AvatarUploader-avatar {
          border-color: ${theme.palette.primary.main};
        }
      }

      & .AvatarUploader-avatar {
        border: 2px solid ${theme.palette.action.disabled};
        box-sizing: content-box;
      }

      & .AvatarUploader-canvas {
        display: none;
      }

      & .AvatarUploader-icon {
        background: ${theme.palette.background.paper};
        border: 2px solid ${theme.palette.divider};
        border-radius: 50%;
        bottom: 4px;
        height: 32px;
        padding: ${theme.spacing(0.5)};
        position: absolute;
        right: 4px;
        width: 32px;
      }
    }

    & .Profile-heading {
      align-items: center;
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(2)};
      }
    }
  `}
`;

Profile.displayName = "Profile";
