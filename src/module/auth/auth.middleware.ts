import type { RequestHandler } from "express";
import { verifyJWT } from "@/helpers/jwt.helper";

export const jwtAuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ status: "fail", message: "Unauthorized" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    res.status(401).json({ status: "fail", message: "Unauthorized" });
    return;
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    res.status(401).json({ status: "fail", message: "Unauthorized" });
    return;
  }

  if (decoded.role === "learner") {
    req.learner = { id: decoded.id };
  } else if (decoded.role === "tutor") {
    req.tutor = { id: decoded.id };
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
