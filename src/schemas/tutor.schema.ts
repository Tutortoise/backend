import { auth, firestore, GCS_BUCKET_NAME } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { Storage } from "@google-cloud/storage";
import { TutorService } from "@services/tutor.service";
import { z } from "zod";

const tutorService = new TutorService({
  firestore,
  auth,
  downscaleImage,
  GCS_BUCKET_NAME,
  storage: new Storage(),
});

export const tutorSchema = z.object({
  id: z.string().optional(),
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
  gender: z
    .enum(["male", "female", "prefer not to say"], {
      message:
        "Gender must be one of the following: male, female, or prefer not to say",
    })
    .optional(),
  services: z
    .array(z.string())
    .superRefine(async (services, ctx) => {
      const isServicesValid = await tutorService.validateServices(services);
      if (!isServicesValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid services",
        });
      }
    })
    .optional(),
  coverageRange: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  lastSeen: z.date().optional(),
});

export const updateProfileSchema = z.object({
  body: tutorSchema.omit({
    id: true,
    services: true,
    coverageRange: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
  }),
});