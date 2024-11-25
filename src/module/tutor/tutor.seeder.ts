import { Tutor } from "@/types";
import { faker } from "@faker-js/faker";
import { container } from "@/container";

const authRepository = container.authRepository;
const tutorRepository = container.tutorRepository;

const cityDistricts = {
  Surabaya: ["Asemrowo", "Benowo", "Bubutan", "Bulak"],
  Samarinda: ["Samarinda Utara", "Samarinda Kota", "Samarinda Ilir"],
};

export const seedTutors = async () => {
  const tutors: Tutor[] = [];
  for (let i = 0; i < 25; i++) {
    const city = faker.helpers.arrayElement(["Surabaya", "Samarinda"]);
    const district = faker.helpers.arrayElement(cityDistricts[city]);

    tutors.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      gender: faker.helpers.arrayElement([
        "male",
        "female",
        "prefer not to say",
      ]),
      city,
      district,
    });
  }

  console.log(`Seeding tutors with ${tutors.length} data...`);
  for (const tutor of tutors) {
    const { id } = await authRepository.registerUser({
      name: tutor.name,
      email: tutor.email,
      password: "12345678",
      role: "tutor",
    });

    tutorRepository.updateTutorProfile(id, {
      city: tutor.city,
      district: tutor.district,
    });
  }
};
