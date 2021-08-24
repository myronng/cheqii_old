import { styled } from "@material-ui/core/styles";
import { BaseProps } from "declarations";

export const LinkRow = styled((props: Pick<BaseProps, "children" | "className">) => (
  <div className={`${props.className} Layout-linkRow`}>{props.children}</div>
))`
  ${({ theme }) => `
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: ${theme.spacing(4)};
  `}
`;
