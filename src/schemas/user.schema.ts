import { z } from "zod";

export const userSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    phoneNum: z.string().min(10, "Phone number must be at least 10 characters"),
    // TODO:
    // city
    // interests
    // learningStyle
  }),
});
