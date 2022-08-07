import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { CheckPreview } from "components/home/CheckPreview";
import { InsertSlot } from "components/home/CheckPreview/InsertSlot";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { Slot } from "components/home/CheckPreview/Slot";
import { Header } from "components/home/Header";
import { Page, Paginator, PaginatorProps } from "components/home/Page";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, Check } from "declarations";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/router";
import { CHECKS_PER_PAGE } from "pages";
import { ReactNode, useState } from "react";
import { db } from "services/firebase";
import { getCurrencyType } from "services/locale";

export type CheckPreviewType = {
  data: Pick<
    Check,
    "contributors" | "editor" | "items" | "owner" | "title" | "updatedAt" | "viewer"
  >;
  id: string;
};

export type HomePageProps = Pick<BaseProps, "className" | "strings"> & {
  allCheckIds: string[];
  checks: CheckPreviewType[];
};

export const HomePage = styled((props: HomePageProps) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [checks, setChecks] = useState(props.checks);
  const locale = router.locale ?? String(router.defaultLocale);
  const currency = getCurrencyType(locale);
  const totalCheckCount = props.allCheckIds.length;
  const totalPageCount = totalCheckCount === 0 ? 1 : Math.ceil(totalCheckCount / CHECKS_PER_PAGE);
  const disablePagination = userInfo?.isAnonymous || loading.active || totalPageCount <= 1;
  const renderPages: ReactNode[] = [];

  const handlePageChange: PaginatorProps["onChange"] = async (_e, nextPageNumber) => {
    try {
      setLoading({ active: true });
      setPage(nextPageNumber);
      const lowerBound = (nextPageNumber - 1) * CHECKS_PER_PAGE;
      const upperBound = nextPageNumber * CHECKS_PER_PAGE;
      const newCheckIds = props.allCheckIds.filter(
        (checkId, index) =>
          index >= lowerBound && index < upperBound && !checks.some((check) => check.id === checkId)
      );
      if (newCheckIds.length > 0) {
        const newCheckData = await getDocs(
          query(collection(db, "checks"), where(documentId(), "in", newCheckIds))
        );
        const newChecks = [...checks];
        newCheckData.forEach((check) => {
          const checkData = check.data();
          const checkIndex = props.allCheckIds.indexOf(check.id);
          newChecks[checkIndex] = {
            data: {
              contributors: checkData.contributors,
              editor: checkData.editor ?? {},
              items: checkData.items,
              owner: checkData.owner,
              title: checkData.title,
              updatedAt: checkData.updatedAt,
              viewer: checkData.viewer ?? {},
            },
            id: check.id,
          };
        });
        setChecks(newChecks);
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({ active: false });
    }
  };

  for (let i = 0; i < totalPageCount; i++) {
    const iteratedChecks = i * CHECKS_PER_PAGE;
    const pageContent = [<InsertSlot key={iteratedChecks} strings={props.strings} />];
    const pageChecks = checks.slice(iteratedChecks, (i + 1) * CHECKS_PER_PAGE);
    const dateFormatter = Intl.DateTimeFormat(locale, {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      hour12: false,
      year: "numeric",
    });
    for (let j = 0; j < CHECKS_PER_PAGE; j++) {
      const check = pageChecks[j];
      if (typeof check !== "undefined") {
        pageContent.push(
          <CheckPreview
            data={check.data}
            dateFormatter={dateFormatter}
            id={check.id}
            strings={props.strings}
          />
        );
      } else if (iteratedChecks + j < totalCheckCount) {
        pageContent.push(<Skeleton key={iteratedChecks + j + 1} />);
      } else {
        pageContent.push(<Slot key={iteratedChecks + j + 1} />);
      }
    }
    renderPages.push(<Page key={i}>{pageContent}</Page>);
  }

  return (
    <div className={props.className}>
      <Header strings={props.strings} />
      <main className="Body-root">
        <Paginator
          className="CheckPreview-root"
          disablePagination={disablePagination}
          onChange={handlePageChange}
          openedPage={page}
        >
          {renderPages}
        </Paginator>
      </main>
    </div>
  );
})`
  ${({ theme }) => `
  display: flex;
  flex-direction: column;
  font-family: "Fira Code";
  height: 100vh;
  width: 100%;

  & .Body-root {
    background: ${theme.palette.background.secondary};
    border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }

  & .Paginator-pagination {
    grid-column: 1 / -1; // Only works for statically-defined grids
    margin: ${theme.spacing(3, 0, 1, 0)}
  }

  & .Page-root {
    display: grid;
    gap: ${theme.spacing(2)};

    ${theme.breakpoints.up("xs")} {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto auto auto;
      width: 100%;
    }
    ${theme.breakpoints.up("sm")} {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    }
    ${theme.breakpoints.up("md")} {
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto;
    }
  }
`}
`;

HomePage.displayName = "HomePage";
