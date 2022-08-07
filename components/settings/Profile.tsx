import { AccountCircle, CameraAlt, Email, Person } from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { UserAvatar } from "components/UserAvatar";
import { ValidateForm, ValidateSubmitButton, ValidateTextField } from "components/ValidateForm";
import { BaseProps, User } from "declarations";
import { updateEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useRef, useState } from "react";
import { auth, db, storage } from "services/firebase";

const AVATAR_SIZE = 96;

export const Profile = styled((props: Pick<BaseProps, "className" | "strings">) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo, setUserInfo } = useAuth();
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

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    try {
      setLoading({
        active: true,
        id: "settingsSubmit",
      });
      const form = e.target as HTMLFormElement;
      if (auth.currentUser !== null) {
        let profileUpdated = false;
        let userInfoUpdated = false;
        const newProfile: Parameters<typeof updateProfile>[1] = {};
        const newUserInfo: Partial<User> = {};

        const newDisplayName = (form.elements.namedItem("displayName") as HTMLInputElement).value;
        const newEmail = (form.elements.namedItem("email") as HTMLInputElement).value;
        let newPhotoURL = userInfo.photoURL;

        if (newEmail && newEmail !== userInfo.email) {
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
        } else if (avatar === null) {
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
          newUserInfo.updatedAt = Date.now();
          await updateDoc(doc(db, "users", String(userInfo.uid)), newUserInfo);
          setUserInfo({
            ...userInfo,
            ...newUserInfo,
            token: await auth.currentUser.getIdToken(true),
          });
        }
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "settingsSubmit",
      });
    }
  };

  return (
    <ValidateForm className={`Body-profile ${props.className}`} onSubmit={handleFormSubmit}>
      <Typography className="Profile-heading" component="h2" variant="h2">
        <AccountCircle fontSize="inherit" />
        <span>{props.strings["profile"]}</span>
      </Typography>
      <IconButton
        aria-controls="avatar-menu"
        aria-expanded={avatarMenuOpen ? "true" : "false"}
        aria-haspopup="true"
        className={`AvatarUploader-root ${loading.active ? "disabled" : ""}`}
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
      <ValidateSubmitButton loading={loading.queue.includes("settingsSubmit")} variant="outlined">
        {props.strings["save"]}
      </ValidateSubmitButton>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(4)};
    padding: ${theme.spacing(2)};

    ${theme.breakpoints.down("sm")} {
      width: 100%;
    }

    ${theme.breakpoints.up("sm")} {
      min-width: 600px;
    }

    & .AvatarUploader-root {
      margin: 0 auto;
      position: relative;

      &:not(.disabled) {
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
      padding: ${theme.spacing(0, 2.25)};

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(2)};
      }
    }
  `}
`;
