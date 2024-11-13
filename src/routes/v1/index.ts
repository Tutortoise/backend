import { Router } from "express";
import authRouter from "./auth.route";
import subjectRouter from "./subject.route";
import userRouter from "./user.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/subjects", subjectRouter);
v1Router.use("/users", userRouter);

export default v1Router;
