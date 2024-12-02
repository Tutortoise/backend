import "dotenv/config";
import { seedLearners } from "@/module/learner/learner.seeder";
import { seedCategories } from "@/module/category/category.seeder";
import {
  assignTutorProfilePictures,
  seedTutors,
} from "@/module/tutor/tutor.seeder";
import { seedTutories } from "@/module/tutories/tutories.seeder";

export const runSeeder = async () => {
  await seedCategories();
  await seedLearners();
  await seedTutors();
  await seedTutories({ generateWithGroq: true });
  await assignTutorProfilePictures();
};

runSeeder();
