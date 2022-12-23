import { styled } from "@mui/material/styles";
import { LinkIconButton } from "components/Link";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Component, ReactNode } from "react";

type ErrorBoundaryProps = WithRouterProps & {
  children?: ReactNode;
  message?: string;
  statusCode?: number;
  title?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

type StackErrorProps = Pick<BaseProps, "className"> & {
  message?: ReactNode;
  statusCode?: number;
  title?: string;
};

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    // Define a state variable to track whether is an error or not
    this.state = { hasError: Boolean(props.message && props.statusCode && props.title) };
  }
  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }
  // componentDidCatch(error: Error, errorInfo: ErrorInfo) {

  // }
  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      // You can render any custom fallback UI
      const router = this.props.router;
      // Check if ServerRouter instead of ClientRouter
      if (router.events) {
        const handleRouteChange = () => {
          this.setState({ hasError: false });
          router.events.off("routeChangeComplete", handleRouteChange);
        };
        router.events.on("routeChangeComplete", handleRouteChange);
      }

      return (
        <StackError
          message={this.props.message}
          statusCode={this.props.statusCode}
          title={this.props.title}
        />
      );
    }

    // Return children components in case of no error

    return this.props.children;
  }
}

export const ErrorBoundary = withRouter(ErrorBoundaryBase);

export const StackError = styled(
  ({
    className,
    message,
    statusCode = 500,
    title = "An error occurred on client",
  }: StackErrorProps) => (
    <div className={className}>
      <header className="Error-header">
        <LinkIconButton
          className="Error-logo"
          color="primary"
          NextLinkProps={{ href: "/", passHref: true }}
        >
          <Logo />
        </LinkIconButton>
      </header>
      <pre className="Error-body">{message ?? `Error ${statusCode}: ${title}`}</pre>
    </div>
  )
)`
  ${({ theme }) => `
    display: flex;
    height: 100vh;
    position: relative;
    width: 100vw;

    ${theme.breakpoints.down("sm")} {
      background: ${theme.palette.background.paper};
      padding-bottom: ${theme.spacing(1)};
      padding-top: ${theme.spacing(7)};
    }

    ${theme.breakpoints.up("sm")} {
      align-items: center;
      background-color: #393e41;
      justify-content: center;
      ${
        theme.palette.mode === "dark"
          ? "background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/static/stackError.svg);"
          : "background-image: url(/static/stackError.svg);"
      }
    }

    & .Error-body {
      color: ${theme.palette.text.primary};
      font-size: 20px;
      margin: 0;
      overflow: auto;

      ${theme.breakpoints.down("sm")} {
        display: flex;
        margin: auto;
        max-height: calc(100vh - ${theme.spacing(8)});
        max-width: 100vw;
        padding-left: ${theme.spacing(1)};
      }

      ${theme.breakpoints.up("sm")} {
        background: ${theme.palette.background.default};
        border-radius: ${theme.shape.borderRadius}px;
        max-height: calc(100vh - ${theme.spacing(7)});
        max-width: calc(100vw - ${theme.spacing(7)});
        padding: ${theme.spacing(2)};
      }
    }

    & .Error-header {
      background: ${theme.palette.background.default};
      border-radius: 50%;
      left: ${theme.spacing(1)};
      position: absolute;
      top: ${theme.spacing(1)};
    }
  `}
`;
