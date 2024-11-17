import { firestore } from "@/config";
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

  const tutorsSnapshot = await firestore.collection("tutors").get();
  const subjectsSnapshot = await firestore.collection("subjects").get();

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
      hourlyRate: faker.helpers.arrayElement([50000, 100000, 150000, 200000]),
      typeLesson: faker.helpers.arrayElement(["online", "offline", "both"]),
    });
  }

  console.log(`Seeding services with ${tutorServices.length} data...`);

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
