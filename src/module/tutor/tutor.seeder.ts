import { Tutor } from "@/types";
import { faker } from "@faker-js/faker";
import { container } from "@/container";
import { bucket } from "@/config";
import axios from "axios";

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

    const sexType = faker.person.sexType();
    tutors.push({
      name: faker.person.fullName({ sex: sexType }),
      email: faker.internet.email(),
      password: faker.internet.password(),
      gender: sexType,
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

const fetchRandomPersonImage = async (gender: string): Promise<string> => {
  const baseURL = "https://this-person-does-not-exist.com";
  try {
    const qs = new URLSearchParams({
      time: Date.now().toString(),
      gender,
      age: "19-25",
      etnic: "all",
    });

    const response = await axios.get("/new", { params: qs, baseURL });
    return `${baseURL}${response.data.src}`;
  } catch (error) {
    console.error("Failed to fetch random person image:", error);
    throw error;
  }
};

export const assignTutorProfilePictures = async (): Promise<void> => {
  try {
    const tutors = await tutorRepository.getAllTutors();

    await Promise.all(
      tutors.map(async (tutor) => {
        try {
          const name = `profile-pictures/${tutor.id}.jpg`;
          const gender = ["male", "female"].includes(tutor.gender!)
            ? tutor.gender!
            : "any";

          const imageBuffer = (
            await axios.get(await fetchRandomPersonImage(gender), {
              responseType: "arraybuffer",
            })
          ).data;

          const bucketFile = bucket.file(name);
          await bucketFile.save(imageBuffer, { public: true });
        } catch (error) {
          console.error(
            `Failed to assign picture for tutor ID ${tutor.id}:`,
            error,
          );
        }
      }),
    );
  } catch (error) {
    console.error("Failed to assign tutor profile pictures:", error);
  }
};
