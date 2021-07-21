import {
  IconButton,
  IconButtonProps,
  Link as MuiLink,
  LinkProps as MuiLinkProps,
} from "@material-ui/core";
import { LoadingButton, LoadingButtonProps } from "@material-ui/lab";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { MouseEventHandler } from "react";
import { redirect } from "services/redirect";
import { useLoading } from "utilities/LoadingContextProvider";

interface LinkProps extends MuiLinkProps {
  NextLinkProps: NextLinkProps;
}

interface LinkButtonProps extends LoadingButtonProps {
  NextLinkProps: NextLinkProps;
}

interface LinkIconButtonProps extends IconButtonProps {
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
  NextLinkProps,
  onClick,
  ...props
}: LinkButtonProps) => {
  const { loading, setLoading } = useLoading();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setLoading({ active: true });
    redirect(setLoading);
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  return (
    <NextLink passHref {...NextLinkProps}>
      <LoadingButton disabled={loading.active || disabled} onClick={handleClick} {...props}>
        {children}
      </LoadingButton>
    </NextLink>
  );
};

export const LinkIconButton = ({
  children,
  disabled,
  NextLinkProps,
  onClick,
  ...props
}: LinkIconButtonProps) => {
  const { loading, setLoading } = useLoading();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setLoading({ active: true });
    redirect(setLoading);
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  return (
    <NextLink {...NextLinkProps}>
      <IconButton disabled={loading.active || disabled} onClick={handleClick} {...props}>
        {children}
      </IconButton>
    </NextLink>
  );
};
