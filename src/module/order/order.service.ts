import { createOrderSchema } from "@/module/order/order.schema";
import { Firestore } from "firebase-admin/firestore";
import { z } from "zod";

export interface OrderServiceDependencies {
  firestore: Firestore;
}

export class OrderService {
  private firestore: Firestore;

  constructor({ firestore }: OrderServiceDependencies) {
    this.firestore = firestore;
  }

  async createOrder(
    learnerId: string,
    data: z.infer<typeof createOrderSchema>["body"],
  ) {
    try {
      this.firestore.collection("orders").add({
        ...data,
        learnerId,
        status: "pending",
        createdAt: new Date(),
      });
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  async cancelOrder(orderId: string) {
    try {
      this.firestore.collection("orders").doc(orderId).update({
        status: "canceled",
      });
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  async checkOrderExists(orderId: string) {
    try {
      const order = await this.firestore
        .collection("orders")
        .doc(orderId)
        .get();
      return order.exists && order.data()?.status === "pending";
    } catch (error) {
      throw new Error(`Failed to check order exists: ${error}`);
    }
  }
}
