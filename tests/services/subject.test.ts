import { SubjectService } from "@/module/subject/subject.service";
import { describe, expect, it, vi } from "vitest";

describe("SubjectService", () => {
  const mockFirestore = {
    collection: vi.fn(),
  };
  const subjectService = new SubjectService({
    firestore: mockFirestore as any,
  });

  describe("getAllSubjects", () => {
    it("should return a list of subjects", async () => {
      const mockDocs = [
        {
          id: "1",
          data: vi.fn().mockReturnValue({
            name: "Math",
            iconUrl: "http://example.com/math-icon",
          }),
        },
        {
          id: "2",
          data: vi.fn().mockReturnValue({
            name: "Science",
            iconUrl: "http://example.com/science-icon",
          }),
        },
      ];

      const mockSnapshot = {
        docs: mockDocs,
      };

      mockFirestore.collection.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      const subjects = await subjectService.getAllSubjects();

      expect(mockFirestore.collection).toHaveBeenCalledWith("subjects");
      expect(subjects).toEqual([
        { id: "1", name: "Math", iconUrl: "http://example.com/math-icon" },
        {
          id: "2",
          name: "Science",
          iconUrl: "http://example.com/science-icon",
        },
      ]);
    });
  });

  describe("checkSubjectExists", () => {
    it("should return true if the subject exists", async () => {
      const mockSnapshot = {
        exists: true,
      };

      mockFirestore.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot),
        }),
      });

      const exists = await subjectService.checkSubjectExists("subjectId");

      expect(mockFirestore.collection).toHaveBeenCalledWith("subjects");
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith("subjectId");
      expect(exists).toBe(true);
    });

    it("should return false if the subject does not exist", async () => {
      const mockSnapshot = {
        exists: false,
      };

      mockFirestore.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot),
        }),
      });

      const exists =
        await subjectService.checkSubjectExists("invalidSubjectId");

      expect(mockFirestore.collection).toHaveBeenCalledWith("subjects");
      expect(mockFirestore.collection().doc).toHaveBeenCalledWith(
        "invalidSubjectId",
      );
      expect(exists).toBe(false);
    });
  });
});
