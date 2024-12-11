import {
  jwtAuthMiddleware,
  verifyLearner,
  verifyTutor,
} from "@/module/auth/auth.middleware";
import * as orderController from "@/module/order/order.controller";
import {
  changeOrderStatusSchema,
  createOrderSchema,
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
  // #swagger.description = 'Get all orders (session) of the current user'
  validator(getMyOrdersSchema),
  orderController.getMyOrders,
);

orderRouter.post(
  "/",
  /* #swagger.tags = ['orders'] 
     #swagger.description = 'Create a new order'
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
  // #swagger.description = 'Accept an order'
  verifyTutor,
  validator(changeOrderStatusSchema),
  orderController.acceptOrder,
);

orderRouter.post(
  "/:orderId/decline",
  // #swagger.tags = ['orders']
  // #swagger.description = 'Decline an order'
  verifyTutor,
  validator(changeOrderStatusSchema),
  orderController.declineOrder,
);

orderRouter.post(
  "/:orderId/cancel",
  // #swagger.tags = ['orders']
  // #swagger.description = 'Cancel an order'
  verifyTutor,
  validator(changeOrderStatusSchema),
  orderController.cancelOrder,
);

orderRouter.get(
  "/unreviewed",
  // #swagger.tags = ['orders']
  // #swagger.description = 'Get all unreviewed orders of the learner'
  verifyLearner,
  orderController.getUnreviewedOrders,
);

export default orderRouter;
