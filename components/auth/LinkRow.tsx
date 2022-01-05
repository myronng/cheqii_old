import { styled } from "@mui/material/styles";
import { BaseProps, Styles } from "declarations";

export const LinkRow = styled((props: Pick<BaseProps, "children" | "className">) => (
  <div className={`${props.className} Layout-linkRow`}>{props.children}</div>
))`
  ${({ theme }: Styles) => `
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-top: ${theme.spacing(4)};
  `}
`;
