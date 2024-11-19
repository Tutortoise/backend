import * as orderController from "@controllers/order.controller";
import {
  firebaseAuthMiddleware,
  verifyLearner,
} from "@middleware/auth.middleware";
import { validator } from "@middleware/validation.middleware";
import { createOrderSchema } from "@schemas/order.schema";
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
