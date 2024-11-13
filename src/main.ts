import express from "express";
import { PORT } from "./config";
import { morganMiddleware, logger } from "./middleware/logging.middleware";
import router from "./routes";
import {
  helmetMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  compressionMiddleware,
} from "@middleware/security.middleware";

const app = express();

// Security middlewares
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(compressionMiddleware);

// Log HTTP requests
app.use(morganMiddleware);

// Parse JSON payloads
app.use(express.json({ limit: "10kb" })); // The request payload should not exceed 10kb

// Routes
app.use(router);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
