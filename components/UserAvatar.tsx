import { Avatar, AvatarProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";
import Image, { ImageProps } from "next/image";

const AVATAR_SIZE = 40;

export type UserAvatarProps = Pick<BaseProps, "className"> & {
  alt?: AvatarProps["alt"];
  AvatarProps?: AvatarProps;
  ImageProps?: Partial<ImageProps>;
  size?: number;
  src?: ImageProps["src"] | null;
};

export const UserAvatar = styled(
  ({ alt, AvatarProps, className, ImageProps, src, size = AVATAR_SIZE }: UserAvatarProps) => {
    let renderChild;
    if (src) {
      renderChild = (
        <Image alt={alt || "Avatar"} height={size} src={src} width={size} {...ImageProps} />
      );
    } else {
      renderChild = typeof alt !== "undefined" ? alt.slice(0, 1) : undefined;
    }
    return (
      <Avatar alt={alt} className={className} {...AvatarProps}>
        {renderChild}
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
