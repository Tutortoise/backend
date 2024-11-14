import { firestore } from "@/config";

export const getAllSubjects = async () => {
  try {
    const subjectsRef = firestore.collection("subjects");
    const snapshot = await subjectsRef.get();

    const subjects = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        name: doc.data().name,
        iconUrl: doc.data().iconUrl,
      };
    });

    return subjects;
  } catch (error) {
    throw new Error(`Error when getting all subjects: ${error}`);
  }
};
