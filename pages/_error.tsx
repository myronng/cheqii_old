import { StackError } from "components/ErrorBoundary";
import { NextPageContext } from "next";

const Page = ({ statusCode }: { statusCode: number }) => (
  <StackError>{statusCode ? `Error ${statusCode}` : "An error occurred on client"}</StackError>
);

Page.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Page;
