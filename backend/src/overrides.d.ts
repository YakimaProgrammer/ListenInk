import { User as ListenInkUser } from "./types";

declare global {
  namespace Express {
    interface User extends ListenInkUser {}
  }
}
