import { auth, firestore } from "@/config";
import type { Controller } from "@/types";
import { registerSchema } from "@/module/auth/auth.schema";
import { AuthService } from "@/module/auth/auth.service";
import { fcmTokenSchema } from "@/module/auth/auth.schema";
import { z } from "zod";
import { FCMService } from "@/common/fcm.service";

const fcmService = new FCMService({ firestore });
const authService = new AuthService({ auth, firestore, fcmService });

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

type FCMTokenSchema = z.infer<typeof fcmTokenSchema>;

export const updateFCMToken: Controller<FCMTokenSchema> = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    await authService.storeFCMToken(userId, req.body.token);

    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update FCM token",
    });
  }
};

export const removeFCMToken: Controller<FCMTokenSchema> = async (req, res) => {
  try {
    const userId = req.learner?.id || req.tutor?.id;
    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
      return;
    }

    await authService.removeFCMToken(userId, req.body.token);

    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to remove FCM token",
    });
  }
};
