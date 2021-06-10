import { Divider, Typography, TypographyProps } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { ReactNode } from "react";

interface DividerTextProps extends TypographyProps {
  children: ReactNode;
  className?: string;
  clipping?: number;
  spacing?: number;
}

export const DividerText = styled(
  ({ children, className, clipping, spacing, ...props }: DividerTextProps) => (
    <Typography
      className={`${className} Divider-root`}
      component="span"
      variant="subtitle1"
      {...props}
    >
      <Divider className="Divider-left" />
      <span className="Divider-text">{children}</span>
      <Divider className="Divider-right" />
    </Typography>
  )
)`
  ${({ clipping = 1, spacing = 1, theme }) => `
    align-items: center;
    display: flex;
    width: 100%;

    & .Divider-left {
      margin-left: ${theme.spacing(clipping)};
    }

    & .Divider-right {
      margin-right: ${theme.spacing(clipping)};
    }

    & .Divider-text {
      color: ${theme.palette.action.disabled};
      flex: 0;
      padding: 0 ${theme.spacing(spacing)};
      white-space: nowrap;
    }

    & .MuiDivider-root {
      flex: 1;
    }
  `}
`;
