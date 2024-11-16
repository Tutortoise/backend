import { firestore } from "@/config";
import {
  subjectCollection,
  tutorsCollection,
  tutorServicesCollection,
} from "@/config/db";
import { TutorService } from "@/types";
import { faker } from "@faker-js/faker";
import firebase from "firebase-admin";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env["GROQ_KEY"],
});

const generateTeachingMethodology = async (subjectName: string) => {
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

export const seedServices = async () => {
  const tutorServices: TutorService[] = [];

  const tutorsSnapshot = await tutorsCollection.get();
  const subjectsSnapshot = await subjectCollection.get();

  if (tutorsSnapshot.empty || subjectsSnapshot.empty) {
    throw new Error("Tutors or subjects not found");
  }

  const tutors = tutorsSnapshot.docs.map((doc) => doc.id);
  const subjects = subjectsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
  }));

  for (let i = 0; i < 25; i++) {
    const randomTutorId = faker.helpers.arrayElement(tutors);
    const randomSubject = faker.helpers.arrayElement(subjects);
    const subjectTeachingMethodology = await generateTeachingMethodology(
      randomSubject.name,
    );

    if (!subjectTeachingMethodology) {
      throw new Error("Failed to generate teaching methodology");
    }

    tutorServices.push({
      id: firebase.firestore().collection("tmp").doc().id,
      tutorId: randomTutorId,
      subjectId: randomSubject.id,
      createdAt: new Date(),
      aboutYou: faker.lorem.paragraph(),
      teachingMethodology: subjectTeachingMethodology,
      hourlyRate: faker.helpers.arrayElement([
        50_000, 100_000, 150_000, 200_000,
      ]),
    });
  }

  console.log(`Seeding services with ${tutorServices.length} data...`);

  const batch = firestore.batch();

  tutorServices.forEach((service) => {
    const serviceRef = tutorServicesCollection.doc(service.id!);
    batch.set(serviceRef, {
      tutorId: tutorsCollection.doc(service.tutorId),
      subjectId: subjectCollection.doc(service.subjectId),
      aboutYou: service.aboutYou,
      teachingMethodology: service.teachingMethodology,
      hourlyRate: service.hourlyRate,
      createdAt: service.createdAt,
    });

    const tutorRef = tutorsCollection.doc(service.tutorId);
    batch.update(tutorRef, {
      services: firebase.firestore.FieldValue.arrayUnion(serviceRef),
    });
  });

  await batch.commit();
};
