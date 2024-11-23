import { db } from "@/db/config";
import { AuthRepository } from "@/module/auth/auth.repository";
import { SubjectRepository } from "./module/subject/subject.repository";
import { LearnerRepository } from "./module/learner/learner.repository";
import { TutorRepository } from "./module/tutor/tutor.repository";

interface Container {
  authRepository: AuthRepository;
  subjectRepository: SubjectRepository;
  learnerRepository: LearnerRepository;
  tutorRepository: TutorRepository;
}

let containerInstance: Container | null = null;

export const setupContainer = (): Container => {
  if (!containerInstance) {
    containerInstance = {
      authRepository: new AuthRepository(db),
      subjectRepository: new SubjectRepository(db),
      learnerRepository: new LearnerRepository(db),
      tutorRepository: new TutorRepository(db),
    };
  }

  return containerInstance;
};

export const container = setupContainer();
