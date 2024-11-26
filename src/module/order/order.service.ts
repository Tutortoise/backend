import { createOrderSchema } from "@/module/order/order.schema";
import { z } from "zod";
import { OrderRepository } from "./order.repository";

export interface OrderServiceDependencies {
  orderRepository: OrderRepository;
}

export class OrderService {
  private orderRepository: OrderRepository;

  constructor({ orderRepository }: OrderServiceDependencies) {
    this.orderRepository = orderRepository;
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

      const order = await this.orderRepository.createOrder({
        ...data,
        learnerId,
        sessionTime: new Date(data.sessionTime),
        estimatedEndTime,
        status: "pending",
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

      // To prevent double booking, decline all other pending orders
      const tutoriesId = order[0].tutories.id;
      const pendingOrders = await this.orderRepository.getOrders({
        tutoriesId,
        status: "pending",
      });

      for (const pendingOrder of pendingOrders) {
        await this.orderRepository.updateOrder(pendingOrder.id, {
          status: "declined",
        });
      }
    } catch (error) {
      throw new Error(`Failed to accept order: ${error}`);
    }
  }

  async declineOrder(orderId: string) {
    try {
      return this.orderRepository.updateOrder(orderId, { status: "declined" });
    } catch (error) {
      throw new Error(`Failed to decline order: ${error}`);
    }
  }
}
