export class MethodError extends Error {
  constructor(message) {
    super(message);

    // Maintains proper stack trace for thrown error (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MethodError);
    }

    this.name = "MethodError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);

    // Maintains proper stack trace for thrown error (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }

    this.name = "ValidationError";
  }
}
