import { generateSampleData, retryOperation } from "@/common/groq.seeder";
import { container } from "@/container";
import { Tutories } from "@/types";
import { faker } from "@faker-js/faker";

const categoryRepository = container.categoryRepository;
const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;

const prompt = (tutorName: string, category: string) => {
  return `You are a tutor. Your name is ${tutorName} that is teaching category ${category}. You need to make title/headline on what specific topic you teach, keep it very short and simple but descriptive.
For aboutYou, you should also tell about yourself in that particular topic, what makes you unique, what is your experience, and why should someone choose you.
The JSON schema should include
{
  "title": "string (max 30 characters)",
  "aboutYou": "string (min 10 characters, max 1000 characters)",
  "teachingMethodology": "string (must be detailed, min 10 characters, max 1000 characters)",
}`;
};

export const seedTutories = async ({ generateWithGroq = false }) => {
  const [categoryExists, tutorsExists] = await Promise.all([
    categoryRepository.hasCategories(),
    tutorRepository.hasTutors(),
  ]);

  if (!categoryExists || !tutorsExists) {
    throw new Error("Tutors or categories not found");
  }

  const tutors = await tutorRepository.getAllTutors();

  const tutories: Tutories[] = [];

  // Iterate over tutors to generate tutories
  for (const tutor of tutors) {
    const categories = await categoryRepository.getAvailableCategories(
      tutor.id,
    );
    const randomCategory = faker.helpers.arrayElement(categories);

    const { title, aboutYou, teachingMethodology } = generateWithGroq
      ? await retryOperation(async () => {
          const result = await generateSampleData(
            prompt(tutor.name, randomCategory.name),
          );

          if (result.title.length > 30) {
            throw new Error("Title length exceeds 30 characters");
          }

          if (result.aboutYou.length < 10 || result.aboutYou.length > 1000) {
            throw new Error(
              "AboutYou length should be between 10 and 1000 characters",
            );
          }

          if (
            result.teachingMethodology.length < 10 ||
            result.teachingMethodology.length > 1000
          ) {
            throw new Error(
              "TeachingMethodology length should be between 10 and 1000 characters",
            );
          }

          return result;
        })
      : {
          title: faker.lorem.words({ min: 1, max: 2 }),
          aboutYou: faker.lorem.paragraph(),
          teachingMethodology: faker.lorem.paragraph(),
        };

    tutories.push({
      name: title,
      tutorId: tutor.id,
      categoryId: randomCategory.id,
      createdAt: new Date(),
      aboutYou,
      teachingMethodology,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000, 200000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
    });
  }

  console.log(`Seeding tutories with ${tutories.length} data...`);
  await Promise.all(
    tutories.map((t) => tutoriesRepository.createTutories(t.tutorId, t)),
  );
};
