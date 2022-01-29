import { Pagination, PaginationProps, Slide, SlideProps } from "@mui/material";
import { styled } from "@mui/system";
import { BaseProps } from "declarations";
import { Children, cloneElement, isValidElement, ReactNode, useRef } from "react";

type AnimationHandler = (node: HTMLElement) => void;

export type PageProps = Pick<BaseProps, "children" | "className"> & {
  SlideProps: SlideProps;
};

export type PaginatorProps = Pick<BaseProps, "children" | "className"> & {
  disablePagination?: boolean;
  onChange: PaginationProps["onChange"];
  openedPage: number;
  pagination?: ReactNode;
};

export const Page = styled((props: any) => {
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
      <section className={`Page-root ${props.className}`}>{props.children}</section>
    </Slide>
  );
})`
  &.Page-animating {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
`;

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
      renderChild = cloneElement(child, {
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
    const root = (e.target as HTMLButtonElement).closest(".Paginator-root");
    if (root !== null) {
      root.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (nextPageNumber !== props.openedPage && typeof props.onChange === "function") {
      props.onChange(e, nextPageNumber);
    }
  };

  return (
    <div className={`Paginator-root ${props.className}`}>
      <div className="Paginator-container">{children}</div>
      {typeof props.pagination !== "undefined" ? (
        props.pagination
      ) : (
        <Pagination
          className="Paginator-pagination"
          color="primary"
          count={numberOfPages}
          disabled={props.disablePagination}
          onChange={handleChange}
          page={props.openedPage}
          size="large"
          variant="outlined"
        />
      )}
    </div>
  );
})`
  ${({ theme }) => `
    overflow-x: hidden;
    overflow-y: auto;
    padding: ${theme.spacing(2)};

    & .Paginator-container {
      position: relative; // Prevents overflow when animating
    }
  `}
`;

Page.displayName = "Page";
Paginator.displayName = "Paginator";
