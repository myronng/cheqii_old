import { Update } from "@mui/icons-material";
import { AvatarGroup, Card, CardContent, CardHeader, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CheckPreviewSkeleton } from "components/home/CheckPreviewSkeleton";
import { CheckPreviewSlot } from "components/home/CheckPreviewSlot";
import { Page, Paginator, PaginatorProps } from "components/home/Page";
import { LinkButton } from "components/Link";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps, Check } from "declarations";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import { db } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckPreviewType = {
  data: Pick<Check, "editor" | "owner" | "title" | "updatedAt" | "viewer">;
  id: string;
};

export type CheckPreviewProps = Pick<BaseProps, "className" | "strings"> & {
  allCheckIds: string[];
  checks: CheckPreviewType[];
  checksPerPage: number;
};

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const router = useRouter();
  const userInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [checks, setChecks] = useState(props.checks);
  const totalCheckCount = props.allCheckIds.length;
  const totalPageCount =
    totalCheckCount === 0 ? 1 : Math.ceil(totalCheckCount / props.checksPerPage);
  const disablePagination = userInfo?.isAnonymous || loading.active || totalPageCount <= 1;
  const renderPages: ReactNode[] = [];

  const handlePageChange: PaginatorProps["onChange"] = async (_e, nextPageNumber) => {
    try {
      setLoading({ active: true });
      setPage(nextPageNumber);
      const lowerBound = (nextPageNumber - 1) * props.checksPerPage;
      const upperBound = nextPageNumber * props.checksPerPage;
      const newCheckIds = props.allCheckIds.filter(
        (checkId, index) =>
          index >= lowerBound && index < upperBound && !checks.some((check) => check.id === checkId)
      );
      if (newCheckIds.length > 0) {
        const newCheckData = await getDocs(
          query(collection(db, "checks"), where(documentId(), "in", newCheckIds))
        );
        const newChecks = [...checks];
        newCheckData.forEach((check) => {
          const checkData = check.data();
          const checkIndex = props.allCheckIds.indexOf(check.id);
          newChecks[checkIndex] = {
            data: {
              editor: checkData.editor ?? {},
              owner: checkData.owner,
              title: checkData.title,
              updatedAt: checkData.updatedAt,
              viewer: checkData.viewer ?? {},
            },
            id: check.id,
          };
        });
        setChecks(newChecks);
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({ active: false });
    }
  };

  for (let i = 0; i < totalPageCount; i++) {
    const pageContent = [];
    const iteratedChecks = i * props.checksPerPage;
    const pageChecks = checks.slice(iteratedChecks, (i + 1) * props.checksPerPage);
    for (let j = 0; j < props.checksPerPage; j++) {
      const check = pageChecks[j];
      if (typeof check !== "undefined") {
        const timestamp =
          typeof check.data.updatedAt !== "undefined" ? new Date(check.data.updatedAt) : new Date();
        const dateFormatter = Intl.DateTimeFormat(router.locale, {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
          hour12: false,
          year: "numeric",
        });
        const UserAvatars: ReactNode[] = [];
        Object.entries(check.data.owner).reduce((acc, user) => {
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
        if (typeof check.data.editor !== "undefined") {
          Object.entries(check.data.editor).reduce((acc, user) => {
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
        if (typeof check.data.viewer !== "undefined") {
          Object.entries(check.data.viewer).reduce((acc, user) => {
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
        pageContent.push(
          <Card className="CheckPreview-item" component="article" key={check.id}>
            <LinkButton
              className="CheckPreview-button"
              NextLinkProps={{ href: `/check/${check.id}` }}
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
                    {check.data.title}
                  </Typography>
                }
              />
              <CardContent>
                <AvatarGroup max={5}>{UserAvatars}</AvatarGroup>
              </CardContent>
            </LinkButton>
          </Card>
        );
      } else if (iteratedChecks + j < totalCheckCount) {
        pageContent.push(<CheckPreviewSkeleton key={iteratedChecks + j} />);
      } else {
        pageContent.push(<CheckPreviewSlot key={iteratedChecks + j} />);
      }
    }
    renderPages.push(<Page key={i}>{pageContent}</Page>);
  }

  return (
    <Paginator
      className={`CheckPreview-root ${props.className}`}
      disablePagination={disablePagination}
      onChange={handlePageChange}
      openedPage={page}
    >
      {renderPages}
    </Paginator>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background.secondary};
    border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};

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

    & .Paginator-pagination {
      grid-column: 1 / -1; // Only works for statically-defined grids
      margin: ${theme.spacing(3, 0, 1, 0)}
    }

    & .Page-root {
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

CheckPreview.displayName = "CheckPreview";
