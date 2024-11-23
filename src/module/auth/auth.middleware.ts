import type { RequestHandler } from "express";
import type { Tutor, Learner } from "@/types";
import { auth, firestore } from "@/config";
import { logger } from "@middleware/logging.middleware";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { decodeJWT, verifyJWT } from "@/helpers/jwt.helper";

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
    const user = (await auth.verifyIdToken(token)) as DecodedIdToken & {
      role: "learner" | "tutor";
    };

    if (user.role === "learner") {
      const learnerData = await firestore
        .collection("learners")
        .doc(user.uid)
        .get();
      if (learnerData.exists) {
        req.learner = {
          ...(learnerData.data() as Learner),
          id: user.uid,
        };

        next();
        return;
      }
    }

    if (user.role === "tutor") {
      const tutorData = await firestore
        .collection("tutors")
        .doc(user.uid)
        .get();
      if (tutorData.exists) {
        req.tutor = {
          ...(tutorData.data() as Tutor),
          id: user.uid,
        };
      }

      next();
      return;
    }

    throw new Error("User not found");
  } catch (error) {
    logger.debug(`Failed to verify token: ${error}`);

    res.status(401).json({ status: "fail", message: "Token is not valid" });
    return;
  }
};

export const jwtAuthMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ status: "fail", message: "Unauthorized" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!verifyJWT(token)) {
    res.status(401).json({ status: "fail", message: "Unauthorized" });
    return;
  }

  const decoded = decodeJWT(token);
  console.log(decoded);

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
