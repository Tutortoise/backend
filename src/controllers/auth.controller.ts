import type { Controller } from "@/types";
import { registerSchema } from "@schemas/auth.schema";
import * as authService from "@services/auth.service";
import { z } from "zod";

type RegisterSchema = z.infer<typeof registerSchema>;
export const register: Controller<RegisterSchema> = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const result = await authService.registerUser(name, email, password);

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ status: "fail", message: error.message });
    }
  }
};
