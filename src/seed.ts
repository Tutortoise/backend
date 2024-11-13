import { firestore, GCS_BUCKET_NAME } from "./config";
import { Subject } from "./types";

export const seedSubjects = async () => {
  const subjects: Subject[] = [
    {
      name: "Astronomy",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Astronomy.png`,
    },
    {
      name: "Photography",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Photography.png`,
    },
    {
      name: "Computer",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Computer.png`,
    },
    {
      name: "Cooking",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Cooking.png`,
    },
    {
      name: "Driving",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Driving.png`,
    },
    {
      name: "Football",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Football.png`,
    },
    {
      name: "Guitar",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Guitar.png`,
    },
    {
      name: "Karate",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Karate.png`,
    },
    {
      name: "Literature",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Literature.png`,
    },
    {
      name: "Mathematics",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Mathematics.png`,
    },
    {
      name: "Piano",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Piano.png`,
    },
    {
      name: "Public Speaking",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Public Speaking.png`,
    },
    {
      name: "Singing",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Singing.png`,
    },
    {
      name: "Swimming",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Swimming.png`,
    },
  ];

  await firestore
    .collection("subjects")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        subjects.forEach((subject) => {
          firestore.collection("subjects").add(subject);
        });
      }
    });
};

seedSubjects();
