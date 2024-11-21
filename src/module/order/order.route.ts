import * as orderController from "@/module/order/order.controller";
import {
  firebaseAuthMiddleware,
  verifyLearner,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import {
  cancelOrderSchema,
  createOrderSchema,
} from "@/module/order/order.schema";
import { Router } from "express";

// /api/v1/orders
const orderRouter = Router();
orderRouter.use(firebaseAuthMiddleware);

orderRouter.post(
  "/",
  verifyLearner,
  validator(createOrderSchema),
  orderController.createOrder,
);

orderRouter.post(
  "/:orderId/cancel",
  verifyTutor,
  validator(cancelOrderSchema),
  orderController.cancelOrder,
);

export default orderRouter;
