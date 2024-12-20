import { createOrderSchema } from "@/module/order/order.schema";
import { z } from "zod";
import { OrderRepository } from "./order.repository";
import { TutoriesRepository } from "../tutories/tutories.repository";
import { NotificationService } from "../notification/notification.service";

export interface OrderServiceDependencies {
  orderRepository: OrderRepository;
  tutoriesRepository: TutoriesRepository;
  notificationService: NotificationService;
}

export class OrderService {
  private orderRepository: OrderRepository;
  private tutoriesRepository: TutoriesRepository;
  private notificationService: NotificationService;

  constructor({
    orderRepository,
    tutoriesRepository,
    notificationService,
  }: OrderServiceDependencies) {
    this.orderRepository = orderRepository;
    this.tutoriesRepository = tutoriesRepository;
    this.notificationService = notificationService;
  }

  async getOrderById(orderId: string) {
    try {
      return this.orderRepository.getOrderById(orderId);
    } catch (error) {
      throw new Error(`Failed to get order: ${error}`);
    }
  }

  async getOrders(params: {
    learnerId?: string;
    tutorId?: string;
    status?: "pending" | "scheduled" | "completed";
  }) {
    try {
      return this.orderRepository.getOrders(params);
    } catch (error) {
      throw new Error(`Failed to get orders: ${error}`);
    }
  }

  async createOrder(
    learnerId: string,
    data: z.infer<typeof createOrderSchema>["body"],
  ) {
    try {
      const estimatedEndTime = new Date(data.sessionTime);
      estimatedEndTime.setHours(estimatedEndTime.getHours() + data.totalHours);

      const tutories = await this.tutoriesRepository.getTutoriesDetail(
        data.tutoriesId,
      );

      const price = data.totalHours * tutories!.hourlyRate;

      const order = await this.orderRepository.createOrder({
        ...data,
        learnerId,
        sessionTime: new Date(data.sessionTime),
        estimatedEndTime,
        price,
        status: "pending",
      });

      await this.notificationService.createNotification({
        userId: tutories.tutorId,
        type: "new_order",
        title: "New Order",
        message: `You have a new order request for ${tutories.name}`,
        data: {
          orderId: order[0].id,
          tutoriesId: data.tutoriesId,
        },
      });

      return {
        orderId: order[0].id,
      };
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  async acceptOrder(orderId: string) {
    try {
      // Update order status
      await this.orderRepository.updateOrder(orderId, { status: "scheduled" });

      const order = await this.orderRepository.getOrderById(orderId);
      const acceptedOrderTime = new Date(order[0].orders.sessionTime);
      const estimatedEndTime = new Date(order[0].orders.estimatedEndTime);

      // To prevent double booking, decline all other pending orders that overlap with the accepted order
      const tutoriesId = order[0].tutories.id;
      const pendingOrders = await this.orderRepository.getOrders({
        tutoriesId,
        status: "pending",
      });
      const overlappingOrders = pendingOrders.filter((pendingOrder) => {
        const pendingOrderTime = new Date(pendingOrder.sessionTime);
        return (
          pendingOrderTime >= acceptedOrderTime &&
          pendingOrderTime < estimatedEndTime
        );
      });
      const updatePromises = overlappingOrders.map((order) =>
        this.orderRepository.updateOrder(order.id, {
          status: "declined",
          updatedAt: new Date(),
        }),
      );

      await Promise.all(updatePromises);

      await this.notificationService.createNotification({
        userId: order[0].orders.learnerId,
        type: "order_accepted",
        title: "Order Accepted",
        message: `Your order for ${order[0].tutories.name} has been accepted`,
        data: {
          orderId,
          tutoriesId: order[0].tutories.id,
        },
      });
    } catch (error) {
      throw new Error(`Failed to accept order: ${error}`);
    }
  }

  async declineOrder(orderId: string) {
    try {
      await this.orderRepository.updateOrder(orderId, {
        status: "declined",
        updatedAt: new Date(),
      });

      const order = await this.orderRepository.getOrderById(orderId);

      await this.notificationService.createNotification({
        userId: order[0].orders.learnerId,
        type: "order_declined",
        title: "Order Declined",
        message: `Your order for ${order[0].tutories.name} has been declined`,
        data: {
          orderId,
          tutoriesId: order[0].tutories.id,
        },
      });
    } catch (error) {
      throw new Error(`Failed to decline order: ${error}`);
    }
  }

  async cancelOrder(orderId: string) {
    try {
      return this.orderRepository.updateOrder(orderId, {
        status: "canceled",
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  async getUnreviewedOrders(learnerId: string) {
    try {
      return this.orderRepository.getOrders({
        learnerId,
        status: "completed",
        unreviewed: true,
      });
    } catch (error) {
      throw new Error(`Failed to get unreviewed orders: ${error}`);
    }
  }
}
