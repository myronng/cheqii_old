import { Avatar, AvatarProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";
import Image, { ImageProps } from "next/image";

const AVATAR_SIZE = 40;

export type UserAvatarProps = Partial<Pick<BaseProps, "className" | "strings">> & {
  alt?: AvatarProps["alt"];
  AvatarProps?: AvatarProps;
  ImageProps?: Partial<ImageProps>;
  size?: number;
  src?: ImageProps["src"] | null;
};

export const UserAvatar = styled(
  ({ alt, AvatarProps, className, ImageProps, src, size = AVATAR_SIZE }: UserAvatarProps) => {
    const fallbackAvatar = typeof alt !== "undefined" ? alt.slice(0, 1) : undefined;
    return (
      <Avatar alt={alt} className={className} {...AvatarProps}>
        {src ? (
          <Image alt={alt} height={size} src={src} width={size} {...ImageProps} />
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
