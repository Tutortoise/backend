import { firestore } from "@/config";
import { Tutor } from "@/types";
import { faker } from "@faker-js/faker";
import { container } from "@/container";

const authRepository = container.authRepository;
const tutorRepository = container.tutorRepository;

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

  const tutorSnapshot = await firestore.collection("tutors").get();
  if (!tutorSnapshot.empty) {
    return;
  }

  console.log(`Seeding tutors with ${tutors.length} data...`);
  for (const tutor of tutors) {
    const { id } = await authRepository.registerUser({
      email: faker.internet.email(),
      password: "12345678",
      name: tutor.name!,
      role: "tutor",
    });
    // tutorRepository.updateTutorProfile(id, {});
  }
};
