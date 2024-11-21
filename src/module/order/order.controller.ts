import { firestore } from "@/config";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import {
  cancelOrderSchema,
  createOrderSchema,
} from "@/module/order/order.schema";
import { OrderService } from "@/module/order/order.service";
import { z } from "zod";

const orderService = new OrderService({ firestore });

type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export const createOrder: Controller<CreateOrderSchema> = async (req, res) => {
  try {
    await orderService.createOrder(req.learner.id, req.body);

    res.status(201).json({ message: "Order has been created successfully" });
  } catch (error) {
    logger.error(`Failed to create order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to create order" });
  }
};

type CancelOrderSchema = z.infer<typeof cancelOrderSchema>;
export const cancelOrder: Controller<CancelOrderSchema> = async (req, res) => {
  try {
    await orderService.cancelOrder(req.params.orderId);

    res.json({ message: "Order has been canceled successfully" });
  } catch (error) {
    logger.error(`Failed to cancel order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to cancel order" });
  }
};
