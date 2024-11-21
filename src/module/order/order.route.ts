import * as orderController from "@/module/order/order.controller";
import {
  firebaseAuthMiddleware,
  verifyLearner,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { createOrderSchema } from "@/module/order/order.schema";
import { Router } from "express";

// /api/v1/orders
const orderRouter = Router();
orderRouter.use(firebaseAuthMiddleware);
orderRouter.use(verifyLearner);

orderRouter.post(
  "/",
  validator(createOrderSchema),
  orderController.createOrder,
);

export default orderRouter;
