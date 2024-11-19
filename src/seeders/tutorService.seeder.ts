import { firestore } from "@/config";
import { TutorService } from "@/types";
import { faker } from "@faker-js/faker";
import firebase from "firebase-admin";
import Groq from "groq-sdk";

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
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

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
      availability[day] = faker.helpers.arrayElements(timeSlots);
    }
  }

  return availability;
};

export const seedServices = async ({ randomTeachingMethodology = false }) => {
  const tutorServices: TutorService[] = [];

  const tutorsSnapshot = await firestore.collection("tutors").get();
  const subjectsSnapshot = await firestore.collection("subjects").get();

  if (tutorsSnapshot.empty || subjectsSnapshot.empty) {
    throw new Error("Tutors or subjects not found");
  }

  const tutors = tutorsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));

  const subjects = subjectsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));

  if (subjects.length === 0) {
    throw new Error("No subjects available for seeding services.");
  }

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

    tutorServices.push({
      id: firebase.firestore().collection("tmp").doc().id,
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

  console.log(`Seeding ${tutorServices.length} tutor services...`);

  // Batch write to Firestore
  const batch = firestore.batch();

  tutorServices.forEach((service) => {
    const serviceRef = firestore.collection("tutor_services").doc(service.id!);
    batch.set(serviceRef, {
      ...service,
      tutorId: firestore.collection("tutors").doc(service.tutorId),
      subjectId: firestore.collection("subjects").doc(service.subjectId),
    });

    const tutorRef = firestore.collection("tutors").doc(service.tutorId);
    batch.update(tutorRef, {
      services: firebase.firestore.FieldValue.arrayUnion(serviceRef),
    });
  });

  await batch.commit();
};
