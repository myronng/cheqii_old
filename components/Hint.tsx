import { InfoOutlined } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";

export type HintProps = Pick<BaseProps, "children" | "className">;

export const Hint = styled((props: HintProps) => (
  <div className={`Hint-root ${props.className}`}>
    <InfoOutlined className="Hint-icon" />
    <span className="Hint-text">{props.children}</span>
  </div>
))`
  ${({ theme }) => `
    display: flex;
    color: ${theme.palette.text.disabled};
    gap: ${theme.spacing(1)};
  `}
`;

Hint.displayName = "Hint";
