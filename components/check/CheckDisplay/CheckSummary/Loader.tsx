import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";

export type LoaderProps = Pick<BaseProps, "className"> & {
  size?: number;
};

export const Loader = styled((props: LoaderProps) => (
  <div className={`Loader-root ${props.className}`}>
    <div className="Loader-left" />
    <div className="Loader-middle" />
    <div className="Loader-right" />
  </div>
))<LoaderProps>`
  ${({ size = 24, theme }) => `
    align-items: center;
    display: flex;
    gap: ${size * 0.75}px;
    height: ${size * 1.25}px;
    justify-content: center;
    width: ${size * 4.75}px;

    & .Loader-left, & .Loader-middle, & .Loader-right {
      animation: loaderGrow 1s infinite ${theme.transitions.easing.easeInOut};
      background: ${theme.palette.secondary.dark};
      border-radius: 50%;
      height: ${size}px;
      width: ${size}px;
    }

    & .Loader-middle {
      animation-delay: 0.1s;
    }

    & .Loader-right {
      animation-delay: 0.2s;
    }

    @keyframes loaderGrow {
      0% {
        transform: scale(1);
      }
      30% {
        transform: scale(1.25);
      }
      60% {
        transform: scale(1);
      }
    }
  `}
`;

Loader.displayName = "Loader";
