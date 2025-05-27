export type Success = "success";
export type Pending = "pending";
export type Failure = "failure";
export type LoadingState = Success | Pending | Failure;

export type PromiseState<T> =
  (T & { status: Success })
  | { status: Pending }
  | { status: Failure, message: string };

// This is me being evil in TypeScript.
// This lets me dynamically create types like: {id: string, open: boolean}
// This is useful for writing single-purpose reducer actions without
// writing a massive amount of similar interfaces.
export type StateChange<K extends string, T> = { id: string } & { [P in K]: T };
