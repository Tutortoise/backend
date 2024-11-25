import specs from "@/swagger/specs.json";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

const apiDocsRouter = Router();

apiDocsRouter.use("/", swaggerUi.serve, swaggerUi.setup(specs));

export default apiDocsRouter;
