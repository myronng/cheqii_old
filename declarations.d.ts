declare module "@material-ui/core/styles/createPalette" {
  export interface TypeBackground {
    secondary?: string;
  }
}

declare module "@firebase/auth/dist/auth-exp-public" {
  export interface User {
    accessToken: string;
  }
}

export {};
