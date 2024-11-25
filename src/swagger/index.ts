import { PORT } from "@/config";
import swagger from "swagger-autogen";

const swaggerAutogen = swagger();

const definitions = {
  info: {
    title: "Tutortoise API",
    version: "1.0.0",
    description: "API documentation for Tutortoise",
  },
  schemes: ["https", "http"],
  servers: [
    {
      url: "http://localhost:8080", // default local development server
      description: "Local Development Server",
    },
    {
      // Make it configurable with variables
      url: "{protocol}://{host}:{port}",
      description: "Custom Server",
      variables: {
        protocol: {
          enum: ["http", "https"],
          default: "http",
        },
        host: {
          default: "localhost",
        },
        port: {
          default: "8080",
        },
      },
    },
  ],
  tags: [
    {
      name: "auth",
      description: "Authentication related endpoints",
    },
    {
      name: "chat",
      description: "Chat related endpoints",
    },
    {
      name: "subjects",
      description: "Subject related endpoints",
    },
    {
      name: "learners",
      description: "Learner related endpoints",
    },
    {
      name: "tutors",
      description: "Tutor related endpoints",
    },
    {
      name: "tutors/services",
      description: "Tutor services related endpoints",
    },
    {
      name: "orders",
      description: "Order related endpoints",
    },
    {
      name: "reviews",
      description: "Review related endpoints",
    },
  ],
};

const outputFile = "./specs.json";
const routes = ["./src/main.ts"];

swaggerAutogen(outputFile, routes, definitions);
