import { logger } from "@middleware/logging.middleware";
import {
  createTutorServiceSchema,
  updateTutorServiceSchema,
} from "@/module/tutor-service/tutorService.schema";
import firebase from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
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
  city?: string | null;
};

export class TutorServiceService {
  private firestore: Firestore;

  constructor({ firestore }: TutorServiceServiceDependencies) {
    this.firestore = firestore;
  }

  // TODO: Implement realtime updates for tutor service availability
  // - Use Realtime Database to track tutor online status
  // - Show real-time booking availability
  // - Update tutor's current location for nearby search

  // TODO: Add FCM notifications for service updates
  // - Notify learners when tutor services they're interested in change
  // - Send booking confirmation notifications
  // - Alert tutors of new booking requests
  async getTutorServices({
    q = null,
    subjectId = null,
    minHourlyRate = null,
    maxHourlyRate = null,
    typeLesson = null,
    tutorId = null,
    city = null,
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

      if (tutorId) {
        query = query.where(
          "tutorId",
          "==",
          this.firestore.doc(`/tutors/${tutorId}`),
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

      const batchSize = 25;
      const tutorIdBatches = Array.from(tutorIds).reduce<string[][]>(
        (batches, id, i) => {
          const batchIndex = Math.floor(i / batchSize);
          if (!batches[batchIndex]) {
            batches[batchIndex] = [];
          }
          batches[batchIndex].push(id);
          return batches;
        },
        [],
      );

      const subjectIdBatches = Array.from(subjectIds).reduce<string[][]>(
        (batches, id, i) => {
          const batchIndex = Math.floor(i / batchSize);
          if (!batches[batchIndex]) {
            batches[batchIndex] = [];
          }
          batches[batchIndex].push(id);
          return batches;
        },
        [],
      );

      const [tutorsData, subjectsData] = await Promise.all([
        Promise.all(
          tutorIdBatches.map((batch) =>
            this.firestore
              .collection("tutors")
              .where(firebase.firestore.FieldPath.documentId(), "in", batch)
              .get(),
          ),
        ),
        Promise.all(
          subjectIdBatches.map((batch) =>
            this.firestore
              .collection("subjects")
              .where(firebase.firestore.FieldPath.documentId(), "in", batch)
              .get(),
          ),
        ),
      ]);

      const tutorMap = new Map(
        tutorsData.flatMap((snapshot) =>
          snapshot.docs.map((doc) => [doc.id, doc.data()]),
        ),
      );

      const subjectMap = new Map(
        subjectsData.flatMap((snapshot) =>
          snapshot.docs.map((doc) => [doc.id, doc.data()]),
        ),
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

        if (city) {
          if (!tutorData.city?.toLowerCase().includes(city.toLowerCase())) {
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

      // TODO: reviews

      // Fetch all services by the same tutor, excluding the current serviceId
      const tutorServicesQuery = await this.firestore
        .collection("tutor_services")
        .where("tutorId", "==", tutorDoc.ref)
        .get();

      const alsoTeaches = await Promise.all(
        tutorServicesQuery.docs
          .filter((doc) => doc.id !== serviceId)
          .map(async (doc) => {
            const serviceData = doc.data();

            const subjectDoc = await serviceData.subjectId?.get();

            return {
              id: doc.id,
              subjectName: subjectDoc.data()?.name,
              hourlyRate: serviceData.hourlyRate,
              typeLesson: serviceData.typeLesson,
            };
          }),
      );

      return {
        id: tutorServiceDoc.id,
        tutorName: tutorData.name,
        subjectName: subjectData.name,
        hourlyRate: data.hourlyRate,
        typeLesson: data.typeLesson,
        aboutYou: data.aboutYou,
        teachingMethodology: data.teachingMethodology,
        location: tutorData.city,
        alsoTeaches,
      };
    } catch (error) {
      throw new Error(`Failed to get tutor service detail: ${error}`);
    }
  }

  async getTutorServiceAvailability(serviceId: string) {
    try {
      const tutorServiceDoc = await this.firestore
        .collection("tutor_services")
        .doc(serviceId)
        .get();

      const tutorService = tutorServiceDoc.data();
      if (!tutorService) {
        throw new Error("Tutor service not found");
      }

      const { availability } = tutorService;

      const today = new Date();
      const next7DaysAvailability: string[] = [];

      // TODO: handle when there is already order that has status 'scheduled'
      //       remove the time from availability

      // Calculate availability for the next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // 0: Sunday .. 6: Saturday
        const dayIndex = date.getUTCDay();
        const times = availability[dayIndex] || [];

        times.forEach((time: string) => {
          const [hours, minutes] = time.split(":").map(Number);

          const datetime = new Date(
            Date.UTC(
              date.getUTCFullYear(),
              date.getUTCMonth(),
              date.getUTCDate(),
              hours,
              minutes,
            ),
          );

          // Skip past times
          if (datetime < today) {
            return;
          }

          next7DaysAvailability.push(datetime.toISOString());
        });
      }

      return next7DaysAvailability;
    } catch (error) {
      throw new Error(`Failed to get tutor service availability: ${error}`);
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

  async getOrders(serviceId: string) {
    try {
      const ordersSnapshot = await this.firestore
        .collection("orders")
        .where("tutorServiceId", "==", serviceId)
        .get();

      return ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new Error(`Failed to get orders: ${error}`);
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
