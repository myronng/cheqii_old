import { Theme } from "@mui/material/styles";
import { User as FirebaseUser } from "firebase/auth";
import { DocumentData, DocumentReference } from "firebase/firestore";
import {
  DocumentData as DocumentDataAdmin,
  DocumentReference as DocumentReferenceAdmin,
} from "firebase-admin/firestore";
import { ReactNode } from "react";
import { LocaleStrings } from "services/locale";

declare module "@mui/material/styles/createPalette" {
  export interface TypeBackground {
    secondary?: string;
  }
}
export type AccessType = "owner" | "editor" | "viewer";

export type AuthUser = {
  displayName: FirebaseUser["displayName"];
  email: FirebaseUser["email"];
  isAnonymous?: FirebaseUser["isAnonymous"];
  photoURL: FirebaseUser["photoURL"];
  uid: FirebaseUser["uid"];
} | null;

export interface BaseProps {
  children: ReactNode;
  className?: string;
  strings: LocaleStrings;
}

export interface Check {
  contributors: ContributorServer[];
  editor: CheckUser;
  invite: {
    id: string;
    required: boolean;
    type: AccessType;
  };
  items: ItemServer[];
  owner: CheckUser;
  title: string;
  updatedAt: number;
  viewer: CheckUser;
}

export type CheckDataForm = {
  contributors: ContributorForm[];
  items: ItemForm[];
  title: FormState<string>;
};

export type CheckDataServer = Pick<Check, "contributors" | "items" | "title">;

export interface CheckSettings {
  editor: CheckUser;
  invite: {
    id: string;
    required: boolean;
    type: AccessType;
  };
  owner: CheckUser;
  viewer: CheckUser;
}

interface CheckUser {
  [uid: string]: Pick<User, "displayName" | "email" | "photoURL" | "uid">;
}

interface ContributorForm {
  id: string;
  name: FormState<string>;
}

interface ContributorServer {
  id: string;
  name: string;
}

export interface FormState<T> {
  clean: T;
  dirty: T;
}

interface ItemForm {
  buyer: FormState<number>;
  cost: FormState<string>;
  id: string;
  name: FormState<string>;
  split: FormState<string>[];
}

interface ItemServer {
  buyer: number;
  cost: number;
  id: string;
  name: string;
  split: number[];
}

export type User = UserBase<DocumentReference<DocumentData>[]>;

export type UserAdmin = UserBase<DocumentReferenceAdmin<DocumentDataAdmin>[]>;

interface UserBase<C> {
  checks?: C;
  displayName?: AuthUser["displayName"];
  email?: AuthUser["email"];
  photoURL?: AuthUser["photoURL"];
  uid?: AuthUser["uid"];
  updatedAt: number;
}
