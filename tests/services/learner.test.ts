import { faker } from "@faker-js/faker";
import { LearnerService } from "@services/learner.service";
import { describe, expect, it, vi } from "vitest";

describe("LearnerService", () => {
  const mockAuth = { updateUser: vi.fn() };
  const mockFirestore = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({ update: vi.fn(), set: vi.fn() }),
    }),
  };
  const mockStorage = {
    bucket: vi.fn().mockReturnValue({
      file: vi
        .fn()
        .mockReturnValue({ save: vi.fn().mockResolvedValueOnce(undefined) }),
    }),
  };
  const mockDownscaleImage = vi.fn().mockResolvedValue(Buffer.from([]));

  const dependencies = {
    auth: mockAuth as any,
    firestore: mockFirestore as any,
    storage: mockStorage as any,
    GCS_BUCKET_NAME: "mockBucket",
    downscaleImage: mockDownscaleImage,
  };

  const learnerService = new LearnerService(dependencies);

  describe("updateLearnerProfile", () => {
    it("should update learner profile", async () => {
      const userId = faker.string.uuid();
      const data = {
        name: faker.person.fullName(),
      };

      await learnerService.updateLearnerProfile(userId, data);

      expect(mockFirestore.collection).toHaveBeenCalledWith("learners");
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: data.name,
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe("updateLearnerProfilePicture", () => {
    it("should upload learner profile picture", async () => {
      const file = { buffer: Buffer.from("image") } as Express.Multer.File;
      const userId = faker.string.uuid();
      const filePath = `profile-pictures/${userId}.jpg`;

      const result = await learnerService.updateLearnerProfilePicture(
        file,
        userId,
      );

      expect(mockStorage.bucket).toHaveBeenCalledWith("mockBucket");
      expect(mockStorage.bucket().file).toHaveBeenCalledWith(filePath);
      expect(mockStorage.bucket().file().save).toHaveBeenCalledWith(
        Buffer.from(""),
        { public: true },
      );
      expect(result).toBe(
        `https://storage.googleapis.com/mockBucket/${filePath}`,
      );
    });
  });

  describe("changePassword", () => {
    it("should change learner password", async () => {
      const userId = faker.string.uuid();
      const newPassword = faker.internet.password();

      await learnerService.changePassword(userId, newPassword);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
    });
  });

  describe("validateInterests", () => {
    it("should validate interests", async () => {
      const interests = ["Math", "Science"];
      const subjectsSnapshot = {
        docs: [{ id: "Math" }, { id: "Science" }, { id: "History" }],
      };

      mockFirestore.collection().get = vi
        .fn()
        .mockResolvedValue(subjectsSnapshot as any);

      const result = await learnerService.validateInterests(interests);

      expect(result).toBe(true);
    });

    it("should return false if invalid interest is provided", async () => {
      const interests = ["Math", "Geography"];
      const subjectsSnapshot = {
        docs: [{ id: "Math" }, { id: "Science" }, { id: "History" }],
      };

      mockFirestore.collection().get = vi
        .fn()
        .mockResolvedValue(subjectsSnapshot as any);

      const result = await learnerService.validateInterests(interests);

      expect(result).toBe(false);
    });
  });
});
