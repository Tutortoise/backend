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

  async getOrders({
    learnerId,
    tutorId,
    status,
  }: {
    learnerId?: string;
    tutorId?: string;
    status: "pending" | "scheduled" | "completed";
  }) {
    try {
      let orderQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        this.firestore.collection("orders");

      if (status === "pending") {
        orderQuery = orderQuery.where("status", "==", "pending");
      } else if (status === "scheduled") {
        orderQuery = orderQuery.where("status", "==", "scheduled");
      } else if (status === "completed") {
        orderQuery = orderQuery.where("status", "in", [
          "completed",
          "canceled",
          "declined",
        ]);
      }

      if (learnerId) {
        orderQuery = orderQuery.where(
          "learnerId",
          "==",
          this.firestore.doc(`/learners/${learnerId}`),
        );
      } else {
        const tutorServicesSnapshot = await this.firestore
          .collection("tutor_services")
          .where("tutorId", "==", this.firestore.doc(`/tutors/${tutorId}`))
          .get();

        const tutorServiceIds = tutorServicesSnapshot.docs.map(
          (doc) => doc.ref,
        );

        orderQuery = orderQuery.where("tutorServiceId", "in", tutorServiceIds);
      }

      const ordersSnapshot = await orderQuery.get();

      return ordersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tutorServiceId: data.tutorServiceId.id,
          learnerId: data.learnerId.id,
        };
      });
    } catch (error) {
      throw new Error(`Failed to get orders: ${error}`);
    }
  }

  async createOrder(
    learnerId: string,
    data: z.infer<typeof createOrderSchema>["body"],
  ) {
    try {
      const newOrder = await this.firestore.collection("orders").add({
        ...data,
        tutorServiceId: this.firestore.doc(
          `/tutor_services/${data.tutorServiceId}`,
        ),
        learnerId: this.firestore.doc(`/learners/${learnerId}`),
        status: "pending",
        createdAt: new Date(),
      });

      return { orderId: newOrder.id };
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

  async acceptOrder(orderId: string) {
    try {
      this.firestore.collection("orders").doc(orderId).update({
        status: "scheduled",
      });

      // also cancel other pending orders
      const order = await this.firestore
        .collection("orders")
        .doc(orderId)
        .get();
      const tutorServiceId = order.data()?.tutorServiceId;
      const pendingOrders = await this.firestore
        .collection("orders")
        .where("tutorServiceId", "==", tutorServiceId)
        .where("status", "==", "pending")
        .get();
      pendingOrders.docs.forEach((doc) => {
        doc.ref.update({ status: "canceled" });
      });
    } catch (error) {
      throw new Error(`Failed to accept order: ${error}`);
    }
  }

  async declineOrder(orderId: string) {
    try {
      this.firestore.collection("orders").doc(orderId).update({
        status: "declined",
      });
    } catch (error) {
      throw new Error(`Failed to decline order: ${error}`);
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
