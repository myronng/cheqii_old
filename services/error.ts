import type { HttpMethodType } from "services/middleware";

export class MethodError extends Error {
  allowedMethods: HttpMethodType;

  constructor(methods: HttpMethodType) {
    super("Method Not Allowed");

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MethodError);
    }

    this.name = "MethodError";
    this.allowedMethods = methods;
  }
}

export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedError);
    }

    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message?: string) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    this.name = "ValidationError";
  }
}
