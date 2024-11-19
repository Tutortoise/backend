import { RequestHandler } from "express";
import { z, ZodTypeAny } from "zod";
import { logger } from "./logging.middleware";
import { imageUpload } from "./multer.middleware";

export const validator =
  (schema: ZodTypeAny): RequestHandler =>
  async (req, res, next) => {
    try {
      const result = await schema.parseAsync({
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
        res.status(400).json({
          status: "fail",
          message: "Validation error",
          errors,
        });
        return;
      }
      next(error);
    }
  };

export const validateProfilePictureUpload: RequestHandler = (
  req,
  res,
  next,
) => {
  imageUpload.single("picture")(req, res, (error) => {
    if (error) {
      switch (error.code) {
        case "LIMIT_FILE_SIZE":
          res.status(400).json({
            status: "fail",
            message: "File size is too large. Max size is 5MB",
          });
          return;

        case "LIMIT_UNEXPECTED_FILE":
          res.status(400).json({
            status: "fail",
            message: "Invalid file type. Only JPEG and PNG files are allowed",
          });
          return;
      }

      logger.debug(`Failed to upload profile picture: ${error}`);
      res.status(400).json({
        status: "fail",
        message: "Failed to upload profile picture",
      });
    } else {
      next();
    }
  });
};

export const validateChatImageUpload: RequestHandler = (req, res, next) => {
  if (req.body.type === "image") {
    const base64Regex = /^data:image\/(jpeg|png);base64,/;
    if (!base64Regex.test(req.body.content)) {
      res.status(400).json({
        status: "fail",
        message: "Invalid image format. Must be base64 encoded JPEG or PNG",
      });
      return;
    }

    const sizeInBytes = Buffer.from(
      req.body.content.split(",")[1],
      "base64",
    ).length;
    if (sizeInBytes > 5 * 1024 * 1024) {
      res.status(400).json({
        status: "fail",
        message: "Image size too large. Maximum size is 5MB",
      });
      return;
    }
  }
  next();
};
