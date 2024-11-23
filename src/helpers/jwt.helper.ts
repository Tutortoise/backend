import { JWT_SECRET } from "@/config";
import jwt from "jsonwebtoken";

export const generateJWT = (payload: Record<string, any>) => {
  return jwt.sign(payload, JWT_SECRET, {});
};

export const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeJWT = (token: string) => {
  return jwt.decode(token);
};
