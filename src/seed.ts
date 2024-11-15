import { seedLearners } from "./seeders/learner.seeder";
import { seedSubjects } from "./seeders/subject.seeder";
import { seedTutors } from "./seeders/tutor.seeder";
import { seedServices } from "./seeders/tutorService.seeder";

export const runSeeder = async () => {
  await seedSubjects();
  await seedLearners();
  await seedTutors();
  await seedServices();
};

runSeeder();
