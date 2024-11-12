import { Router } from "express";
import authRouter from "./auth.route";
import subjectRouter from "./subject.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/subjects", subjectRouter);

export default v1Router;
