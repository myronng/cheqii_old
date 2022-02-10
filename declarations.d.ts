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
  contributors: Contributor[];
  editor: CheckUser;
  invite: {
    id: string;
    required: boolean;
    type: AccessType;
  };
  items: Item[];
  owner: CheckUser;
  title: string;
  updatedAt: number;
  viewer: CheckUser;
}

interface CheckUser {
  [uid: string]: Pick<User, "displayName" | "email" | "photoURL" | "uid">;
}

export interface Contributor {
  id: string;
  name: string;
}

export interface Item {
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
