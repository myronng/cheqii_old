import {
  DocumentData as DocumentDataAdmin,
  DocumentReference as DocumentReferenceAdmin,
} from "@google-cloud/firestore";
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
  editors?: User[];
  id?: string;
  modifiedAt?: number;
  name?: string;
  owner?: User;
  viewers?: User[];
};

export type User = UserBase & {
  checks?: DocumentReference<DocumentData>[];
};

export type UserAdmin = UserBase & {
  checks?: DocumentReferenceAdmin<DocumentDataAdmin>[];
};

type UserBase = {
  displayName?: FirebaseUser["displayName"];
  email?: FirebaseUser["email"];
  profilePhoto?: FirebaseUser["photoURL"];
  uid?: FirebaseUser["uid"];
};
