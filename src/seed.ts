import "dotenv/config";
import { seedLearners } from "@/module/learner/learner.seeder";
import { seedCategories } from "@/module/category/category.seeder";
import {
  assignTutorProfilePictures,
  seedTutors,
} from "@/module/tutor/tutor.seeder";
import { seedTutories } from "@/module/tutories/tutories.seeder";
import { seedOrders } from "./module/order/order.seeder";
import { seedReviews } from "./module/review/review.seeder";

export const runSeeder = async () => {
  await seedCategories();
  await seedLearners();
  await seedTutors();
  await seedTutories({ generateWithGroq: true });
  await assignTutorProfilePictures();
  await seedOrders();
  await seedReviews();
};

runSeeder();
