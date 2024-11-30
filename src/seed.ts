import "dotenv/config";
import { seedLearners } from "@/module/learner/learner.seeder";
import { seedSubjects } from "@/module/subject/subject.seeder";
import {
  assignTutorProfilePictures,
  seedTutors,
} from "@/module/tutor/tutor.seeder";
import { seedTutories } from "@/module/tutories/tutories.seeder";

export const runSeeder = async () => {
  await seedSubjects();
  // await seedLearners();
  // await seedTutors();
  // await seedServices({ randomTeachingMethodology: false });
  // await assignTutorProfilePictures();
};

runSeeder();
