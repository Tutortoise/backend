import { container } from "@/container";
import { Tutories } from "@/types";
import { faker } from "@faker-js/faker";
import Groq from "groq-sdk";

const categoryRepository = container.categoryRepository;
const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;

const generateTeachingMethodology = async (
  client: Groq,
  categoryName: string,
) => {
  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Generate me a teaching methodology for ${categoryName}. Only generate teaching methodology for me, no need for an explanation or anything. No markdown syntax is allowed as well.`,
      },
    ],
    model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0].message.content;
};

export const seedTutories = async ({ randomTeachingMethodology = false }) => {
  const tutories: Tutories[] = [];

  const categoryExists = await categoryRepository.hasCategories();
  const tutorsExists = await tutorRepository.hasTutors();

  if (!categoryExists || !tutorsExists) {
    throw new Error("Tutors or categories not found");
  }

  const categories = await categoryRepository.getAllCategories();
  const tutors = await tutorRepository.getAllTutors();

  for (const tutor of tutors) {
    const randomCategory = faker.helpers.arrayElement(categories);

    let teachingMethodology;
    if (randomTeachingMethodology) {
      teachingMethodology = faker.lorem.paragraph();
    } else {
      // Generate teaching methodology for the tutories
      teachingMethodology = await generateTeachingMethodology(
        new Groq({
          apiKey: process.env["GROQ_KEY"],
        }),
        randomCategory.name,
      );
    }

    if (!teachingMethodology) {
      throw new Error("Failed to generate teaching methodology");
    }

    tutories.push({
      tutorId: tutor.id,
      categoryId: randomCategory.id,
      createdAt: new Date(),
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: teachingMethodology,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000, 200000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
    });
  }

  console.log(`Seeding tutories with ${tutories.length} data...`);
  for (const t of tutories) {
    await tutoriesRepository.createTutories(t.tutorId, {
      categoryId: t.categoryId,
      aboutYou: t.aboutYou,
      teachingMethodology: t.teachingMethodology,
      hourlyRate: t.hourlyRate,
      typeLesson: t.typeLesson!,
    });
  }
};
