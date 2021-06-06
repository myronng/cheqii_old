import { Link as MuiLink, LinkBaseProps } from "@material-ui/core";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { ReactNode } from "react";

interface LinkProps {
  children: ReactNode;
  className?: string;
  MuiLinkProps?: LinkBaseProps;
  NextLinkProps: NextLinkProps;
}

export const Link = (props: LinkProps) => (
  <NextLink passHref {...props.NextLinkProps}>
    <MuiLink className={props.className} {...props.MuiLinkProps}>
      {props.children}
    </MuiLink>
  </NextLink>
);
