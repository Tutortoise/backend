import { Router } from "express";
import authRouter from "@/module/auth/auth.route";
import subjectRouter from "@/module/subject/subject.route";
import learnerRouter from "@/module/learner/learner.route";
import tutorRouter from "@/module/tutor/tutor.route";
import tutoriesRouter from "@/module/tutories/tutories.route";
import orderRouter from "@/module/order/order.route";
import chatRouter from "@/module/chat/chat.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/subjects", subjectRouter);
v1Router.use("/learners", learnerRouter);
v1Router.use("/tutors/services", tutoriesRouter);
v1Router.use("/tutors", tutorRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/chat", chatRouter);

export default v1Router;
