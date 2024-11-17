import { logger } from "@middleware/logging.middleware";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@schemas/tutorService.schema";
import firebase from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { z } from "zod";

export interface TutorServiceServiceDependencies {
  firestore: Firestore;
}

export class TutorServiceService {
  private firestore: Firestore;

  constructor({ firestore }: TutorServiceServiceDependencies) {
    this.firestore = firestore;
  }

  async createTutorService(
    tutorId: string,
    data: z.infer<typeof createTutorServiceSchema>["body"],
  ) {
    const { subjectId, aboutYou, teachingMethodology, hourlyRate } = data;

    try {
      const batch = this.firestore.batch();

      const tutorRef = this.firestore.collection("tutors").doc(tutorId);
      const subjectRef = this.firestore.collection("subjects").doc(subjectId);

      const newServiceRef = this.firestore.collection("tutor_services").doc();
      batch.set(newServiceRef, {
        tutorId: tutorRef,
        subjectId: subjectRef,
        aboutYou,
        teachingMethodology,
        hourlyRate,
        createdAt: new Date(),
      });

      batch.update(tutorRef, {
        services: firebase.firestore.FieldValue.arrayUnion(newServiceRef),
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to create tutor service: ${error}`);
    }
  }

  async updateTutorService(
    serviceId: string,
    data: z.infer<typeof updateTutorServiceSchema>["body"],
  ) {
    try {
      await this.firestore
        .collection("tutor_services")
        .doc(serviceId)
        .update({
          ...data,
          updatedAt: new Date(),
        });
    } catch (error) {
      throw new Error(`Failed to update tutor service: ${error}`);
    }
  }

  async deleteTutorService(tutorId: string, serviceId: string) {
    try {
      const batch = this.firestore.batch();

      // delete the service
      const serviceDocRef = this.firestore
        .collection("tutor_services")
        .doc(serviceId);
      batch.delete(serviceDocRef);

      // delete the service from the tutor's services array
      const tutorDocRef = this.firestore.collection("tutors").doc(tutorId);
      batch.update(tutorDocRef, {
        services: firebase.firestore.FieldValue.arrayRemove(serviceDocRef),
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to delete tutor service: ${error}`);
    }
  }

  async validateTutorServiceOwnership(tutorId: string, serviceId: string) {
    try {
      const tutorServiceRef = this.firestore
        .collection("tutor_services")
        .doc(serviceId);
      const tutorService = await tutorServiceRef.get();

      if (!tutorService.exists) {
        return false;
      }

      return tutorService.data()!.tutorId.id === tutorId;
    } catch (error) {
      logger.error("Error validating tutor service ownership:", error);
      return false;
    }
  }
}
