import { logger } from "@middleware/logging.middleware";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@schemas/tutorService.schema";
import firebase from "firebase-admin";
import { DocumentData, Firestore } from "firebase-admin/firestore";
import { z } from "zod";

export interface TutorServiceServiceDependencies {
  firestore: Firestore;
}

type GetTutorServicesFilters = {
  q?: string | null;
  subjectId?: string | null;
  minHourlyRate?: number | null;
  maxHourlyRate?: number | null;
  typeLesson?: string | null;
};

export class TutorServiceService {
  private firestore: Firestore;

  constructor({ firestore }: TutorServiceServiceDependencies) {
    this.firestore = firestore;
  }

  async getTutorServices({
    q = null,
    subjectId = null,
    minHourlyRate = null,
    maxHourlyRate = null,
    typeLesson = null,
  }: GetTutorServicesFilters = {}) {
    try {
      let query = this.firestore.collection(
        "tutor_services",
      ) as FirebaseFirestore.Query<DocumentData>;

      if (subjectId) {
        query = query.where(
          "subjectId",
          "==",
          this.firestore.doc(`/subjects/${subjectId}`),
        );
      }

      if (minHourlyRate !== null) {
        query = query.where("hourlyRate", ">=", minHourlyRate);
      }
      if (maxHourlyRate !== null) {
        query = query.where("hourlyRate", "<=", maxHourlyRate);
      }

      if (typeLesson !== null) {
        query = query.where("typeLesson", "==", typeLesson);
      }

      const tutorServicesSnapshot = await query.get();

      const tutorServices = await Promise.all(
        tutorServicesSnapshot.docs.map(async (doc) => {
          const data = doc.data();

          const subjectDoc = await data.subjectId.get();
          const tutorDoc = await data.tutorId.get();
          const tutorName = tutorDoc.data()?.name.toLowerCase();
          const subjectName = subjectDoc.data()?.name.toLowerCase();

          // TODO: avg rating from review here
          // const rating = 0;
          // TODO: check if tutor is star tutor
          // const isStarTutor = false;

          // filter the tutor services in memory instead of querying the database
          if (q) {
            const query = q.toLowerCase();
            if (!tutorName.includes(query) && !subjectName.includes(query)) {
              return null;
            }
          }

          return {
            id: doc.id,
            tutorName: tutorDoc.data().name,
            subjectName: subjectDoc.data().name,
            hourlyRate: data.hourlyRate,
            typeLesson: data.typeLesson,
          };
        }),
      );

      return tutorServices.filter((service) => service !== null);
    } catch (error) {
      throw new Error(`Failed to get tutor services: ${error}`);
    }
  }

  async getTutorServiceDetail(serviceId: string) {
    try {
      const tutorServiceDoc = await this.firestore
        .collection("tutor_services")
        .doc(serviceId)
        .get();

      if (!tutorServiceDoc.exists) {
        return null;
      }

      const data = tutorServiceDoc.data()!;

      const subjectDoc = await data.subjectId.get();
      const tutorDoc = await data.tutorId.get();

      // TODO: also teaches
      // TODO: location
      // TODO: reviews

      return {
        id: tutorServiceDoc.id,
        tutorName: tutorDoc.data().name,
        subjectName: subjectDoc.data().name,
        hourlyRate: data.hourlyRate,
        typeLesson: data.typeLesson,
        aboutYou: data.aboutYou,
        teachingMethodology: data.teachingMethodology,
      };
    } catch (error) {
      throw new Error(`Failed to get tutor service detail: ${error}`);
    }
  }

  async createTutorService(
    tutorId: string,
    data: z.infer<typeof createTutorServiceSchema>["body"],
  ) {
    const { subjectId, aboutYou, teachingMethodology, hourlyRate, typeLesson } =
      data;

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
        typeLesson,
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
