import { faker } from "@faker-js/faker";
import { TutorService } from "@services/tutor.service";
import { describe, expect, it, vi } from "vitest";

describe("TutorService", () => {
  const GCS_BUCKET_NAME = "mockBucket";

  const mockAuth = { updateUser: vi.fn() };
  const mockFirestore = {
    collection: vi.fn().mockReturnValue({
      doc: vi
        .fn()
        .mockReturnValue({ update: vi.fn(), set: vi.fn(), get: vi.fn() }),
      get: vi.fn(),
    }),
  };
  const mockBucket = {
    file: vi.fn().mockImplementation((name) => {
      const publicUrlMock = vi
        .fn()
        .mockReturnValue(
          `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${name}`,
        );

      return {
        save: vi.fn(),
        publicUrl: publicUrlMock,
      };
    }),
    name: GCS_BUCKET_NAME,
  };
  const mockDownscaleImage = vi.fn().mockResolvedValue(Buffer.from([]));
  const mockGetCityName = vi.fn().mockResolvedValue("Samarinda");

  const tutorService = new TutorService({
    auth: mockAuth as any,
    firestore: mockFirestore as any,
    bucket: mockBucket as any,
    downscaleImage: mockDownscaleImage as any,
    getCityName: mockGetCityName as any,
  });

  describe("updateProfile", () => {
    it("should update tutor profile", async () => {
      const userId = faker.string.uuid();
      const data = {
        name: faker.person.fullName(),
      };

      await tutorService.updateProfile(userId, data);

      expect(mockFirestore.collection).toHaveBeenCalledWith("tutors");
      expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: data.name,
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe("updateProfilePicture", () => {
    it("should upload tutor profile picture", async () => {
      const file = { buffer: Buffer.from("image") } as Express.Multer.File;
      const userId = faker.string.uuid();
      const filePath = `profile-pictures/${userId}.jpg`;

      const result = await tutorService.updateProfilePicture(file, userId);

      expect(mockBucket.file).toHaveBeenCalledWith(filePath);
      expect(result).toBe(
        `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filePath}`,
      );
    });
  });

  describe("changePassword", () => {
    it("should change tutor password", async () => {
      const userId = faker.string.uuid();
      const newPassword = faker.internet.password();

      await tutorService.changePassword(userId, newPassword);

      expect(mockAuth.updateUser).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
    });
  });

  describe("checkTutorExists", () => {
    it("should return true if the tutor exists", async () => {
      const tutorId = "existing-tutor";
      mockFirestore.collection().doc().get.mockResolvedValue({ exists: true });

      const result = await tutorService.checkTutorExists(tutorId);

      expect(mockFirestore.collection).toHaveBeenCalledWith("tutors");
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith(tutorId);
      expect(result).toBe(true);
    });
  });

  describe("validateServices", () => {
    it("should validate tutor services", async () => {
      const services = ["mathService", "scienceService"];
      const mockDocs = [
        { id: "mathService" },
        { id: "scienceService" },
        { id: "historyService" },
      ];
      mockFirestore
        .collection("tutor_services")
        .get.mockResolvedValue({ docs: mockDocs });

      const result = await tutorService.validateServices(services);

      expect(mockFirestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(result).toBe(true);
    });

    it("should handle invalid tutor services", async () => {
      const services = ["mathService", "invalidService"];
      const mockDocs = [
        { id: "mathService" },
        { id: "scienceService" },
        { id: "historyService" },
      ];
      mockFirestore
        .collection("tutor_services")
        .get.mockResolvedValue({ docs: mockDocs });

      const result = await tutorService.validateServices(services);

      expect(mockFirestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(result).toBe(false);
    });
  });
});
