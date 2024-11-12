import type { RequestHandler } from "express";
import { auth, firestore } from "../config";
import { logger } from "./logging.middleware";

export const firebaseAuthMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  const authHeader = req.headers.authorization;
  try {
    if (!authHeader) throw new Error("Token is empty");

    const token = authHeader.split("Bearer ")[1];

    // Validating the token.
    const user = await auth.verifyIdToken(token);

    // Find out whether the 'user' here is a regular user or tutor
    const userData = await firestore.collection("users").doc(user.uid).get();
    const tutorData = await firestore.collection("tutors").doc(user.uid).get();

    if (userData.exists) {
      req.user = {
        uid: user.uid,
        ...userData.data(),
      };
    } else if (tutorData.exists) {
      req.tutor = {
        uid: user.uid,
        ...tutorData.data(),
      };
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    logger.debug(`Failed to verify token: ${error}`);

    res.status(401).json({ status: "fail", message: "Token is not valid" });
    return;
  }

  next();
};

export const verifyTutor: RequestHandler = (req, res, next) => {
  if (!req.tutor) {
    res.status(403).json({ status: "fail", message: "Forbidden" });
    return;
  }

  next();
};

export const verifyUser: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(403).json({ status: "fail", message: "Forbidden" });
    return;
  }

  next();
};
