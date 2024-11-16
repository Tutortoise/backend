import { tutorsCollection } from "@/config/db";
import { Tutor } from "@/types";
import { faker } from "@faker-js/faker";

export const seedTutors = async () => {
  const tutors: Tutor[] = [];
  for (let i = 0; i < 25; i++) {
    tutors.push({
      name: faker.person.fullName(),
      gender: faker.helpers.arrayElement([
        "male",
        "female",
        "prefer not to say",
      ]),
      createdAt: new Date(),
    });
  }

  console.log(`Seeding tutors with ${tutors.length} data...`);
  await tutorsCollection.get().then((snapshot) => {
    if (snapshot.empty) {
      tutors.forEach((tutor) => {
        tutorsCollection.add(tutor);
      });
    }
  });
};
