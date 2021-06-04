import { GitHub } from "@material-ui/icons";
import { GetServerSideProps, NextPage } from "next";
import { useEffect } from "react";

interface Props {}

const Page: NextPage<Props> = (props) => {
  return (
    <div>
      <GitHub />
      test
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const baseUrl = req ? `${protocol}://${req.headers.host}` : "";
  const response = await fetch(`${baseUrl}/api/hello`, {
    body: JSON.stringify({ test: "abc" }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const responseJson = await response.json();
  console.log(responseJson);
  return {
    props: {},
  };
};

export default Page;
