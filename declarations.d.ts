declare module "@material-ui/core/styles/createPalette" {
  export interface TypeBackground {
    dark?: string;
    light?: string;
  }
}

export type BaseProps = PropsWithChildren<StyledProps>;

export type StyledProps = {
  className?: string;
};

export type CheckUser = {
  uid: string;
  type: "owner" | "editor" | "viewer";
}[];
