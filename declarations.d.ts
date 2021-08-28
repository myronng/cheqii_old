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

export interface BaseProps {
  children: ReactNode;
  className?: string;
  strings: LocaleStrings;
}

export interface Check {
  contributors?: Contributor[];
  editor?: CheckUsers;
  id?: string;
  items?: Item[];
  modifiedAt?: number;
  name?: string;
  owner?: CheckUsers;
  viewer?: CheckUsers;
}

export interface CheckUsers {
  [key: string]: Omit<User, "checks">;
}

export type Contributor = string;

export interface Item {
  buyer?: number;
  cost?: number;
  id?: string;
  name?: string;
  split?: number[];
}

export type User = UserBase<DocumentReference<DocumentData>[]>;

export type UserAdmin = UserBase<DocumentReferenceAdmin<DocumentDataAdmin>[]>;

interface UserBase<C> {
  checks?: C;
  displayName?: FirebaseUser["displayName"];
  email?: FirebaseUser["email"];
  photoURL?: FirebaseUser["photoURL"];
  uid?: FirebaseUser["uid"];
}
