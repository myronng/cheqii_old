import { styled } from "@mui/material/styles";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { BaseProps } from "declarations";

type SlotProps = Pick<BaseProps, "className">;

export const Slot = styled((props: SlotProps) => (
  <div className={`Slot-root ${props.className}`}>
    <Skeleton />
  </div>
))`
  ${({ theme }) => `
    background: ${theme.palette.action.hover};
    border-radius: ${theme.shape.borderRadius}px;
    // box-shadow: inset ${theme.shadows[1].split("),").join(`), inset `)};
    outline: 2px solid ${theme.palette.divider};
    outline-offset: -2px;

    & .Skeleton-root {
      visibility: hidden;
    }
  `}
`;

Slot.displayName = "Slot";
