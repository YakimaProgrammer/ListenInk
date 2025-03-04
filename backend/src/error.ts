import { Err } from "./types";

/** Represents a 400/user error with the API. Pairs nicely with prisma.$transaction. Use Error for an internal server error. */
export class APIError extends Error {
  details: Err
  constructor(reason: Err) {
    super(reason.err);
    this.details = reason;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}
