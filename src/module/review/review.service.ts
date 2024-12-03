import { AbusiveDetectionService } from "../abusive-detection/abusive-detection.interface";
import { OrderRepository } from "../order/order.repository";
import { ValidationError } from "../tutor/tutor.error";
import { ReviewRepository } from "./review.repository";

interface ReviewServiceDependencies {
  reviewRepository: ReviewRepository;
  orderRepository: OrderRepository;
  abusiveDetection: AbusiveDetectionService;
}

export class ReviewService {
  constructor(private readonly deps: ReviewServiceDependencies) {}

  private async validateContent(content: string) {
    const result = await this.deps.abusiveDetection.validateText(content);
    if (result.is_abusive) {
      throw new ValidationError(
        `Review contains inappropriate content${
          result.matched_words.length > 0
            ? `: ${result.matched_words.join(", ")}`
            : ""
        }`,
      );
    }
  }

  async createReview(data: {
    orderId: string;
    rating: number;
    message?: string;
  }) {
    if (data.message) {
      await this.validateContent(data.message);
    }
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
