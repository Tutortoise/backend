import { faker } from "@faker-js/faker";
import { AuthService } from "@/module/auth/auth.service";
import { describe, expect, it, vi } from "vitest";

describe("AuthService", () => {
  const mockAuth = {
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
  };

  const mockFirestore = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn(),
      }),
    }),
  };

  const authService = new AuthService({
    auth: mockAuth as any,
    firestore: mockFirestore as any,
  });

  describe("registerLearner", () => {
    it("should create a learner and store details in the learners collection", async () => {
      const mockUser = { uid: faker.string.uuid() };
      mockAuth.createUser.mockResolvedValue(mockUser);

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

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        displayName: learnerData.name,
        email: learnerData.email,
        password: learnerData.password,
      });
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith(mockUser.uid);
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith({
        name: learnerData.name,
        createdAt: expect.any(Date),
      });
      expect(result).toEqual({ userId: mockUser.uid });
    });
  });

  describe("registerTutor", () => {
    it("should create a tutor and store details in the tutors collection", async () => {
      const mockUser = { uid: faker.string.uuid() };
      mockAuth.createUser.mockResolvedValue(mockUser);

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

      expect(mockAuth.createUser).toHaveBeenCalledWith({
        displayName: tutorData.name,
        email: tutorData.email,
        password: tutorData.password,
      });
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith(mockUser.uid);
      expect(mockFirestore.collection().doc().set).toHaveBeenCalledWith({
        name: tutorData.name,
        createdAt: expect.any(Date),
      });
      expect(result).toEqual({ userId: mockUser.uid });
    });
  });
});
