import { container } from "@/container";
import { Tutories } from "@/types";
import { faker } from "@faker-js/faker";
import Groq from "groq-sdk";

const categoryRepository = container.categoryRepository;
const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;

async function retryOperation(operation: () => Promise<any>, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * i));
      console.log(`Retry ${i + 1}/${retries}`);
    }
  }
}

const prompt = (category: string) => {
  return `You are a tutor that is teaching category ${category}. The name is the title/headline on what specific topic you teach. The JSON schema should include
{
  "name": "string (max 20 characters)",
  "teachingMethodology": "string (must be detailed, min 10 characters, max 1000 characters)",
}`;
};
const generateNameAndTeachingMethod = async (categoryName: string) => {
  const groq = new Groq({
    apiKey: process.env["GROQ_KEY"],
  });
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt(categoryName),
        },
      ],
      response_format: { type: "json_object" },
      model: "llama3-8b-8192",
    });

    const result = chatCompletion.choices[0].message.content;
    const json = JSON.parse(result!);
    if (!json || !json.name || !json.teachingMethodology)
      throw new Error("Result is empty");

    return json;
  } catch (error) {
    console.error(`Failed to generate with Groq: ${error}`);
  }
};

export const seedTutories = async ({ generateWithGroq = false }) => {
  // Validate prerequisites
  const [categoryExists, tutorsExists] = await Promise.all([
    categoryRepository.hasCategories(),
    tutorRepository.hasTutors(),
  ]);

  if (!categoryExists || !tutorsExists) {
    throw new Error("Tutors or categories not found");
  }

  // Fetch required data
  const [categories, tutors] = await Promise.all([
    categoryRepository.getAllCategories(),
    tutorRepository.getAllTutors(),
  ]);

  const tutories: Tutories[] = [];

  // Iterate over tutors to generate tutories
  for (const tutor of tutors) {
    const randomCategory = faker.helpers.arrayElement(categories);

    const { name, teachingMethodology } = generateWithGroq
      ? await retryOperation(() =>
          generateNameAndTeachingMethod(randomCategory.name),
        )
      : {
          name: faker.lorem.words(),
          teachingMethodology: faker.lorem.paragraph(),
        };

    console.log(name, teachingMethodology);

    tutories.push({
      name,
      tutorId: tutor.id,
      categoryId: randomCategory.id,
      createdAt: new Date(),
      aboutYou: faker.lorem.paragraph(),
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
