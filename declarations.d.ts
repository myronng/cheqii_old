import { User as FirebaseUser } from "firebase/auth";

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
  uid: UserId;
  type: "owner" | "editor" | "viewer";
}[];

export type User = {
  checks: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>[];
};

export type UserEmail = FirebaseUser["email"];

export type UserId = FirebaseUser["uid"];
