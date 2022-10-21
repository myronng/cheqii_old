import { Card, Skeleton as MuiSkeleton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";
import { ElementType } from "react";

type SkeletonProps = Pick<BaseProps, "className"> & {
  component?: ElementType;
};

export const Skeleton = styled((props: SkeletonProps) => (
  <Card className={`Skeleton-root ${props.className}`} component={props.component || "article"}>
    <div className="Skeleton-header">
      <Typography component="p" variant="h5">
        <MuiSkeleton variant="text" />
      </Typography>
      <Typography className="Skeleton-subtitle" component="p" variant="subtitle1">
        <MuiSkeleton variant="text" />
      </Typography>
    </div>
    <div className="Skeleton-body">
      <MuiSkeleton variant="circular">
        <UserAvatar />
      </MuiSkeleton>
      <MuiSkeleton variant="text">
        <div className="Skeleton-digest" />
      </MuiSkeleton>
    </div>
  </Card>
))`
  ${({ theme }) => `
    border: 2px solid transparent;
    display: flex;
    flex-direction: column;

    & .Skeleton-body {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};
    }

    & .Skeleton-digest {
      height: 36px;
      width: 220px;
    }

    & .Skeleton-header {
      border-bottom: 2px solid ${theme.palette.divider};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
    }

    & .Skeleton-subtitle {
      width: 180px;
    }

    & .MuiAvatar-root {
      margin: 2px;
    }
  `}
`;

Skeleton.displayName = "Skeleton";
