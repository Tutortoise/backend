import { Firestore } from "firebase-admin/firestore";

export interface SubjectServiceDependencies {
  firestore: Firestore;
}

export class SubjectService {
  private firestore: Firestore;

  constructor({ firestore }: SubjectServiceDependencies) {
    this.firestore = firestore;
  }

  public async getAllSubjects() {
    try {
      const subjectsRef = this.firestore.collection("subjects");
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
  }

  public async checkSubjectExists(subjectId: string) {
    const subjectSnapshot = await this.firestore
      .collection("subjects")
      .doc(subjectId)
      .get();

    return subjectSnapshot.exists;
  }
}
