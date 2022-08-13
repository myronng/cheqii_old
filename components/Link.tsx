import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { IconButton, IconButtonProps, MenuItem, MenuItemProps } from "@mui/material";
import { LoadingAction, useLoading } from "components/LoadingContextProvider";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import router from "next/router";
import { Dispatch, MouseEventHandler } from "react";

// interface LinkProps extends MuiLinkProps {
//   NextLinkProps: NextLinkProps;
// }

interface LinkButtonProps extends LoadingButtonProps {
  NextLinkProps: NextLinkProps;
}

interface LinkIconButtonProps extends IconButtonProps {
  NextLinkProps: NextLinkProps;
}

interface LinkMenuItemProps extends MenuItemProps {
  NextLinkProps: NextLinkProps;
}

type Redirect = (
  setLoading: Dispatch<LoadingAction>,
  ...parameters: Partial<Parameters<typeof router.push>>
) => Promise<void>;

// export const Link = ({ children, NextLinkProps, ...props }: LinkProps) => (
//   <NextLink passHref {...NextLinkProps}>
//     <MuiLink {...props}>{children}</MuiLink>
//   </NextLink>
// );

export const LinkButton = ({
  children,
  disabled,
  NextLinkProps,
  onClick,
  ...props
}: LinkButtonProps) => {
  const { loading, setLoading } = useLoading();

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    setLoading({ active: true });
    if (typeof onClick === "function") {
      await onClick(e);
    }
    redirect(setLoading);
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

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    setLoading({ active: true });
    if (typeof onClick === "function") {
      await onClick(e);
    }
    redirect(setLoading);
  };

  return (
    <NextLink {...NextLinkProps}>
      <IconButton disabled={loading.active || disabled} onClick={handleClick} {...props}>
        {children}
      </IconButton>
    </NextLink>
  );
};

export const LinkMenuItem = ({
  children,
  disabled,
  NextLinkProps,
  onClick,
  ...props
}: LinkMenuItemProps) => {
  const { loading, setLoading } = useLoading();

  const handleClick: MouseEventHandler<HTMLLIElement> = async (e) => {
    setLoading({ active: true });
    if (typeof onClick === "function") {
      await onClick(e);
    }
    redirect(setLoading);
  };

  return (
    <NextLink passHref {...NextLinkProps}>
      <MenuItem disabled={loading.active || disabled} onClick={handleClick} {...props}>
        {children}
      </MenuItem>
    </NextLink>
  );
};

export const redirect: Redirect = async (setLoading, url, as, options) => {
  const handleRouteChange = () => {
    setLoading({ active: false });
    router.events.off("routeChangeComplete", handleRouteChange);
  };
  router.events.on("routeChangeComplete", handleRouteChange);
  if (typeof url !== "undefined") {
    await router.push(url, as, options);
  }
};

LinkButton.displayName = "LinkButton";
LinkIconButton.displayName = "LinkIconButton";
LinkMenuItem.displayName = "LinkMenuItem";
