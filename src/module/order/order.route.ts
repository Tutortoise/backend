import {
  jwtAuthMiddleware,
  verifyLearner,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import * as orderController from "@/module/order/order.controller";
import {
  acceptOrderSchema,
  createOrderSchema,
  declineOrderSchema,
  getMyOrdersSchema,
} from "@/module/order/order.schema";
import { validator } from "@middleware/validation.middleware";
import { Router } from "express";

// /api/v1/orders
const orderRouter = Router();
orderRouter.use(jwtAuthMiddleware);

orderRouter.get(
  "/me",
  // #swagger.tags = ['orders']
  validator(getMyOrdersSchema),
  orderController.getMyOrders,
);

orderRouter.post(
  "/",
  /* #swagger.tags = ['orders'] 
  #swagger.requestBody = {
    schema: { $ref: "#/components/schemas/CreateOrderSchema" }
  } */
  verifyLearner,
  validator(createOrderSchema),
  orderController.createOrder,
);

orderRouter.post(
  "/:orderId/accept",
  // #swagger.tags = ['orders']
  verifyTutor,
  validator(acceptOrderSchema),
  orderController.acceptOrder,
);

orderRouter.post(
  "/:orderId/decline",
  // #swagger.tags = ['orders']
  verifyTutor,
  validator(declineOrderSchema),
  orderController.declineOrder,
);

orderRouter.get(
  "/unreviewed",
  // #swagger.tags = ['orders']
  verifyLearner,
  orderController.getUnreviewedOrders,
);

export default orderRouter;
