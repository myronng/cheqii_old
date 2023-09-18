import { CheckCircleOutline, ContentCopy } from "@mui/icons-material";
import { Button, ButtonProps, Zoom } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLoading } from "components/LoadingContextProvider";
import { useState } from "react";

export type CopyButtonProps = Omit<ButtonProps, "children"> & {
  children: string; // Only allow strings to prevent edge cases in clipboard
};

export const CopyButton = styled((props: CopyButtonProps) => {
  const { loading } = useLoading();
  const [animate, setAnimate] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(props.children);
    if (animate === false) {
      setAnimate(true);
      setTimeout(() => {
        setAnimate(false);
      }, 1500);
    }
  };

  return (
    <Button
      className={props.className}
      disabled={loading.active}
      endIcon={
        <span className="CopyButton-icon">
          <Zoom appear={false} in={animate}>
            <CheckCircleOutline className="CopyButton-done" />
          </Zoom>
          <Zoom appear={false} in={!animate}>
            <ContentCopy className="CopyButton-copy" />
          </Zoom>
        </span>
      }
      onClick={handleCopyClick}
      size="small"
    >
      {props.children}
    </Button>
  );
})`
  ${({ theme }) => `
    & .CopyButton-copy {
      left: 0;
      position: absolute;
      top: 0;
    }

    & .CopyButton-icon {
      position: relative;

      & .MuiSvgIcon-root {
        display: block; // Override display: inline-block;
        font-size: inherit;
      }
    }
  `}
`;

CopyButton.displayName = "CopyButton";
