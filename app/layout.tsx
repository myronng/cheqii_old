import { BaseProps } from "declarations";

type LayoutProps = Pick<BaseProps, "children">;

const Layout = (props: LayoutProps) => (
  <html>
    <body>{props.children}</body>
  </html>
);

export default Layout;
