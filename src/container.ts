import { db } from "@/db/config";
import { AuthRepository } from "@/module/auth/auth.repository";
import { CategoryRepository } from "./module/category/category.repository";
import { LearnerRepository } from "./module/learner/learner.repository";
import { TutorRepository } from "./module/tutor/tutor.repository";
import { ChatRepository } from "./module/chat/chat.repository";
import { FCMRepository } from "./common/fcm.repository";
import { TutoriesRepository } from "./module/tutories/tutories.repository";
import { OrderRepository } from "./module/order/order.repository";
import { ReviewRepository } from "./module/review/review.repository";
import { FaceValidationService } from "./module/face-validation/face-validation.interface";
import { createFaceValidationService } from "./module/face-validation/face-validation.factory";
import { AbusiveDetectionService } from "./module/abusive-detection/abusive-detection.interface";
import { createAbusiveDetectionService } from "@/module/abusive-detection/abusive-detection.factory";
import { createRecommendationService } from "./module/recommendation/recommendation.factory";
import { RecommendationService } from "./module/recommendation/recommendation.interface";

interface Container {
  authRepository: AuthRepository;
  categoryRepository: CategoryRepository;
  learnerRepository: LearnerRepository;
  tutorRepository: TutorRepository;
  tutoriesRepository: TutoriesRepository;
  orderRepository: OrderRepository;
  chatRepository: ChatRepository;
  fcmRepository: FCMRepository;
  reviewRepository: ReviewRepository;
  faceValidationService: FaceValidationService;
  abusiveDetectionService: AbusiveDetectionService;
  recommendationService: RecommendationService;
}

let containerInstance: Container | null = null;

export const setupContainer = (): Container => {
  if (!containerInstance) {
    const authRepository = new AuthRepository(db);
    const categoryRepository = new CategoryRepository(db);
    const learnerRepository = new LearnerRepository(db);
    const tutorRepository = new TutorRepository(db);
    const tutoriesRepository = new TutoriesRepository(db);
    const orderRepository = new OrderRepository(db);
    const chatRepository = new ChatRepository(db);
    const fcmRepository = new FCMRepository(db);
    const reviewRepository = new ReviewRepository(db);

    containerInstance = {
      authRepository,
      categoryRepository,
      learnerRepository,
      tutorRepository,
      tutoriesRepository,
      orderRepository,
      chatRepository,
      fcmRepository,
      reviewRepository,
      faceValidationService: createFaceValidationService(),
      abusiveDetectionService: createAbusiveDetectionService(),
      recommendationService: createRecommendationService(
        learnerRepository,
        tutoriesRepository,
      ),
    };
  }

  return containerInstance;
};

export const container = setupContainer();
