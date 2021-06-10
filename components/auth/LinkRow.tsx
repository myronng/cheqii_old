import { styled } from "@material-ui/core/styles";
import { ReactNode } from "react";

interface LinkRowProps {
  children: ReactNode;
  className?: string;
}

export const LinkRow = styled((props: LinkRowProps) => (
  <div className={`${props.className} Layout-linkRow`}>{props.children}</div>
))`
  ${({ theme }) => `
    display: flex;
    justify-content: space-between;

    ${theme.breakpoints.up("xs")} {
      margin: ${theme.spacing(4, 2, 0)};
    }
    ${theme.breakpoints.up("md")} {
      margin: ${theme.spacing(4, 2, 0)};
    }
  `}
`;
