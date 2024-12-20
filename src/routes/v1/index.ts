import { Router } from "express";
import authRouter from "@/module/auth/auth.route";
import categoryRouter from "@/module/category/category.route";
import learnerRouter from "@/module/learner/learner.route";
import tutorRouter from "@/module/tutor/tutor.route";
import tutoriesRouter from "@/module/tutories/tutories.route";
import orderRouter from "@/module/order/order.route";
import chatRouter from "@/module/chat/chat.route";
import reviewRouter from "@/module/review/review.route";
import notificationRouter from "@/module/notification/notification.route";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/categories", categoryRouter);
v1Router.use("/learners", learnerRouter);
v1Router.use("/tutors/services", tutoriesRouter);
v1Router.use("/tutors", tutorRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/chat", chatRouter);
v1Router.use("/reviews", reviewRouter);
v1Router.use("/notification", notificationRouter);

export default v1Router;
