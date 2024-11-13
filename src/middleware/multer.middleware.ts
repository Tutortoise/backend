import multer, { MulterError } from "multer";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_SIZE_LIMIT },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|png/;
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
      return cb(null, true);
    }

    // Error code for invalid file type
    return cb(new MulterError("LIMIT_UNEXPECTED_FILE"));
  },
});
