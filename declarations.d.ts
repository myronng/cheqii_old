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

export type Check = CheckBase<ServerState, number>;

interface CheckBase<S, T> {
  contributors: Contributor<S>[];
  editor: CheckUser;
  invite: {
    id: string;
    required: boolean;
    type: AccessType;
  };
  items: Item<S, T>[];
  owner: CheckUser;
  title: S<string>;
  updatedAt: number;
  viewer: CheckUser;
}

export type CheckInput = CheckBase<FormState, string>;

interface CheckUser {
  [uid: string]: Pick<User, "displayName" | "email" | "photoURL" | "uid">;
}

interface Contributor<S> {
  id: string;
  name: S<string>;
}

interface Item<S, T> {
  buyer: S<number>;
  cost: S<T>;
  id: string;
  name: S<string>;
  split: S<T>[];
}

interface FormState<T> {
  clean: T;
  dirty: T;
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
