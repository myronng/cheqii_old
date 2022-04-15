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
  contributors: Contributor<ServerState>[];
  editor: CheckUser;
  invite: {
    id: string;
    required: boolean;
    type: AccessType;
  };
  items: Item<ServerState, number>[];
  owner: CheckUser;
  title: ServerState<string>;
  updatedAt: number;
  viewer: CheckUser;
}

export type CheckDataForm = {
  contributors: Contributor<FormState>[];
  items: Item<FormState, string>[];
  title: FormState<string>;
};

export type CheckDataServer = {
  contributors: Contributor<ServerState>[];
  items: Item<ServerState, T>[];
  title: ServerState<string>;
};

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

interface Contributor<S> {
  id: string;
  name: S<string>;
}

export interface FormState<T> {
  clean: T;
  dirty: T;
}

interface Item<S, T> {
  buyer: S<number>;
  cost: S<T>;
  id: string;
  name: S<string>;
  split: S<T>[];
}

type ServerState<T> = T;

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
