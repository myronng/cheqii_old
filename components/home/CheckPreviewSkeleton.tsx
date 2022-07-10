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
    <div>
      <Typography component="p" variant="h5">
        <Skeleton variant="text" />
      </Typography>
      <Typography component="p" variant="subtitle1">
        <Skeleton variant="text" />
      </Typography>
    </div>
    <Skeleton variant="circular">
      <UserAvatar />
    </Skeleton>
    <Typography>
      <Skeleton variant="text" />
    </Typography>
  </Card>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};

    & .MuiAvatar-root {
      margin: 2px;
    }
  `}
`;

CheckPreviewSkeleton.displayName = "CheckPreviewSkeleton";
