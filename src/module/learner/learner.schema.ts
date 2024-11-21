import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { LearnerService } from "@/module/learner/learner.service";
import { z } from "zod";

const learnerService = new LearnerService({
  auth,
  firestore,
  downscaleImage,
  bucket,
});

export const learnerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
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
  gender: z
    .enum(["male", "female", "prefer not to say"], {
      message:
        "Gender must be one of the following: male, female, or prefer not to say",
    })
    .optional(),
  interests: z
    .array(z.string())
    .superRefine(async (interests, ctx) => {
      const isValid = await learnerService.validateInterests(interests);

      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid interests",
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
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
});

export const updateProfileSchema = z.object({
  body: learnerSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
  }),
});