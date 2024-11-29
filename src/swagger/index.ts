import swagger from "swagger-autogen";
import { components } from "./components";
import { tags } from "./tags";

const swaggerAutogen = swagger({ openapi: "3.0.0" });

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
  tags,
  components,
};

const outputFile = "./specs.json";
const routes = ["./src/main.ts"];

swaggerAutogen(outputFile, routes, definitions);
