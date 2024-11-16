import { firestore } from "@/config";
import {
  subjectCollection,
  tutorsCollection,
  tutorServicesCollection,
} from "@/config/db";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@schemas/tutorService.schema";
import firebase from "firebase-admin";
import { z } from "zod";

export const createTutorService = async (
  tutorId: string,
  data: z.infer<typeof createTutorServiceSchema>["body"],
) => {
  const { subjectId, aboutYou, teachingMethodology, hourlyRate } = data;

  try {
    const batch = firestore.batch();

    const tutorRef = tutorsCollection.doc(tutorId);
    const subjectRef = subjectCollection.doc(subjectId);

    const newServiceRef = tutorServicesCollection.doc();
    batch.set(newServiceRef, {
      tutorId: tutorRef,
      subjectId: subjectRef,
      aboutYou,
      teachingMethodology,
      hourlyRate,
      createdAt: new Date(),
    });

    batch.update(tutorsCollection.doc(tutorId), {
      services: firebase.firestore.FieldValue.arrayUnion(newServiceRef),
    });

    await batch.commit();
  } catch (error) {
    throw new Error(`Failed to create tutor service: ${error}`);
  }
};

export const updateTutorService = async (
  serviceId: string,
  data: z.infer<typeof updateTutorServiceSchema>["body"],
) => {
  try {
    await tutorServicesCollection.doc(serviceId).update({
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(`Failed to update tutor service: ${error}`);
  }
};
