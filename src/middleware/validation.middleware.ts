import { RequestHandler } from "express";
import { AnyZodObject, z } from "zod";

export const validator =
  (schema: AnyZodObject): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.body = result.body;
      req.params = result.params;
      req.query = result.query;

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
