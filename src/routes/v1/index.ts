import { Router } from "express";
import authRouter from "./auth.route";
import subjectRouter from "./subject.route";
import userRouter from "./user.route";
import tutorRouter from "./tutor.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/subjects", subjectRouter);
v1Router.use("/users", userRouter);
v1Router.use("/tutors", tutorRouter);

export default v1Router;
