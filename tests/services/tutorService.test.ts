import { faker } from "@faker-js/faker";
import { TutorServiceService } from "@/module/tutor-service/tutorService.service";
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
        typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
        availability: { 1: ["08:00", "10:00"] },
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
        typeLesson: mockData.typeLesson,
        availability: mockData.availability,
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
        typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
        availability: { 0: ["08:00", "10:00"] },
      };

      await expect(
        service.createTutorService(tutorId, mockData),
      ).rejects.toThrow(
        "Failed to create tutor service: Error: Commit failed (test)",
      );
    });
  });

  describe("getTutorServices", () => {
    it("should return filtered tutor services", async () => {
      const mockServices = [
        {
          id: "service1",
          tutorId: { id: "tutor1" },
          subjectId: { id: "subject1" },
          hourlyRate: 100000,
          typeLesson: "online",
        },
        {
          id: "service2",
          tutorId: { id: "tutor2" },
          subjectId: { id: "subject2" },
          hourlyRate: 150000,
          typeLesson: "offline",
        },
      ];

      const mockTutors = [
        { id: "tutor1", name: "John Doe" },
        { id: "tutor2", name: "Jane Smith" },
      ];

      const mockSubjects = [
        { id: "subject1", name: "Mathematics" },
        { id: "subject2", name: "Physics" },
      ];

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: mockServices.map((service) => ({
            id: service.id,
            data: () => service,
          })),
        }),
      };

      const mockDoc = vi.fn().mockReturnValue({
        id: "subject1",
      });

      firestore.collection.mockImplementation((collection: string) => {
        switch (collection) {
          case "tutor_services":
            return {
              ...mockQuery,
              doc: mockDoc,
            };
          case "tutors":
            return {
              where: vi.fn().mockReturnThis(),
              get: vi.fn().mockResolvedValue({
                docs: mockTutors.map((tutor) => ({
                  id: tutor.id,
                  data: () => ({ name: tutor.name }),
                })),
              }),
            };
          case "subjects":
            return {
              where: vi.fn().mockReturnThis(),
              get: vi.fn().mockResolvedValue({
                docs: mockSubjects.map((subject) => ({
                  id: subject.id,
                  data: () => ({ name: subject.name }),
                })),
              }),
              doc: mockDoc,
            };
          default:
            return {};
        }
      });
      firestore.doc = mockDoc;

      const filters = {
        q: "john",
        subjectId: "subject1",
        minHourlyRate: 50000,
        maxHourlyRate: 200000,
        typeLesson: "online",
      };

      const result = await service.getTutorServices(filters);

      expect(mockQuery.where).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "service1",
          tutorName: "John Doe",
          subjectName: "Mathematics",
        }),
      );

      expect(mockDoc).toHaveBeenCalledWith(`/subjects/${filters.subjectId}`);
    });

    it("should handle empty results", async () => {
      firestore.collection.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      });

      const result = await service.getTutorServices({});
      expect(result).toHaveLength(0);
    });

    it("should handle invalid data", async () => {
      const mockServices = [
        {
          id: "service1",
          tutorId: { id: "nonexistent" },
          subjectId: { id: "nonexistent" },
        },
      ];

      firestore.collection.mockImplementation((collection: string) => {
        if (collection === "tutor_services") {
          return {
            get: vi.fn().mockResolvedValue({
              docs: mockServices.map((service) => ({
                id: service.id,
                data: () => service,
              })),
            }),
          };
        }
        return {
          where: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ docs: [] }),
        };
      });

      const result = await service.getTutorServices({});
      expect(result).toHaveLength(0);
    });
  });

  describe("getTutorServiceDetail", () => {
    it("should return detailed service information", async () => {
      const serviceId = faker.string.uuid();
      const mockService = {
        tutorId: { id: "tutor1", get: vi.fn() },
        subjectId: { id: "subject1", get: vi.fn() },
        hourlyRate: 100000,
        typeLesson: "online",
        aboutYou: "About me",
        teachingMethodology: "My methodology",
      };

      const mockTutor = {
        exists: true,
        data: () => ({ name: "John Doe" }),
      };

      const mockSubject = {
        exists: true,
        data: () => ({ name: "Mathematics" }),
      };

      mockService.tutorId.get.mockResolvedValue(mockTutor);
      mockService.subjectId.get.mockResolvedValue(mockSubject);

      firestore.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            id: serviceId,
            data: () => mockService,
          }),
        }),
      });

      const result = await service.getTutorServiceDetail(serviceId);

      expect(result).toEqual({
        id: serviceId,
        tutorName: "John Doe",
        subjectName: "Mathematics",
        hourlyRate: 100000,
        typeLesson: "online",
        aboutYou: "About me",
        teachingMethodology: "My methodology",
      });
    });

    it("should handle nonexistent service", async () => {
      firestore.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: false,
          }),
        }),
      });

      const result = await service.getTutorServiceDetail("nonexistent");
      expect(result).toBeNull();
    });

    it("should handle missing related data", async () => {
      const mockService = {
        tutorId: { get: vi.fn().mockResolvedValue({ exists: false }) },
        subjectId: { get: vi.fn().mockResolvedValue({ exists: false }) },
      };

      firestore.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => mockService,
          }),
        }),
      });

      const result = await service.getTutorServiceDetail("invalid");
      expect(result).toBeNull();
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
        availability: { 0: ["10:00"] },
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

  describe("deleteTutorService", () => {
    it("should successfully delete a tutor service and remove it from the tutor's services array", async () => {
      const mockBatch = {
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn(),
      };

      const tutorId = faker.string.uuid();
      const serviceId = faker.string.uuid();
      const serviceDocRef = { id: serviceId };
      const tutorDocRef = { id: tutorId };

      firestore.batch.mockReturnValue(mockBatch);
      firestore.collection.mockImplementation((collectionName: string) => {
        switch (collectionName) {
          case "tutor_services":
            return { doc: vi.fn(() => serviceDocRef) };
          case "tutors":
            return { doc: vi.fn(() => tutorDocRef) };
          default:
            return {};
        }
      });

      await service.deleteTutorService(tutorId, serviceId);

      expect(firestore.batch).toHaveBeenCalled();
      expect(firestore.collection).toHaveBeenCalledWith("tutor_services");
      expect(firestore.collection).toHaveBeenCalledWith("tutors");
      expect(mockBatch.delete).toHaveBeenCalledWith(serviceDocRef);
      expect(mockBatch.update).toHaveBeenCalledWith(tutorDocRef, {
        services: firebase.firestore.FieldValue.arrayRemove(serviceDocRef),
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("should throw an error if batch commit fails", async () => {
      const mockBatch = {
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error("Commit failed (test)")),
      };

      firestore.batch.mockReturnValue(mockBatch);

      const tutorId = faker.string.uuid();
      const serviceId = faker.string.uuid();
      const serviceDocRef = { id: serviceId };
      const tutorDocRef = { id: tutorId };

      firestore.collection.mockImplementation((collectionName: string) => {
        switch (collectionName) {
          case "tutor_services":
            return { doc: vi.fn(() => serviceDocRef) };
          case "tutors":
            return { doc: vi.fn(() => tutorDocRef) };
          default:
            return {};
        }
      });

      await expect(
        service.deleteTutorService(tutorId, serviceId),
      ).rejects.toThrow(
        "Failed to delete tutor service: Error: Commit failed (test)",
      );

      expect(mockBatch.delete).toHaveBeenCalledWith(serviceDocRef);
      expect(mockBatch.update).toHaveBeenCalledWith(tutorDocRef, {
        services: firebase.firestore.FieldValue.arrayRemove(serviceDocRef),
      });
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
