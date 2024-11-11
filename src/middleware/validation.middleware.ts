import { RequestHandler } from "express";
import { AnyZodObject, z } from "zod";

export const validator =
  (schema: AnyZodObject): RequestHandler =>
  async (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        }));
        res.status(400).json({ status: "fail", errors });
      }
    }
  };
