interface Error {
  success: false;
  err: string;
}

/** Represents a 400/user error with the API. Pairs nicely with prisma.$transaction. Use Error for an internal server error. */
export class APIError extends Error {
  details: Error;
  constructor(reason: string) {
    super(reason);
    this.details = { success: false, err: reason };
    Object.setPrototypeOf(this, APIError.prototype);
  }
}
