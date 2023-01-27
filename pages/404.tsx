import { StackError } from "components/ErrorBoundary";

const Page = () => <StackError message="404 - Page not found" statusCode={404} />;

export default Page;
