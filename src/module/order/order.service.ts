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
}
