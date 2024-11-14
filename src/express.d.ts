import type { User, Tutor } from "@/types";

declare global {
  namespace Express {
    interface Request {
      user: User;
      tutor: Tutor;
    }
  }
}
