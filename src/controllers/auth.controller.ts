import { Request, Response } from "express";

export const helloAuth = (_req: Request, res: Response) => {
  res.json({ message: "hello auth" });
};
