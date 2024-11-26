import { FCMService } from "@/common/fcm.service";
import { AuthRepository } from "./auth.repository";
import { logger } from "@middleware/logging.middleware";

type AuthServiceDependencies = {
  authRepository: AuthRepository;
  fcmService: FCMService;
};

export class AuthService {
  private authRepository: AuthRepository;
  private fcmService: FCMService;

  constructor({ authRepository, fcmService }: AuthServiceDependencies) {
    this.authRepository = authRepository;
    this.fcmService = fcmService;
  }

  async registerLearner(name: string, email: string, password: string) {
    const learner = await this.authRepository.registerUser({
      name,
      email,
      password,
      role: "learner",
    });

    return { userId: learner.id };
  }

  async registerTutor(name: string, email: string, password: string) {
    const tutor = await this.authRepository.registerUser({
      name,
      email,
      password,
      role: "tutor",
    });

    return { userId: tutor.id };
  }

  async getUser(userId: string) {
    try {
      const user = await this.authRepository.getUser(userId);
      return user;
    } catch (error) {
      logger.error(`Failed to get user: ${error}`);
      return null;
    }
  }

  async login(email: string, password: string) {
    const user = await this.authRepository.login(email, password);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    return { id: user.id, role: user.role };
  }

  async storeFCMToken(userId: string, token: string) {
    await this.fcmService.storeUserToken(userId, token);
  }

  async removeFCMToken(userId: string, token: string) {
    await this.fcmService.removeUserToken(userId, token);
  }
}
