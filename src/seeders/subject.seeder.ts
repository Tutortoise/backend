import { GCS_BUCKET_NAME } from "@/config";
import { subjectCollection } from "@/config/db";
import { Subject } from "@/types";

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
    {
      name: "Painting",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Painting.png`,
    },
    {
      name: "English",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/English.png`,
    },
    {
      name: "Tennis",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Tennis.png`,
    },
    {
      name: "Chinese",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Chinese.png`,
    },
    {
      name: "Chemistry",
      iconUrl: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/subjects/Chemistry.png`,
    },
  ];

  console.log(`Seeding subjects with ${subjects.length} data...`);
  await subjectCollection.get().then((snapshot) => {
    if (snapshot.empty) {
      subjects.forEach((subject) => {
        subjectCollection.add(subject);
      });
    }
  });
};
