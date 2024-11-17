import { faker } from "@faker-js/faker";
import { TutorServiceService } from "@services/tutorService.service";
import firebase from "firebase-admin";
import { describe, expect, it, vi } from "vitest";

describe("TutorServiceService", () => {
  const mockFirestore = {
    batch: vi.fn(),
    collection: vi.fn(),
  };

  const firestore = mockFirestore as any;
  const service = new TutorServiceService({ firestore });

  describe("createTutorService", () => {
    it("should successfully create a tutor service", async () => {
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };

      const tutorId = faker.string.uuid();
      const subjectId = faker.string.uuid();
      const mockData = {
        subjectId,
        aboutYou: faker.lorem.sentence(),
        teachingMethodology: faker.lorem.paragraph(),
        hourlyRate: faker.helpers.arrayElement([
          50_000, 100_000, 150_000, 200_000,
        ]),
      };

      const tutorRef = { id: tutorId };
      const subjectRef = { id: subjectId };
      const newServiceRef = { id: faker.string.uuid() };

      firestore.batch.mockReturnValue(mockBatch);
      firestore.collection.mockImplementation((collectionName: string) => {
        switch (collectionName) {
          case "tutors":
            return { doc: vi.fn(() => tutorRef) };
          case "subjects":
            return { doc: vi.fn(() => subjectRef) };
          case "tutor_services":
            return { doc: vi.fn(() => newServiceRef) };
          default:
            return {};
        }
      });

      await service.createTutorService(tutorId, mockData);

      expect(firestore.batch).toHaveBeenCalled();
      expect(firestore.collection).toHaveBeenCalledWith("tutors");
      expect(firestore.collection).toHaveBeenCalledWith("subjects");
      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(mockBatch.set).toHaveBeenCalledWith(newServiceRef, {
        tutorId: tutorRef,
        subjectId: subjectRef,
        aboutYou: mockData.aboutYou,
        teachingMethodology: mockData.teachingMethodology,
        hourlyRate: mockData.hourlyRate,
        createdAt: expect.any(Date),
      });
      expect(mockBatch.update).toHaveBeenCalledWith(tutorRef, {
        services: firebase.firestore.FieldValue.arrayUnion(newServiceRef),
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("should throw an error if batch commit fails", async () => {
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error("Commit failed (test)")),
      };

      firestore.batch.mockReturnValue(mockBatch);

      const tutorId = faker.string.uuid();
      const mockData = {
        subjectId: faker.string.uuid(),
        aboutYou: faker.lorem.sentence(),
        teachingMethodology: faker.lorem.paragraph(),
        hourlyRate: faker.helpers.arrayElement([
          50_000, 100_000, 150_000, 200_000,
        ]),
      };

      await expect(
        service.createTutorService(tutorId, mockData),
      ).rejects.toThrow(
        "Failed to create tutor service: Error: Commit failed (test)",
      );
    });
  });

  describe("updateTutorService", () => {
    it("should successfully update a tutor service", async () => {
      const serviceId = faker.string.uuid();
      const mockData = {
        aboutYou: faker.lorem.sentence(),
        teachingMethodology: faker.lorem.paragraph(),
        hourlyRate: faker.helpers.arrayElement([
          50_000, 100_000, 150_000, 200_000,
        ]),
      };

      const updateMock = vi.fn().mockResolvedValue({});
      firestore.collection.mockReturnValue({
        doc: vi.fn(() => ({ update: updateMock })),
      });

      await service.updateTutorService(serviceId, mockData);

      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(updateMock).toHaveBeenCalledWith({
        ...mockData,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("validateTutorServiceOwnership", () => {
    it("should return true if tutor owns the service", async () => {
      const tutorId = faker.string.uuid();
      const serviceId = faker.string.uuid();
      const mockServiceData = {
        tutorId: { id: tutorId },
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: vi.fn(() => mockServiceData),
      });

      firestore.collection.mockReturnValue({
        doc: vi.fn(() => ({ get: mockGet })),
      });

      const result = await service.validateTutorServiceOwnership(
        tutorId,
        serviceId,
      );

      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(mockGet).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if the service does not exist", async () => {
      const tutorId = faker.string.uuid();
      const serviceId = faker.string.uuid();

      const mockGet = vi.fn().mockResolvedValue({ exists: false });

      firestore.collection.mockReturnValue({
        doc: vi.fn(() => ({ get: mockGet })),
      });

      const result = await service.validateTutorServiceOwnership(
        tutorId,
        serviceId,
      );

      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(mockGet).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return false if the tutor does not own the service", async () => {
      const tutorId = faker.string.uuid();
      const serviceId = faker.string.uuid();
      const anotherTutorId = faker.string.uuid();
      const mockServiceData = {
        tutorId: { id: anotherTutorId },
      };

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: vi.fn(() => mockServiceData),
      });

      firestore.collection.mockReturnValue({
        doc: vi.fn(() => ({ get: mockGet })),
      });

      const result = await service.validateTutorServiceOwnership(
        tutorId,
        serviceId,
      );

      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(mockGet).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
