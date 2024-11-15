import type { Learner, Tutor } from "./types";

declare global {
  namespace Express {
    interface Request {
      learner: Learner;
      tutor: Tutor;
    }
  }
}
