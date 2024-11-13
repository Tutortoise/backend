import { Request, Response } from "express";
import { registerSchema } from "@schemas/auth.schema";
import { auth, firestore } from "@/config";
import { z } from "zod";
import type { Controller } from "@/types";

export const helloAuth = (_req: Request, res: Response) => {
  res.json({ message: "hello auth" });
};

type RegisterSchema = z.infer<typeof registerSchema>;
export const register: Controller<RegisterSchema> = async (req, res) => {
  try {
    const { name: displayName, email, password } = req.body;

    const user = await auth.createUser({ displayName, email, password });
    const currentDate = new Date();
    firestore.collection("users").doc(user.uid).set({
      name: displayName,
      createdAt: currentDate,
      updatedAt: currentDate,
    });

    res.status(201).json({
      status: "success",
      message: "register success",
      data: { userId: user.uid },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: "fail",
        message: "validation error",
        errors: error.message,
      });
    }

    if (error instanceof Error) {
      res.status(400).json({ status: "fail", message: error.message });
    }
  }
};
