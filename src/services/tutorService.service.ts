import { firestore } from "@/config";
import { createTutorServiceSchema } from "@schemas/tutorService.schema";
import firebase from "firebase-admin";
import { z } from "zod";

export const createTutorService = async (
  tutorId: string,
  data: z.infer<typeof createTutorServiceSchema>["body"],
) => {
  const { subjectId, aboutYou, teachingMethodology, hourlyRate } = data;

  try {
    const batch = firestore.batch();

    const tutorRef = firestore.collection("tutors").doc(tutorId);
    const subjectRef = firestore.collection("subjects").doc(subjectId);

    const newServiceRef = firestore.collection("tutor_services").doc();
    batch.set(newServiceRef, {
      tutorId: tutorRef,
      subjectId: subjectRef,
      aboutYou,
      teachingMethodology,
      hourlyRate,
      createdAt: new Date(),
    });

    batch.update(firestore.collection("tutors").doc(tutorId), {
      services: firebase.firestore.FieldValue.arrayUnion(newServiceRef),
    });

    await batch.commit();
  } catch (error) {
    throw new Error(`Failed to create tutor service: ${error}`);
  }
};
