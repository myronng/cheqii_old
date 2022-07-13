import { Card, Skeleton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";
import { ElementType } from "react";

type CheckPreviewSkeletonProps = Pick<BaseProps, "className"> & {
  component?: ElementType;
};

export const CheckPreviewSkeleton = styled((props: CheckPreviewSkeletonProps) => (
  <Card
    className={`CheckPreviewSkeleton-root ${props.className}`}
    component={props.component || "article"}
  >
    <div className="CheckPreviewSkeleton-header">
      <Typography component="p" variant="h5">
        <Skeleton variant="text" />
      </Typography>
      <Typography className="CheckPreviewSkeleton-subtitle" component="p" variant="subtitle1">
        <Skeleton variant="text" />
      </Typography>
    </div>
    <div className="CheckPreviewSkeleton-body">
      <Skeleton variant="circular">
        <UserAvatar />
      </Skeleton>
      <Skeleton variant="text">
        <div className="CheckPreviewSkeleton-digest" />
      </Skeleton>
    </div>
  </Card>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;

    & .CheckPreviewSkeleton-body {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};
    }

    & .CheckPreviewSkeleton-digest {
      height: 36px;
      width: 220px;
    }

    & .CheckPreviewSkeleton-header {
      border-bottom: 2px solid ${theme.palette.divider};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
    }

    & .CheckPreviewSkeleton-subtitle {
      width: 180px;
    }

    & .MuiAvatar-root {
      margin: 2px;
    }
  `}
`;

CheckPreviewSkeleton.displayName = "CheckPreviewSkeleton";
