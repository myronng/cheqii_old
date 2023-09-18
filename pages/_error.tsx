import { StackError } from "components/ErrorBoundary";
import { NextPageContext } from "next";

const Page = (props: { statusCode: number }) => <StackError {...props} />;

Page.getInitialProps = ({ res, err }: NextPageContext) => ({
  statusCode: res?.statusCode ?? err?.statusCode ?? 404,
});

export default Page;
