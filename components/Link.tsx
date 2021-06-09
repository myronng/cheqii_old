import { Link as MuiLink, LinkProps as MuiLinkProps } from "@material-ui/core";
import { LoadingButton, LoadingButtonProps } from "@material-ui/lab";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { ReactNode } from "react";

interface LinkProps {
  children: ReactNode;
  className?: string;
  MuiLinkProps?: MuiLinkProps;
  NextLinkProps: NextLinkProps;
}

interface LinkButtonProps {
  children: ReactNode;
  className?: string;
  LoadingButtonProps?: LoadingButtonProps;
  NextLinkProps: NextLinkProps;
}

export const Link = (props: LinkProps) => (
  <NextLink passHref {...props.NextLinkProps}>
    <MuiLink className={props.className} {...props.MuiLinkProps}>
      {props.children}
    </MuiLink>
  </NextLink>
);

export const LinkButton = (props: LinkButtonProps) => (
  <NextLink passHref {...props.NextLinkProps}>
    <LoadingButton className={props.className} {...props.LoadingButtonProps}>
      {props.children}
    </LoadingButton>
  </NextLink>
);
