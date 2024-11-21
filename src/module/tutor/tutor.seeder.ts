import { auth, bucket, firestore } from "@/config";
import { downscaleImage } from "@/helpers/image.helper";
import { getCityName } from "@/helpers/location.helper";
import { Tutor } from "@/types";
import { faker } from "@faker-js/faker";
import { AuthService } from "@/module/auth/auth.service";
import { TutorService } from "@/module/tutor/tutor.service";

const authService = new AuthService({ firestore, auth });
const tutorService = new TutorService({
  firestore,
  auth,
  downscaleImage,
  bucket,
  getCityName,
});

// https://www.latlong.net/category/cities-103-15.html
function generateRandomLocation(): { latitude: number; longitude: number } {
  return faker.helpers.arrayElement([
    { latitude: -7.250445, longitude: 112.768845 }, // Surabaya
    { latitude: -0.502106, longitude: 117.153709 }, // Samarinda
    { latitude: -6.2, longitude: 106.816666 }, // Jakarta
  ]);
}

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
    const { userId } = await authService.registerTutor(
      tutor.name!,
      faker.internet.email(),
      "12345678",
    );
    tutorService.updateProfile(userId, {
      location: generateRandomLocation(),
    });
  }
};
