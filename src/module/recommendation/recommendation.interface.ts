import { TutorAvailability } from "@/db/schema";
import { LearningStyle } from "../learner/learner.types";

export interface Recommendation {
  tutor_id: string;
  tutories_id: string;
  name: string;
  email: string;
  city: string | null;
  district: string | null;
  category: string;
  tutory_name: string;
  about: string;
  methodology: string;
  hourly_rate: number;
  type_lesson: string;
  completed_orders: number;
  total_orders: number;
  match_reasons?: string[];
  location_match: boolean;
  availability: TutorAvailability | null;
}

export interface RecommendationServiceResponse {
  status: string;
  data: {
    learner: {
      id: string;
      name: string;
      email: string;
      learning_style: LearningStyle | null;
      city: string | null;
      district: string | null;
      interests: string[];
    };
    recommendations: Recommendation[];
    total_found: number;
    requested: number;
  };
}

export interface RecommendationService {
  getRecommendations(learnerId: string): Promise<RecommendationServiceResponse>;
  trackInteraction(learnerId: string, tutoriesId: string): Promise<void>;
  checkHealth(): Promise<boolean>;
}
