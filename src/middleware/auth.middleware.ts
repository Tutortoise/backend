import type { RequestHandler } from "express";
import { auth } from "../config";
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
    await auth.verifyIdToken(token);
  } catch (err) {
    logger.debug(`Failed to verify token: ${err}`);

    res.status(401).json({ status: "fail", message: "Token is not valid" });
    return;
  }

  next();
};
