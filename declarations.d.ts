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

export type Check = {
  id?: string;
  modifiedAt?: number;
  name: string;
  users: CheckUser[];
};

export type CheckUser = {
  uid: string;
  type: "owner" | "editor" | "viewer";
}[];

export type User = {
  checks: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>[];
};
