import { seedLearners } from "@/module/learner/learner.seeder";
import { seedCategories } from "@/module/category/category.seeder";
import { seedTutories } from "@/module/tutories/tutories.seeder";
import { seedTutors } from "@/module/tutor/tutor.seeder";

export default async function setup() {
  await seedCategories();
  // await seedLearners();
  await seedTutors();
  await seedTutories({ generateWithGroq: false });
}
