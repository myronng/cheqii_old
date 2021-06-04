import type { HttpMethodType } from "services/middleware";

export class MethodError extends Error {
  allowedMethods: HttpMethodType;

  constructor(methods: HttpMethodType) {
    super("Method Not Allowed");

    // Maintains proper stack trace for thrown error (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MethodError);
    }

    this.name = "MethodError";
    this.allowedMethods = methods;
  }
}

export class ValidationError extends Error {
  constructor(message?: string) {
    super(message);

    // Maintains proper stack trace for thrown error (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    this.name = "ValidationError";
  }
}
