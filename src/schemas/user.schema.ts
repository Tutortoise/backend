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
  updatedAt: z.date(),
  lastSeen: z.date().optional(),
  interests: z.array(z.string()).optional(),
  learningStyle: z
    .enum(["visual", "auditory", "reading/writing", "kinesthetic"])
    .optional(),
});

export const updateProfileSchema = z.object({
  body: userSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    lastSeen: true,
    interests: true,
    learningStyle: true,
  }),
});
