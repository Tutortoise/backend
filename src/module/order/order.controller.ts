import { container } from "@/container";
import {
  acceptOrderSchema,
  cancelOrderSchema,
  createOrderSchema,
  declineOrderSchema,
  getMyOrdersSchema,
} from "@/module/order/order.schema";
import { OrderService } from "@/module/order/order.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";

const orderService = new OrderService({
  orderRepository: container.orderRepository,
});

type GetMyOrdersSchema = z.infer<typeof getMyOrdersSchema>;
export const getMyOrders: Controller<GetMyOrdersSchema> = async (req, res) => {
  try {
    const orders = await orderService.getOrders({
      learnerId: req.learner?.id,
      tutorId: req.tutor?.id,
      status: req.query.status,
    });

    res.json({ status: "success", data: orders });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to get orders" });
  }
};

type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export const createOrder: Controller<CreateOrderSchema> = async (req, res) => {
  try {
    const data = await orderService.createOrder(req.learner.id, req.body);

    res.status(201).json({
      status: "success",
      message: "Order has been created successfully",
      data,
    });
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

    res.json({
      status: "success",
      message: "Order has been canceled successfully",
    });
  } catch (error) {
    logger.error(`Failed to cancel order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to cancel order" });
  }
};

type AcceptOrderSchema = z.infer<typeof acceptOrderSchema>;
export const acceptOrder: Controller<AcceptOrderSchema> = async (req, res) => {
  try {
    await orderService.acceptOrder(req.params.orderId);

    res.json({ status: "success", message: "Order has been scheduled" });
  } catch (error) {
    logger.error(`Failed to accept order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to accept order" });
  }
};

type DeclineOrderSchema = z.infer<typeof declineOrderSchema>;
export const declineOrder: Controller<DeclineOrderSchema> = async (
  req,
  res,
) => {
  try {
    await orderService.declineOrder(req.params.orderId);

    res.json({ status: "success", message: "Order has been declined" });
  } catch (error) {
    logger.error(`Failed to decline order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to decline order" });
  }
};
