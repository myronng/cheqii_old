import { Avatar } from "@mui/material";
import { AuthType } from "components/AuthContextProvider";
import { BaseProps } from "declarations";
import Image from "next/image";

export type UserAvatarProps = AuthType & Partial<Pick<BaseProps, "strings">>;

export const UserAvatar = (props: UserAvatarProps) => {
  const identifiedUser = props.displayName ?? props.email;
  const altText = identifiedUser || undefined;
  const fallbackAvatar = typeof altText !== "undefined" ? altText.slice(0, 1) : undefined;
  return (
    <Avatar alt={altText}>
      {props.photoURL ? <Image alt={altText} layout="fill" src={props.photoURL} /> : fallbackAvatar}
    </Avatar>
  );
};

UserAvatar.displayName = "UserAvatar";
