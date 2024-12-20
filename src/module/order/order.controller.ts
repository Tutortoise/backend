import { FCMService } from "@/common/fcm.service";
import { container } from "@/container";
import {
  changeOrderStatusSchema,
  createOrderSchema,
  getMyOrdersSchema,
} from "@/module/order/order.schema";
import { OrderService } from "@/module/order/order.service";
import { TutoriesService } from "@/module/tutories/tutories.service";
import { Controller } from "@/types";
import { logger } from "@middleware/logging.middleware";
import { z } from "zod";
import { NotificationService } from "../notification/notification.service";

const orderService = new OrderService({
  orderRepository: container.orderRepository,
  tutoriesRepository: container.tutoriesRepository,
  notificationService: new NotificationService({
    notificationRepository: container.notificationRepository,
    fcmService: new FCMService({ fcmRepository: container.fcmRepository }),
  }),
});
const tutoriesService = new TutoriesService({
  tutoriesRepository: container.tutoriesRepository,
  tutorRepository: container.tutorRepository,
  reviewRepository: container.reviewRepository,
  abusiveDetection: container.abusiveDetectionService,
  recommender: container.recommendationService,
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

type ChangeOrderStatusSchema = z.infer<typeof changeOrderStatusSchema>;
export const acceptOrder: Controller<ChangeOrderStatusSchema> = async (
  req,
  res,
) => {
  try {
    // Check if the tutor owns the tutories
    const orderId = req.params.orderId;
    const order = await orderService.getOrderById(orderId);
    const isOwner = await tutoriesService.validateTutoriesOwnership({
      tutorId: req.tutor.id,
      tutoriesId: order[0].tutories.id,
    });

    if (!isOwner) {
      res.status(403).json({
        status: "error",
        message: "You are not authorized to accept this order",
      });
      return;
    }

    await orderService.acceptOrder(req.params.orderId);

    res.json({ status: "success", message: "Order has been scheduled" });
  } catch (error) {
    logger.error(`Failed to accept order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to accept order" });
  }
};

export const declineOrder: Controller<ChangeOrderStatusSchema> = async (
  req,
  res,
) => {
  try {
    // Check if the tutor owns the tutories
    const orderId = req.params.orderId;
    const order = await orderService.getOrderById(orderId);
    const isOwner = await tutoriesService.validateTutoriesOwnership({
      tutorId: req.tutor.id,
      tutoriesId: order[0].tutories.id,
    });

    if (!isOwner) {
      res.status(403).json({
        status: "error",
        message: "You are not authorized to decline this order",
      });
      return;
    }

    await orderService.declineOrder(req.params.orderId);

    res.json({ status: "success", message: "Order has been declined" });
  } catch (error) {
    logger.error(`Failed to decline order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to decline order" });
  }
};

export const cancelOrder: Controller<ChangeOrderStatusSchema> = async (
  req,
  res,
) => {
  try {
    // Check if the tutor owns the tutories
    const orderId = req.params.orderId;
    const order = await orderService.getOrderById(orderId);
    const isOwner = await tutoriesService.validateTutoriesOwnership({
      tutorId: req.tutor.id,
      tutoriesId: order[0].tutories.id,
    });

    if (!isOwner) {
      res.status(403).json({
        status: "error",
        message: "You are not authorized to cancel this order",
      });
      return;
    }

    await orderService.cancelOrder(req.params.orderId);

    res.json({ status: "success", message: "Order has been cancelled" });
  } catch (error) {
    logger.error(`Failed to cancel order: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to cancel order" });
  }
};

export const getUnreviewedOrders: Controller = async (req, res) => {
  try {
    const orders = await orderService.getUnreviewedOrders(req.learner.id);

    res.json({ status: "success", data: orders });
  } catch (error) {
    logger.error(`Failed to get unreviewed orders: ${error}`);

    res
      .status(500)
      .json({ status: "error", message: "Failed to get unreviewed orders" });
  }
};
