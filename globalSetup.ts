import { seedLearners } from "@/module/learner/learner.seeder";
import { seedSubjects } from "@/module/subject/subject.seeder";
import { seedTutories } from "@/module/tutories/tutories.seeder";
import { seedTutors } from "@/module/tutor/tutor.seeder";

export default async function setup() {
  await seedSubjects();
  // await seedLearners();
  // await seedTutors();
  // await seedServices({ randomTeachingMethodology: true });
}
