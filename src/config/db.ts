import { firestore } from ".";
import { Learner, Subject, Tutor, TutorService } from "@/types";

const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T,
});

export const learnersCollection = firestore
  .collection("learners")
  .withConverter(converter<Learner>());

export const tutorsCollection = firestore
  .collection("tutors")
  .withConverter(converter<Tutor>());

export const tutorServicesCollection = firestore
  .collection("tutorServices")
  .withConverter(converter<TutorService>());

export const subjectCollection = firestore
  .collection("subjects")
  .withConverter(converter<Subject>());
