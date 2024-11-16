import { subjectCollection } from "@/config/db";

export const getAllSubjects = async () => {
  try {
    const snapshot = await subjectCollection.get();

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

export const checkSubjectExists = async (subjectId: string) => {
  const subjectSnapshot = await subjectCollection.doc(subjectId).get();

  return subjectSnapshot.exists;
};
