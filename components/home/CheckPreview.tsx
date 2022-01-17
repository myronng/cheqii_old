import { Update } from "@mui/icons-material";
import { AvatarGroup, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { LinkButton } from "components/Link";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps, Check, Metadata } from "declarations";
import { ReactNode } from "react";

export type CheckPreviewProps = Pick<BaseProps, "className" | "strings"> & {
  checks: { check: Check; metadata: Metadata }[];
};

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const checkPreviews = props.checks?.map((value) => {
    const timestamp =
      typeof value.metadata.modifiedAt !== "undefined"
        ? new Date(value.metadata.modifiedAt)
        : new Date();
    const dateFormatter = Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      hour12: false,
      year: "numeric",
    });
    const UserAvatars: ReactNode[] = [];
    if (typeof value.check.owner !== "undefined") {
      Object.entries(value.check.owner).reduce((acc, user) => {
        const userData = user[1];
        acc.push(
          <UserAvatar
            displayName={userData.photoURL}
            email={userData.email}
            key={`owner-${user[0]}`}
            photoURL={userData.photoURL}
            strings={props.strings}
          />
        );
        return acc;
      }, UserAvatars);
    }
    if (typeof value.check.editor !== "undefined") {
      Object.entries(value.check.editor).reduce((acc, user) => {
        const userData = user[1];
        acc.push(
          <UserAvatar
            displayName={userData.photoURL}
            email={userData.email}
            key={`editor-${user[0]}`}
            photoURL={userData.photoURL}
            strings={props.strings}
          />
        );
        return acc;
      }, UserAvatars);
    }
    if (typeof value.check.viewer !== "undefined") {
      Object.entries(value.check.viewer).reduce((acc, user) => {
        const userData = user[1];
        acc.push(
          <UserAvatar
            displayName={userData.photoURL}
            email={userData.email}
            key={`viewer-${user[0]}`}
            photoURL={userData.photoURL}
            strings={props.strings}
          />
        );
        return acc;
      }, UserAvatars);
    }
    return (
      <Card className="CheckPreview-item" component="article" key={value.metadata.id}>
        <LinkButton
          className="CheckPreview-button"
          NextLinkProps={{ href: `/check/${value.metadata.id}` }}
        >
          <CardHeader
            disableTypography
            subheader={
              <div className="MuiCardHeader-subheader">
                <Update />
                <Typography component="time" dateTime={timestamp.toISOString()} variant="subtitle1">
                  {dateFormatter.format(timestamp)}
                </Typography>
              </div>
            }
            title={
              <Typography component="p" variant="h5">
                {value.check.title}
              </Typography>
            }
          />
          <CardContent>
            <AvatarGroup max={5}>{UserAvatars}</AvatarGroup>
          </CardContent>
        </LinkButton>
      </Card>
    );
  });
  return <section className={`CheckPreview-root ${props.className}`}>{checkPreviews}</section>;
})`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;

    & .CheckPreview-item {
      margin: ${theme.spacing(1)};
    }
    & .CheckPreview-button {
      flex-direction: column;
      height: 100%;
      padding: 0;
      width: 100%;

      & .MuiAvatar-root {
        height: 32px;
        width: 32px;
      }

      & .MuiCardHeader-root {
        padding-bottom: ${theme.spacing(1)};
      }

      & .MuiCardHeader-subheader {
        align-items: center;
        color: ${theme.palette.text.disabled};
        display: flex;
        margin-top: ${theme.spacing(0.5)};

        & .MuiSvgIcon-root {
          margin-right: ${theme.spacing(1)};
        }
      }

      & .MuiCardContent-root {
        display: flex;
        padding-bottom: ${theme.spacing(2)};
        padding-top: 0;
        width: 100%;
      }
    }
  `}
`;
