import { seedLearners } from "@/module/learner/learner.seeder";
import { seedSubjects } from "@/module/subject/subject.seeder";
import { seedTutors } from "@/module/tutor/tutor.seeder";
import { seedServices } from "@/module/tutor-service/tutorService.seeder";

export const runSeeder = async () => {
  await seedSubjects();
  await seedLearners();
  await seedTutors();
  await seedServices({ randomTeachingMethodology: false });
};

runSeeder();
