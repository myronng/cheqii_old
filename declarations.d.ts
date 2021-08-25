import {
  DocumentData as DocumentDataAdmin,
  DocumentReference as DocumentReferenceAdmin,
} from "@google-cloud/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { DocumentData, DocumentReference } from "firebase/firestore";
import { ReactNode } from "react";
import { LocaleStrings } from "services/locale";

declare module "@material-ui/core/styles/createPalette" {
  export interface TypeBackground {
    dark?: string;
    light?: string;
  }
}

export type BaseProps = {
  children: ReactNode;
  className?: string;
  strings: LocaleStrings;
};

export type Check = {
  contributors?: Contributor[];
  editors?: {
    [key: string]: CheckUser;
  };
  id?: string;
  items?: Item[];
  modifiedAt?: number;
  name?: string;
  owners?: {
    [key: string]: CheckUser;
  };
  viewers?: {
    [key: string]: CheckUser;
  };
};

export type CheckUser = Omit<User, "checks">;

export type Contributor = string;

export type Item = {
  buyer?: number;
  cost?: number;
  id?: string;
  name?: string;
  split?: number[];
};

export type User = UserBase<DocumentReference<DocumentData>[]>;

export type UserAdmin = UserBase<DocumentReferenceAdmin<DocumentDataAdmin>[]>;

type UserBase<C> = {
  checks?: C;
  displayName?: FirebaseUser["displayName"];
  email?: FirebaseUser["email"];
  photoURL?: FirebaseUser["photoURL"];
  uid?: FirebaseUser["uid"];
};
