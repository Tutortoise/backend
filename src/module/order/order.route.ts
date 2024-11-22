import * as orderController from "@/module/order/order.controller";
import {
  firebaseAuthMiddleware,
  verifyLearner,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import {
  acceptOrderSchema,
  cancelOrderSchema,
  createOrderSchema,
  declineOrderSchema,
  getMyOrdersSchema,
} from "@/module/order/order.schema";
import { Router } from "express";

// /api/v1/orders
const orderRouter = Router();
orderRouter.use(firebaseAuthMiddleware);

orderRouter.get(
  "/me",
  validator(getMyOrdersSchema),
  orderController.getMyOrders,
);

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

orderRouter.post(
  "/:orderId/accept",
  verifyTutor,
  validator(acceptOrderSchema),
  orderController.acceptOrder,
);

orderRouter.post(
  "/:orderId/decline",
  verifyTutor,
  validator(declineOrderSchema),
  orderController.declineOrder,
);

export default orderRouter;
