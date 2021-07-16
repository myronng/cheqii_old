import { styled } from "@material-ui/core/styles";
import { BaseProps } from "declarations";

export const LinkRow = styled((props: BaseProps) => (
  <div className={`${props.className} Layout-linkRow`}>{props.children}</div>
))`
  ${({ theme }) => `
    align-items: center;
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
