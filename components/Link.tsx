import { Link as MuiLink, LinkProps as MuiLinkProps } from "@material-ui/core";
import { LoadingButton, LoadingButtonProps } from "@material-ui/lab";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useRouter } from "next/router";
import { MouseEventHandler } from "react";
import { useLoading } from "utilities/LoadingContextProvider";

interface LinkProps extends MuiLinkProps {
  NextLinkProps: NextLinkProps;
}

interface LinkButtonProps extends LoadingButtonProps {
  loadingId: string;
  NextLinkProps: NextLinkProps;
}

export const Link = ({ children, NextLinkProps, ...props }: LinkProps) => (
  <NextLink passHref {...NextLinkProps}>
    <MuiLink {...props}>{children}</MuiLink>
  </NextLink>
);

export const LinkButton = ({
  children,
  disabled,
  loading,
  loadingId,
  NextLinkProps,
  onClick,
  ...props
}: LinkButtonProps) => {
  const { loading: loadingState, setLoading } = useLoading();
  const router = useRouter();

  const handleRouteChange = () => {
    setLoading({ active: false });
    router.events.off("routeChangeComplete", handleRouteChange);
  };

  const handleLinkButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setLoading({ active: true, id: loadingId });
    router.events.on("routeChangeComplete", handleRouteChange);
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  return (
    <NextLink passHref {...NextLinkProps}>
      <LoadingButton
        disabled={loadingState.active || disabled}
        loading={loadingState.queue.includes(loadingId) || loading}
        onClick={handleLinkButtonClick}
        {...props}
      >
        {children}
      </LoadingButton>
    </NextLink>
  );
};
