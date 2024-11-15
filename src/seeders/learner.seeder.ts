import { firestore } from "@/config";
import { Learner } from "@/types";
import { faker } from "@faker-js/faker";

export const seedLearners = async () => {
  const learners: Learner[] = [];
  for (let i = 0; i < 25; i++) {
    learners.push({
      name: faker.person.fullName(),
      gender: faker.helpers.arrayElement([
        "male",
        "female",
        "prefer not to say",
      ]),
      learningStyle: faker.helpers.arrayElement([
        "visual",
        "auditory",
        "kinesthetic",
      ]),
      createdAt: new Date(),
    });
  }

  console.log(`Seeding learners with ${learners.length} data...`);
  await firestore
    .collection("learners")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        learners.forEach((learner) => {
          firestore.collection("learners").add(learner);
        });
      }
    });
};
