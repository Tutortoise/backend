import { container } from "@/container";
import { Learner } from "@/types";
import { faker } from "@faker-js/faker";

const authRepository = container.authRepository;
const learnerRepository = container.learnerRepository;

export const seedLearners = async () => {
  const learners: Learner[] = [];
  for (let i = 0; i < 25; i++) {
    learners.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
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
    });
  }

  console.log(`Seeding learners with ${learners.length} data...`);
  for (const learner of learners) {
    const { id } = await authRepository.registerUser({
      name: learner.name,
      email: learner.email,
      password: learner.password,
      role: "learner",
    });
    await learnerRepository.updateLearnerProfile(id, {
      gender: learner.gender,
      learningStyle: learner.learningStyle,
    });
  }
};
