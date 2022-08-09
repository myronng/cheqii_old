import { styled } from "@mui/material/styles";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { BaseProps } from "declarations";

type SlotProps = Pick<BaseProps, "className">;

export const Slot = styled((props: SlotProps) => (
  <article className={`Slot-root ${props.className}`}>
    <Skeleton component="div" />
  </article>
))`
  ${({ theme }) => `
    background: ${theme.palette.action.hover};
    // border: 2px dashed ${theme.palette.divider};
    border-radius: ${theme.shape.borderRadius}px;
    box-shadow: inset ${theme.shadows[1].split("),").join(`), inset `)};
    // margin: -2px;

    & .Skeleton-root {
      visibility: hidden;
    }
  `}
`;

Slot.displayName = "Slot";
