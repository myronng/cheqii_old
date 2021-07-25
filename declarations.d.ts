import { User as FirebaseUser } from "firebase/auth";
import { DocumentData, DocumentReference } from "firebase/firestore";

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
  editors?: UserId[];
  id?: string;
  modifiedAt?: number;
  name: string;
  owner: UserId;
  viewers?: UserId[];
};

export type User = {
  checks: DocumentReference<DocumentData>[];
};

export type UserEmail = FirebaseUser["email"];

export type UserId = FirebaseUser["uid"];
