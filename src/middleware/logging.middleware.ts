import winston from "winston";
import morgan from "morgan";

// Winston logger configuration
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

// Morgan (HTTP request logger middleware) configuration
export const morganMiddleware = morgan("tiny", {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
});
