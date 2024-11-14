import { firestore } from "@/config";
import { z } from "zod";

export const userSchema = z.object({
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
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
  interests: z
    .array(z.string())
    .superRefine(async (interests, ctx) => {
      try {
        const subjectsSnapshot = await firestore.collection("subjects").get();
        const validSubjects = subjectsSnapshot.docs.map((doc) => doc.id);

        const invalidInterests = interests.filter(
          (interest) => !validSubjects.includes(interest),
        );
        if (invalidInterests.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid interests found: ${invalidInterests.join(", ")}`,
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Failed to validate interests due to an internal error",
        });
      }
    })
    .optional(),
  learningStyle: z
    .enum(["visual", "auditory", "kinesthetic"], {
      message:
        "Learning style must be one of 'visual', 'auditory', or 'kinesthetic'",
    })
    .optional(),
});

export const updateProfileSchema = z.object({
  body: userSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
  }),
});
