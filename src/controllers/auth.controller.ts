import { Container } from "typedi";
import { AuthService } from "@services/auth.service";
import { Controller } from "@/types";
import { registerSchema } from "@schemas/auth.schema";
import { z } from "zod";

type RegisterSchema = z.infer<typeof registerSchema>;

const authService = Container.get(AuthService);
export const register: Controller<RegisterSchema> = async (req, res) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: { userId: user.uid },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: "fail",
        message: "Validation error",
        errors: error.errors,
      });
      return;
    }

    res.status(400).json({
      status: "fail",
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};
