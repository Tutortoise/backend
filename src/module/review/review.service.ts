import { OrderRepository } from "../order/order.repository";
import { ReviewRepository } from "./review.repository";

interface ReviewServiceDependencies {
  reviewRepository: ReviewRepository;
  orderRepository: OrderRepository;
}

export class ReviewService {
  constructor(private readonly deps: ReviewServiceDependencies) {}

  async createReview(data: {
    orderId: string;
    rating: number;
    message?: string;
  }) {
    return this.deps.reviewRepository.createReview(data);
  }

  async getTutoriesReviews(tutoriesId: string) {
    return this.deps.reviewRepository.getTutoriesReviews(tutoriesId);
  }

  async validateOrderOwnership(orderId: string, learnerId: string) {
    const orders = await this.deps.orderRepository.getOrders({
      learnerId,
    });

    return orders.some((order) => order.id === orderId);
  }

  async isOrderCompleted(orderId: string) {
    const orders = await this.deps.orderRepository.getOrders({
      orderId,
    });

    return orders.some((order) => order.status === "completed");
  }

  async hasReview(orderId: string) {
    return this.deps.reviewRepository.hasReview(orderId);
  }
}
