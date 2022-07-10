import { styled } from "@mui/material/styles";
import { CheckPreviewSkeleton } from "components/home/CheckPreviewSkeleton";
import { BaseProps } from "declarations";

type CheckPreviewSlotProps = Pick<BaseProps, "className">;

export const CheckPreviewSlot = styled((props: CheckPreviewSlotProps) => (
  <article className={`CheckPreviewSlot-root ${props.className}`}>
    <CheckPreviewSkeleton component="div" />
  </article>
))`
  ${({ theme }) => `
    background: ${theme.palette.action.hover};
    // border: 2px dashed ${theme.palette.divider};
    border-radius: ${theme.shape.borderRadius}px;
    box-shadow: inset ${theme.shadows[1].split("),").join(`), inset `)};
    // margin: -2px;

    & .CheckPreviewSkeleton-root {
      visibility: hidden;
    }
  `}
`;

CheckPreviewSlot.displayName = "CheckPreviewSlot";
