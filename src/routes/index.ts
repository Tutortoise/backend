import { Router } from "express";
import apiDocsRouter from "./api-docs";
import v1Router from "./v1";

const router = Router();

router.use("/api/v1", v1Router);
router.use("/api-docs", apiDocsRouter);

export default router;
