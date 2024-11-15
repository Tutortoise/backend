import type { RequestHandler } from "express";
import type { Tutor, Learner } from "@/types";
import { auth, firestore } from "@/config";
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

    // Find out whether the 'user' here is a learner or tutor
    const learnerData = await firestore
      .collection("learners")
      .doc(user.uid)
      .get();
    if (learnerData.exists) {
      req.learner = {
        ...(learnerData.data() as Learner),
        id: user.uid,
      };
    }

    const tutorData = await firestore.collection("tutors").doc(user.uid).get();
    if (tutorData.exists) {
      req.tutor = {
        ...(tutorData.data() as Tutor),
        id: user.uid,
      };
    }

    if (!learnerData.exists && !tutorData.exists) {
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

export const verifyLearner: RequestHandler = (req, res, next) => {
  if (!req.learner) {
    res.status(403).json({ status: "fail", message: "Forbidden" });
    return;
  }

  next();
};
