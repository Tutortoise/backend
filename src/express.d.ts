import type { Learner, Tutor } from "./types";

declare global {
  namespace Express {
    interface Request {
      learner: { id: string };
      tutor: { id: string };
    }
  }
}
