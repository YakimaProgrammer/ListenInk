export type Success = "success";
export type Pending = "pending";
export type Failure = "failure";
export type LoadingState = Success | Pending | Failure;

export type PromiseState<T> =
  (T & { status: Success })
  | { status: Pending }
  | { status: Failure, message: string };
