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
}

let containerInstance: Container | null = null;

export const setupContainer = (): Container => {
  if (!containerInstance) {
    containerInstance = {
      authRepository: new AuthRepository(db),
      categoryRepository: new CategoryRepository(db),
      learnerRepository: new LearnerRepository(db),
      tutorRepository: new TutorRepository(db),
      tutoriesRepository: new TutoriesRepository(db),
      orderRepository: new OrderRepository(db),
      chatRepository: new ChatRepository(db),
      fcmRepository: new FCMRepository(db),
      reviewRepository: new ReviewRepository(db),
      faceValidationService: createFaceValidationService(),
      abusiveDetectionService: createAbusiveDetectionService(),
    };
  }

  return containerInstance;
};

export const container = setupContainer();
