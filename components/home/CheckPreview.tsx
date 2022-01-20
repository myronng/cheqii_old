import { Update } from "@mui/icons-material";
import { AvatarGroup, Card, CardContent, CardHeader, Skeleton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CheckPreviewSkeleton } from "components/home/CheckPreviewSkeleton";
import { CheckPreviewSlot } from "components/home/CheckPreviewSlot";
import { Page, PageProps } from "components/home/Page";
import { LinkButton } from "components/Link";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps, Check, Metadata } from "declarations";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";

export type CheckPreviewProps = Pick<BaseProps, "className" | "strings"> & {
  checks: { check: Check; metadata: Metadata }[];
  totalCheckCount: number;
};

const CHECKS_PER_PAGE = 6;

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  let renderPages: ReactNode[] = [];
  const checkCount = props.checks.length;

  const handlePageChange: PageProps["onChange"] = (_e, nextPageNumber) => {
    setPage(nextPageNumber);
  };

  if (checkCount > 0) {
    const previews = props.checks.map((value) => {
      const timestamp =
        typeof value.metadata.modifiedAt !== "undefined"
          ? new Date(value.metadata.modifiedAt)
          : new Date();
      const dateFormatter = Intl.DateTimeFormat(router.locale, {
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
                <div className="CheckPreview-subtitle">
                  <Update />
                  <Typography
                    component="time"
                    dateTime={timestamp.toISOString()}
                    variant="subtitle1"
                  >
                    {dateFormatter.format(timestamp)}
                  </Typography>
                </div>
              }
              title={
                <Typography className="CheckPreview-title" component="h2" variant="h5">
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
    renderPages.push(<>{previews}</>);
    const skeletonPageCount = Math.ceil((props.totalCheckCount - checkCount) / CHECKS_PER_PAGE);
    // Start index at 1 to match page numbers
    for (let i = 1; i <= skeletonPageCount; i++) {
      const skeleton = [];
      const numberOfSkeletons = props.totalCheckCount % CHECKS_PER_PAGE || CHECKS_PER_PAGE;
      const numberOfSlots = CHECKS_PER_PAGE - numberOfSkeletons;

      for (let j = 0; j < numberOfSkeletons; j++) {
        skeleton.push(<CheckPreviewSkeleton key={j} />);
      }
      for (let k = 0; k < numberOfSlots; k++) {
        skeleton.push(<CheckPreviewSlot key={k} />);
      }
      renderPages.push(<>{skeleton}</>);
    }
  }

  return (
    <Page
      className={`CheckPreview-root ${props.className}`}
      onChange={handlePageChange}
      openedPage={page}
      pages={renderPages}
    />
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background.secondary};
    border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
    overflow-x: hidden;
    overflow-y: auto;
    padding: ${theme.spacing(2)};

    & .CheckPreview-button {
      flex-direction: column;
      height: 100%;
      padding: 0;
      width: 100%;

      & .MuiCardHeader-root {
        padding-bottom: ${theme.spacing(1)};
        width: 100%;
      }

      & .MuiCardHeader-content {
        overflow: hidden; // Needed for text-overflow styling in title
      }

      & .CheckPreview-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      & .CheckPreview-subtitle {
        align-items: center;
        color: ${theme.palette.text.disabled};
        display: flex;

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

    & .CheckPreview-item {
      & .MuiAvatarGroup-root .MuiAvatar-root {
        border-color: ${theme.palette.primary.main};
      }
    }

    & .CheckPreview-pagination {
      grid-column: 1 / -1; // Only works for statically-defined grids
      margin: ${theme.spacing(3, 0, 1, 0)}
    }

    & .Page-item {
      display: grid;
      gap: ${theme.spacing(2)};

      ${theme.breakpoints.up("xs")} {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto auto;
        width: 100%;
      }
      ${theme.breakpoints.up("sm")} {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
      }
      ${theme.breakpoints.up("md")} {
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: auto;
      }
    }
  `}
`;
