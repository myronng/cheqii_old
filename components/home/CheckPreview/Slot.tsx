import { styled } from "@mui/material/styles";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { BaseProps } from "declarations";

type SlotProps = Pick<BaseProps, "className">;

export const Slot = styled((props: SlotProps) => (
  <Skeleton className={`Slot-root ${props.className}`} />
))`
  ${({ theme }) => `
    background: ${theme.palette.action.hover};
    border-color: ${theme.palette.divider};
    border-radius: ${theme.shape.borderRadius}px;
    // box-shadow: inset ${theme.shadows[1].split("),").join(`), inset `)};

    & .Skeleton-body, & .Skeleton-header {
      visibility: hidden;
    }
  `}
`;

Slot.displayName = "Slot";
