import type { Learner, Tutor } from "./types";

// https://stackoverflow.com/a/69328045/13838937
// To make a property non-optional
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type LearnerWithId = WithRequired<Learner, "id">;
type TutorWithId = WithRequired<Tutor, "id">;

declare global {
  namespace Express {
    interface Request {
      learner: LearnerWithId;
      tutor: TutorWithId;
    }
  }
}
