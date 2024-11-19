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
  tutorId?: string | null;
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
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        this.firestore.collection("tutor_services");

      if (subjectId) {
        query = query.where(
          "subjectId",
          "==",
          this.firestore.doc(`/subjects/${subjectId}`),
        );
      }

      if (minHourlyRate !== null && maxHourlyRate !== null) {
        query = query
          .where("hourlyRate", ">=", minHourlyRate)
          .where("hourlyRate", "<=", maxHourlyRate)
          .orderBy("hourlyRate");
      } else if (minHourlyRate !== null) {
        query = query.where("hourlyRate", ">=", minHourlyRate);
      } else if (maxHourlyRate !== null) {
        query = query.where("hourlyRate", "<=", maxHourlyRate);
      }

      if (typeLesson) {
        query = query.where("typeLesson", "==", typeLesson);
      }

      const tutorServicesSnapshot = await query.get();

      const tutorIds = new Set<string>();
      const subjectIds = new Set<string>();

      tutorServicesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.tutorId?.id && data.subjectId?.id) {
          tutorIds.add(data.tutorId.id);
          subjectIds.add(data.subjectId.id);
        }
      });

      if (tutorIds.size === 0 || subjectIds.size === 0) {
        return [];
      }

      const [tutorsSnapshot, subjectsSnapshot] = await Promise.all([
        this.firestore
          .collection("tutors")
          .where(
            firebase.firestore.FieldPath.documentId(),
            "in",
            Array.from(tutorIds),
          )
          .get(),
        this.firestore
          .collection("subjects")
          .where(
            firebase.firestore.FieldPath.documentId(),
            "in",
            Array.from(subjectIds),
          )
          .get(),
      ]);

      const tutorMap = new Map(
        tutorsSnapshot.docs.map((doc) => [doc.id, doc.data()]),
      );
      const subjectMap = new Map(
        subjectsSnapshot.docs.map((doc) => [doc.id, doc.data()]),
      );

      const tutorServices = tutorServicesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const tutorData = tutorMap.get(data.tutorId?.id);
        const subjectData = subjectMap.get(data.subjectId?.id);

        if (!tutorData?.name || !subjectData?.name) {
          return null;
        }

        const tutorName = tutorData.name;
        const subjectName = subjectData.name;

        if (q) {
          const query = q.toLowerCase();
          if (
            !tutorName.toLowerCase().includes(query) &&
            !subjectName.toLowerCase().includes(query)
          ) {
            return null;
          }
        }

        return {
          id: doc.id,
          tutorName,
          subjectName,
          hourlyRate: data.hourlyRate,
          typeLesson: data.typeLesson,
          // TODO: avg rating from review here
          // TODO: check if tutor is star tutor
        };
      });

      return tutorServices.filter(
        (service): service is NonNullable<typeof service> => service !== null,
      );
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

      const data = tutorServiceDoc.data();
      if (!data) {
        return null;
      }

      const [subjectDoc, tutorDoc] = await Promise.all([
        data.subjectId?.get(),
        data.tutorId?.get(),
      ]);

      if (!subjectDoc?.exists || !tutorDoc?.exists) {
        return null;
      }

      const subjectData = subjectDoc.data();
      const tutorData = tutorDoc.data();

      if (!subjectData || !tutorData) {
        return null;
      }

      // TODO: also teaches
      // TODO: location
      // TODO: reviews

      return {
        id: tutorServiceDoc.id,
        tutorName: tutorData.name,
        subjectName: subjectData.name,
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
    const {
      subjectId,
      aboutYou,
      teachingMethodology,
      hourlyRate,
      typeLesson,
      availability,
    } = data;

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
        availability,
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

  async checkServiceExists(serviceId: string) {
    try {
      const tutorServiceRef = this.firestore
        .collection("tutor_services")
        .doc(serviceId);
      const tutorService = await tutorServiceRef.get();

      return tutorService.exists;
    } catch (error) {
      logger.error("Error checking if tutor service exists:", error);
      return false;
    }
  }
}
