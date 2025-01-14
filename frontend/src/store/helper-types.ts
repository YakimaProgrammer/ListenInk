export type PromiseState<T> = (T & { status: "success" })
  | { status: "pending" }
  | { status: "failure"; message: string };
