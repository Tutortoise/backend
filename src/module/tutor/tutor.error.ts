export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }

  static isFaceValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  }
}
