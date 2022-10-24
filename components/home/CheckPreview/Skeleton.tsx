import { Card, Skeleton as MuiSkeleton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";

type SkeletonProps = Pick<BaseProps, "className">;

export const Skeleton = styled((props: SkeletonProps) => (
  <div className={`Skeleton-root ${props.className}`}>
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
      <MuiSkeleton className="Skeleton-digest" variant="text"></MuiSkeleton>
    </div>
  </div>
))`
  ${({ theme }) => `
    border: 2px solid ${theme.palette.divider};
    border-radius: ${theme.shape.borderRadius}px;
    display: flex;
    flex-direction: column;

    & .Skeleton-body {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};
    }

    & .Skeleton-digest {
      height: 24px;
      max-width: 220px;
    }

    & .Skeleton-header {
      border-bottom: 2px solid ${theme.palette.divider};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
    }

    & .Skeleton-subtitle {
      max-width: 180px;
    }

    & .MuiAvatar-root {
      margin: 2px;
    }
  `}
`;

Skeleton.displayName = "Skeleton";
