import { Firestore } from "firebase-admin/firestore";
import {
  createSessionRatingSchema,
  SessionRating,
} from "./sessionRating.schema";
import { z } from "zod";
import { orderSchema } from "@/module/order/order.schema";

export interface SessionRatingDependencies {
  firestore: Firestore;
}

// TODO:
// - create testing for this service
export class SessionRatingService {
  private firestore: Firestore;

  constructor({ firestore }: SessionRatingDependencies) {
    this.firestore = firestore;
  }

  async getSessionRatingByServiceId(
    serviceId: string,
  ): Promise<SessionRating[]> {
    try {
      const snapshot = await this.firestore
        .collection("session_ratings")
        .where("tutorServiceId", "==", serviceId)
        .get();

      if (snapshot.empty) {
        throw new Error("Session rating not found");
      }

      const sessionRatings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SessionRating[];

      return sessionRatings;
    } catch (error) {
      throw new Error(`Failed to get session rating: ${error}`);
    }
  }

  async createSessionRating(
    learnerId: string,
    data: z.infer<typeof createSessionRatingSchema>["body"],
  ) {
    try {
      const learnerRef = this.firestore.doc(`/learners/${learnerId}`);
      const orderRef = this.firestore.doc(`/orders/${data.orderId}`);
      const tutorsRef = this.firestore.doc(`/tutors/${data.tutorServiceId}`);

      const existingRating = await this.firestore
        .collection("session_ratings")
        .where("orderId", "==", orderRef)
        .get();

      if (!existingRating.empty) {
        throw new Error("rating already exists");
      }

      const [order, learner] = await Promise.all([
        orderRef.get(),
        learnerRef.get(),
      ]);

      const orderData = order.data() as z.infer<typeof orderSchema>;

      console.log(learner.id, learnerId);

      if (learner.id !== learnerId) {
        throw new Error("Learner does not have permission to rate session");
      }

      if (orderData.status !== "completed") {
        throw new Error("Session must be completed to rate");
      }

      this.firestore.collection("session_ratings").add({
        ...data,
        learnerId: learnerRef,
        tutorServiceId: tutorsRef,
        orderId: orderRef,
        createdAt: new Date(),
      });
    } catch (error) {
      throw error;
    }
  }
}
