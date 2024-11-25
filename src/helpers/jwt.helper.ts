import { JWT_SECRET } from "@/config";
import jwt from "jsonwebtoken";

interface DecodedJWT {
  id: string;
  role: "learner" | "tutor";
}

export const generateJWT = (payload: Record<string, any>) => {
  return jwt.sign(payload, JWT_SECRET, {});
};

export const verifyJWT = (token: string): DecodedJWT | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedJWT;
  } catch (error) {
    return null;
  }
};
