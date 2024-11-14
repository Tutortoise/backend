import { firestore } from "@/config";
import { z } from "zod";

export const tutorSchema = z.object({
  id: z.string(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  phoneNum: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .optional(),
  location: z
    .object({
      latitude: z.number({ message: "Latitude must be a number" }),
      longitude: z.number({ message: "Longitude must be a number" }),
    })
    .optional(),
  services: z
    .array(z.string())
    .superRefine(async (services, ctx) => {
      // Validate that the services are valid by checking the tutor_services collection
      try {
        const servicesSnapshot = await firestore
          .collection("tutor_services")
          .get();
        const validServices = servicesSnapshot.docs.map((doc) => doc.id);
        const invalidServices = services.filter(
          (service) => !validServices.includes(service),
        );

        if (invalidServices.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid services found: ${invalidServices.join(", ")}`,
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Failed to validate services due to an internal error",
        });
      }
    })
    .optional(),
  coverageRange: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
});

export const tutorServiceSchema = z.object({
  id: z.string(),
  tutorId: z.string().superRefine(async (tutorId, ctx) => {
    // Validate that the tutor exists by checking the tutors collection
    try {
      const tutorSnapshot = await firestore
        .collection("tutors")
        .doc(tutorId)
        .get();
      if (!tutorSnapshot.exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tutor does not exist",
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Failed to validate tutor due to an internal error",
      });
    }
  }),
  subjectId: z.string().superRefine(async (subjectId, ctx) => {
    // Validate that the subject exists by checking the subjects collection
    try {
      const subjectSnapshot = await firestore
        .collection("subjects")
        .doc(subjectId)
        .get();
      if (!subjectSnapshot.exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Subject does not exist",
        });
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Failed to validate subject due to an internal error",
      });
    }
  }),
  // About the tutor's experience with the subject
  aboutYou: z.string().optional(),
  // Tutor's teaching methodology
  teachingMethodology: z.string().optional(),
  hourlyRate: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
