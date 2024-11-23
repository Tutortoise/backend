import { db } from "@/db/config";
import { AuthRepository } from "@/module/auth/auth.repository";

interface Container {
  authRepository: AuthRepository;
}

let containerInstance: Container | null = null;

export const setupContainer = (): Container => {
  if (!containerInstance) {
    containerInstance = {
      authRepository: new AuthRepository(db),
    };
  }

  return containerInstance;
};

export const container = setupContainer();
