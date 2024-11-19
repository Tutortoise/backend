import { Router } from "express";
import authRouter from "./auth.route";
import subjectRouter from "./subject.route";
import learnerRouter from "./learner.route";
import tutorRouter from "./tutor.route";
import tutorServiceRouter from "./tutorService.route";
import orderRouter from "./order.route";
import chatRouter from "./chat.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/subjects", subjectRouter);
v1Router.use("/learners", learnerRouter);
v1Router.use("/tutors/services", tutorServiceRouter);
v1Router.use("/tutors", tutorRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/chat", chatRouter);

export default v1Router;
