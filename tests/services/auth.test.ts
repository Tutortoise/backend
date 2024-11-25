import { faker } from "@faker-js/faker";
import { AuthService } from "@/module/auth/auth.service";
import { describe, expect, it, vi } from "vitest";

describe("AuthService", () => {
  const mockAuthRepository = {
    registerUser: vi.fn(),
  };

  const mockFCMService = {
    storeUserToken: vi.fn(),
    removeUserToken: vi.fn(),
  };

  const authService = new AuthService({
    authRepository: mockAuthRepository as any,
    fcmService: mockFCMService as any,
  });

  describe("registerLearner", () => {
    it("should register a learner with the provided details", async () => {
      const learnerId = faker.string.uuid();
      mockAuthRepository.registerUser.mockResolvedValue({ id: learnerId });

      const learnerData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const result = await authService.registerLearner(
        learnerData.name,
        learnerData.email,
        learnerData.password,
      );

      expect(mockAuthRepository.registerUser).toHaveBeenCalledWith({
        name: learnerData.name,
        email: learnerData.email,
        password: learnerData.password,
        role: "learner",
      });
      expect(result).toEqual({ userId: learnerId });
    });
  });

  describe("registerTutor", () => {
    it("should register a tutor with the provided details", async () => {
      const tutorId = faker.string.uuid();
      mockAuthRepository.registerUser.mockResolvedValue({ id: tutorId });

      const tutorData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const result = await authService.registerTutor(
        tutorData.name,
        tutorData.email,
        tutorData.password,
      );

      expect(mockAuthRepository.registerUser).toHaveBeenCalledWith({
        name: tutorData.name,
        email: tutorData.email,
        password: tutorData.password,
        role: "tutor",
      });
      expect(result).toEqual({ userId: tutorId });
    });
  });

  describe("storeFCMToken", () => {
    it("should store the FCM token for the given user", async () => {
      const userId = faker.string.uuid();
      const token = faker.string.alphanumeric(20);

      await authService.storeFCMToken(userId, token);

      expect(mockFCMService.storeUserToken).toHaveBeenCalledWith(userId, token);
    });
  });

  describe("removeFCMToken", () => {
    it("should remove the FCM token for the given user", async () => {
      const userId = faker.string.uuid();
      const token = faker.string.alphanumeric(20);

      await authService.removeFCMToken(userId, token);

      expect(mockFCMService.removeUserToken).toHaveBeenCalledWith(
        userId,
        token,
      );
    });
  });
});
