import { Avatar, AvatarProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { AuthType } from "components/AuthContextProvider";
import { BaseProps } from "declarations";
import Image, { ImageProps } from "next/image";

const AVATAR_SIZE = 40;

export type UserAvatarProps = AuthType &
  Partial<Pick<BaseProps, "className" | "strings">> & {
    AvatarProps?: AvatarProps;
    ImageProps?: Partial<ImageProps>;
    size?: number;
  };

export const UserAvatar = styled(
  ({
    AvatarProps,
    className,
    displayName,
    email,
    ImageProps,
    photoURL,
    size = AVATAR_SIZE,
  }: UserAvatarProps) => {
    const identifiedUser = displayName ?? email;
    const altText = identifiedUser || undefined;
    const fallbackAvatar = typeof altText !== "undefined" ? altText.slice(0, 1) : undefined;
    return (
      <Avatar alt={altText} className={className} {...AvatarProps}>
        {photoURL ? (
          <Image alt={altText} height={size} src={photoURL} width={size} {...ImageProps} />
        ) : (
          fallbackAvatar
        )}
      </Avatar>
    );
  }
)`
  ${({ size = AVATAR_SIZE }) => `
    height: ${size}px;
    width: ${size}px;
  `}
`;

UserAvatar.displayName = "UserAvatar";
