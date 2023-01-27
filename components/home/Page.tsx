import { Pagination, PaginationProps, Slide, SlideProps, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { BaseProps } from "declarations";
import { Children, cloneElement, isValidElement, ReactElement, useRef } from "react";

type AnimationHandler = (node: HTMLElement) => void;

export type PageProps = Pick<BaseProps, "children" | "className"> & {
  SlideProps: SlideProps;
};

export type PaginatorProps = Pick<BaseProps, "children" | "className"> & {
  disablePagination?: boolean;
  onChange: PaginationProps["onChange"];
  openedPage: number;
};

export const Page = (props: any) => {
  const handleAnimating: AnimationHandler = (node) => {
    node.classList.toggle("Page-animating", true);
  };

  const handleAnimated: AnimationHandler = (node) => {
    node.classList.toggle("Page-animating", false);
  };

  return (
    <Slide
      appear={false}
      direction={props.direction}
      in={props.in}
      onExit={handleAnimating}
      onExited={handleAnimated}
      unmountOnExit
      {...props.SlideProps}
    >
      <section className="Page-root">{props.children}</section>
    </Slide>
  );
};

export const Paginator = styled((props: PaginatorProps) => {
  const currentPage = useRef<number>(props.openedPage);
  const nextPage = useRef<number>(props.openedPage);
  let numberOfPages = 0;

  const children = Children.map(props.children, (child, index) => {
    let renderChild;
    if (isValidElement(child)) {
      const isIn = index === props.openedPage - 1;
      let direction: SlideProps["direction"];
      if (isIn) {
        if (nextPage.current > currentPage.current) {
          direction = "left";
        } else {
          direction = "right";
        }
      } else {
        if (nextPage.current > currentPage.current) {
          direction = "right";
        } else {
          direction = "left";
        }
      }
      renderChild = cloneElement(child as ReactElement, {
        SlideProps: {
          direction: child.props.direction ?? direction,
          in: child.props.in ?? isIn,
        },
      });
    } else {
      renderChild = null;
    }
    numberOfPages++;
    return renderChild;
  });

  const handleChange: PaginationProps["onChange"] = async (e, nextPageNumber) => {
    currentPage.current = nextPage.current;
    nextPage.current = nextPageNumber;
    const root = (e.target as HTMLButtonElement).closest(".Paginator-container");
    if (root !== null) {
      root.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (nextPageNumber !== props.openedPage && typeof props.onChange === "function") {
      props.onChange(e, nextPageNumber);
    }
  };

  return (
    <>
      <div className={`Paginator-container ${props.className}`}>{children}</div>
      <footer className={`Paginator-pagination ${props.className}`}>
        <Pagination
          color="primary"
          count={numberOfPages}
          disabled={props.disablePagination}
          onChange={handleChange}
          page={props.openedPage}
          size="large"
          variant="outlined"
        />
      </footer>
    </>
  );
})`
  ${({ theme }) => `
    &.Paginator-container {
      display: flex;
      flex-direction: column;
      margin: auto 0; // Use margin instead of justify-content at parent to prevent overflow issues
      overflow: hidden auto;
      position: relative; // Prevents overflow when animating

      & .Page-root {
        padding: ${theme.spacing(2)};

        &.Page-animating {
          bottom: 0;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }
      }

    }

    &.Paginator-pagination {
      align-items: center;
      background: ${theme.palette.background.default};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      flex-shrink: 0;
      overflow: auto hidden;
      padding: ${theme.spacing(2)};

      & .MuiPagination-root {
        flex-shrink: 0;
      }

      & .MuiTypography-root {
        margin-left: ${theme.spacing(2)};
      }
    }
  `}
`;

Page.displayName = "Page";
Paginator.displayName = "Paginator";
