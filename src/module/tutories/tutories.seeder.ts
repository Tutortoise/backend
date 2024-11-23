import { container } from "@/container";
import { Tutories } from "@/types";
import { faker } from "@faker-js/faker";
import Groq from "groq-sdk";

const subjectRepository = container.subjectRepository;
const tutorRepository = container.tutorRepository;
const tutoriesRepository = container.tutoriesRepository;

const generateTeachingMethodology = async (
  client: Groq,
  subjectName: string,
) => {
  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Generate me a teaching methodology for ${subjectName}. Only generate teaching methodology for me, no need for an explanation or anything. No markdown syntax is allowed as well.`,
      },
    ],
    model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0].message.content;
};

const generateRandomAvailability = () => {
  const days = [0, 1, 2, 3, 4, 5, 6] as const;

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
  ];

  const availability = {} as { [K in (typeof days)[number]]: string[] };

  for (const day of days) {
    if (faker.datatype.boolean()) {
      availability[day] = faker.helpers.arrayElements(timeSlots).sort();
    }
  }

  return availability;
};

export const seedTutories = async ({ randomTeachingMethodology = false }) => {
  const tutories: Tutories[] = [];

  const subjectExists = await subjectRepository.hasSubjects();
  const tutorsExists = await tutorRepository.hasTutors();

  if (!subjectExists || !tutorsExists) {
    throw new Error("Tutors or subjects not found");
  }

  const subjects = await subjectRepository.getAllSubjects();
  const tutors = await tutorRepository.getAllTutors();

  for (const tutor of tutors) {
    const randomSubject = faker.helpers.arrayElement(subjects);
    const randomAvailability = generateRandomAvailability();

    let subjectTeachingMethodology;
    if (randomTeachingMethodology) {
      subjectTeachingMethodology = faker.lorem.paragraph();
    } else {
      // Generate teaching methodology for the subject
      subjectTeachingMethodology = await generateTeachingMethodology(
        new Groq({
          apiKey: process.env["GROQ_KEY"],
        }),
        randomSubject.name,
      );
    }

    if (!subjectTeachingMethodology) {
      throw new Error("Failed to generate teaching methodology");
    }

    tutories.push({
      tutorId: tutor.id,
      subjectId: randomSubject.id,
      createdAt: new Date(),
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: subjectTeachingMethodology,
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000, 200000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
      availability: randomAvailability,
    });
  }

  console.log(`Seeding ${tutories.length} tutor services...`);
  for (const t of tutories) {
    await tutoriesRepository.createTutories(t.tutorId, {
      subjectId: t.subjectId,
      aboutYou: t.aboutYou,
      teachingMethodology: t.teachingMethodology,
      hourlyRate: t.hourlyRate,
      typeLesson: t.typeLesson!,
      availability: t.availability!,
    });
  }
};
