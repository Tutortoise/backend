import { db } from "@/db/config";
import { AuthRepository } from "@/module/auth/auth.repository";
import { SubjectRepository } from "./module/subject/subject.repository";

interface Container {
  authRepository: AuthRepository;
  subjectRepository: SubjectRepository;
}

let containerInstance: Container | null = null;

export const setupContainer = (): Container => {
  if (!containerInstance) {
    containerInstance = {
      authRepository: new AuthRepository(db),
      subjectRepository: new SubjectRepository(db),
    };
  }

  return containerInstance;
};

export const container = setupContainer();
