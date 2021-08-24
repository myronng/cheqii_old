import { Avatar } from "@material-ui/core";
import { AuthType, useAuth } from "utilities/AuthContextProvider";
import Image from "next/image";

export type UserAvatarProps = {
  userInfo?: AuthType;
};

export const UserAvatar = (props: UserAvatarProps) => {
  const currentUserInfo = useAuth();
  const userInfo = props.userInfo || currentUserInfo;

  const altText = userInfo.displayName ?? userInfo.email ?? "Anonymous";
  const fallbackText = altText.slice(0, 1);
  return (
    <Avatar alt={altText}>
      {userInfo.photoURL ? <Image layout="fill" priority src={userInfo.photoURL} /> : fallbackText}
    </Avatar>
  );
};
