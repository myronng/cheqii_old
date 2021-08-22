import {
  DocumentData as DocumentDataAdmin,
  DocumentReference as DocumentReferenceAdmin,
} from "@google-cloud/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { DocumentData, DocumentReference } from "firebase/firestore";
import { ReactNode } from "react";

declare module "@material-ui/core/styles/createPalette" {
  export interface TypeBackground {
    dark?: string;
    light?: string;
  }
}

export type BaseProps = StyledProps & {
  children?: ReactNode;
};

export type StyledProps = {
  className?: string;
};

export type Check = {
  contributors?: Contributor[];
  editors?: {
    [key: string]: User;
  };
  id?: string;
  items?: Item[];
  modifiedAt?: number;
  name?: string;
  owners?: {
    [key: string]: User;
  };
  viewers?: {
    [key: string]: User;
  };
};

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

interface UserBase<C> {
  checks?: C;
  displayName?: FirebaseUser["displayName"];
  email?: FirebaseUser["email"];
  photoURL?: FirebaseUser["photoURL"];
}
