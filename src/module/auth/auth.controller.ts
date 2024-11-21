import { auth, firestore } from "@/config";
import type { Controller } from "@/types";
import { registerSchema } from "@/module/auth/auth.schema";
import { AuthService } from "@/module/auth/auth.service";
import { z } from "zod";

const authService = new AuthService({ auth, firestore });

type RegisterSchema = z.infer<typeof registerSchema>;
export const register: Controller<RegisterSchema> = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let result;
    // TODO: instead of using role, use a separate endpoint for learner and tutor?
    if (role === "learner") {
      result = await authService.registerLearner(name, email, password);
    } else {
      result = await authService.registerTutor(name, email, password);
    }

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
